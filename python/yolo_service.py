from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

model = YOLO(r"C:\Users\Windows 11Pro\Desktop\WTSystem\python\my_model.pt")

with open(r"C:\Users\Windows 11Pro\Desktop\WTSystem\python\classes.txt") as f:
    class_names = [line.strip() for line in f]

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image"}), 400

    image_file = request.files["image"]
    image = Image.open(image_file.stream).convert("RGB")

    results = model.predict(image, verbose=False)

    detections = []
    r = results[0]

    for box in r.boxes:
        cls_id = int(box.cls[0])
        cls_name = class_names[cls_id]
        conf = float(box.conf[0])

        detections.append({
            "class": cls_name,
            "confidence": conf
        })

    return jsonify({ "detections": detections })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
