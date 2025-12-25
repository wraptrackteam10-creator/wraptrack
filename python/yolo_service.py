from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import os
import io

app = FastAPI()

# CORS (same as Flask)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load YOLO model ONCE
model = YOLO(os.path.join(BASE_DIR, "my_model.pt"))

# Load class names
with open(os.path.join(BASE_DIR, "classes.txt")) as f:
    class_names = [line.strip() for line in f]

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    if not image:
        return {"error": "No image"}

    # Read image
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Optional but recommended for speed
    img = img.resize((640, 640))

    # YOLO prediction (CPU or GPU auto-detect)
    results = model.predict(
        img,
        imgsz=640,
        conf=0.5,
        verbose=False
    )

    detections = []
    for box in results[0].boxes:
        conf = float(box.conf[0])
        if conf < 0.5:
            continue

        cls_id = int(box.cls[0])
        detections.append({
            "class": class_names[cls_id],
            "confidence": conf
        })

    return {"detections": detections}
