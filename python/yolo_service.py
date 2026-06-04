from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import torch

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.1.42:3000",
        "http://172.10.45.78:3000",
        "http://172.28.131.221:3000",
        "https://wraptrack.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model ONCE on startup
device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO("my_model.pt").to(device)

# Load class names
with open("classes.txt") as f:
    class_names = [line.strip() for line in f]

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model.predict(
        img,
        imgsz=640,
        conf=0.5,
        device=device,
        verbose=False
    )

    detections = []
    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        detections.append({
            "class": class_names[cls_id],
            "confidence": conf
        })

    return {"detections": detections}
