import os
import uvicorn
import json
import base64
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Configure the OpenRouter API
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env file")

client = OpenAI(
    api_key=api_key,
    base_url="https://openrouter.ai/api/v1"
)

app = FastAPI()

# -------------------- Utilities --------------------

def extract_json_from_response(text: str):
    """Extract JSON object or array from LLM output."""
    try:
        # Prefer object
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and start < end:
            return json.loads(text[start:end + 1])

        # Fallback to array
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end != -1 and start < end:
            return json.loads(text[start:end + 1])

        return None
    except json.JSONDecodeError:
        return None

# -------------------- Models --------------------

class Prompt(BaseModel):
    prompt: str

class Authority(BaseModel):
    id: int
    name: str

class RecommendationRequest(BaseModel):
    category: str
    latitude: float
    longitude: float
    authorities: list[Authority]
    location_string: Optional[str] = None

class GenerateComplaintTextRequest(BaseModel):
    category: str
    confidence: float
    latitude: float
    longitude: float
    location_string: Optional[str] = None

# -------------------- Vision Detection (LLM) --------------------

@app.post("/detect_with_llm")
async def detect_with_llm(
    image: UploadFile = File(...),
    categories: str = Form(...) # Add categories as a Form parameter
):
    try:
        # ---- Validation ----
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_bytes = await image.read()
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Parse categories
        category_list: List[Dict[str, Any]] = json.loads(categories)
        allowed_category_names = [cat['name'] for cat in category_list]
        category_name_to_id = {cat['name']: cat['id'] for cat in category_list}

        # Add "No Issue" as a special category for the LLM
        allowed_category_names_for_llm = allowed_category_names + ["No Issue"]

        prompt = f"""
You are a civic issue detection AI for Dhaka city.

Analyze the image and identify the SINGLE most relevant issue.

Allowed categories:
{chr(10).join([f'- {name}' for name in allowed_category_names_for_llm])}

Rules:
- Return ONLY valid JSON
- Pick exactly ONE category from the list
- Confidence must be a number between 0 and 100
- If unsure or image is unclear, return:
  {{ "label": "No Issue", "confidence": 40 }}

Output JSON schema:
{{
  "label": "string",
  "confidence": number
}}
"""

        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
        )

        content = response.choices[0].message.content
        parsed = extract_json_from_response(content)

        if not parsed or "label" not in parsed:
            raise ValueError("Invalid JSON from vision model")

        # ---- Normalize confidence ----
        confidence = parsed.get("confidence", 0)
        try:
            confidence = int(float(confidence))
        except Exception:
            confidence = 0

        confidence = max(0, min(100, confidence))

        # Get the ID for the detected label
        detected_label = parsed["label"]
        category_id = category_name_to_id.get(detected_label)

        if detected_label != "No Issue" and category_id is None:
            # If LLM returned an unknown category and it's not "No Issue",
            # fallback to "No Issue" or raise an error.
            # For now, let's return it with id as None or handle as "No Issue".
            # It's safer to return "No Issue" if the label is not found in allowed categories
            detected_label = "No Issue"
            category_id = None # Or the ID of "No Issue" if it exists in DB

        return {
            "id": category_id,
            "label": detected_label,
            "confidence": confidence
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- Text Generation --------------------

@app.post("/generate")
async def generate_text(request: Prompt):
    """
    Receives a prompt and returns text generated by the OpenRouter model.
    """
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct",
            messages=[{"role": "user", "content": request.prompt}]
        )
        return {"text": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- Complaint Text --------------------

@app.post("/generate_complaint_text")
async def generate_complaint_text(request: GenerateComplaintTextRequest):
    """
    Generates an appropriate title and description for a complaint
    based on the detected category and location using OpenRouter.
    """
    location_info = f"({request.latitude}, {request.longitude})"
    if request.location_string:
        location_info = f"{request.location_string} ({request.latitude}, {request.longitude})"

    prompt = (
        f"You are an AI assistant specialized in generating civic complaint details for Dhaka city.\n\n"
        f"Generate a concise title (max 10 words) and brief description (max 25 words) for a complaint based on following details:\n\n"
        f"Detected Category: {request.category}\n"
        f"AI Confidence: {request.confidence}%\n"
        f"Location: {location_info}\n\n"
        f"Rules:\n"
        f"- Title should be engaging & informative for general public. Add general location info - NO coordinates.\n"
        f"- Description should be simple and summarize the issue, its severity & hazards.\n"
        f"- If detected category is ambiguous, give a generic description.\n"
        f"- Return ONLY valid JSON.\n\n"
        f"Output format:\n"
        f"{{\n"
        f"  \"title\": \"string\",\n"
        f"  \"description\": \"string\"\n"
        f"}}"
    )
    try:
        print("-----GENERATE COMPLAINT TEXT PROMPT-----")
        print(prompt)
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        print("-----GENERATE COMPLAINT TEXT RESPONSE-----")
        print(response.choices[0].message.content)
        
        # Extract JSON from the response
        parsed_json = extract_json_from_response(response.choices[0].message.content)
        
        if parsed_json:
            return parsed_json
        else:
            raise ValueError("No valid JSON found in the model's response.")
            
    except Exception as e:
        print("-----GENERATE COMPLAINT TEXT ERROR-----")
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
