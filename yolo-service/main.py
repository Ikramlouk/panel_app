from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hna ghadi n9ra l'modèle dyalek li smitih best.pt
try:
    model = YOLO('best.pt') 
    print("✅ Modèle best.pt mconnecté!")
except Exception as e:
    print("⚠️ Ma l9itich best.pt, ghadi nkhdem b yolo11n.pt l'test")
    model = YOLO('yolo11n.pt')

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(img, conf=0.25) 

    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class": model.names[int(box.cls[0])],
                "confidence": float(box.conf[0]),
                "bbox": box.xyxy[0].tolist() 
            })

    return {"detections": detections}

@app.get("/health")
def health():
    return {"status": "ok"}