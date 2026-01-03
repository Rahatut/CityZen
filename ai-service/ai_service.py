from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI()

# Load your models
pothole_model = YOLO("pothole_model.pt")
manhole_model = YOLO("manhole_model.pt")

@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    detections = []

    # Run pothole model
    results = pothole_model(img)
    boxes = results[0].boxes
    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            detections.append({
                "label": "Pothole",
                "confidence": round(float(box.conf) * 100, 2)
            })

    # Run manhole model
    results = manhole_model(img)
    boxes = results[0].boxes
    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            # box.cls gives the class index, use it to get class name
            class_name = manhole_model.names[int(box.cls)]
            if class_name == "closed_manhole":
                continue  # skip it
            detections.append({
                "label": class_name,
                "confidence": round(float(box.conf) * 100, 2)
            })

    if not detections:
        detections.append({"label": "No Detection", "confidence": 0.0})

    return {"detections": detections}