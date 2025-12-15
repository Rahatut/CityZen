from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI()

model = YOLO("pothole_model.pt")

@app.post("/detect")
async def detect_pothole(image: UploadFile = File(...)):
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    results = model(img)

    boxes = results[0].boxes

    if boxes is not None and len(boxes) > 0:
        confidence = float(boxes.conf[0]) * 100
        label = "Pothole"
    else:
        confidence = 0.0
        label = "No Pothole"

    return {
        "label": label,
        "confidence": round(confidence, 2)
    }
