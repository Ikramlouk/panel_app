import os
import json
import cv2
from ultralytics import YOLO

# Kanloadi l'modèle dyalek
model = YOLO('best.pt')
dataset_path = '../backend/uploads/snapshots3'
results_data = []

# L'classes li kaynin f l'modèle dyalek
# Screen = Nadi (OK), L'ba9i = Anomalie
anomaly_classes = ['Lines', 'Dark Spot', 'cable issues']

print("⏳ Bdayt l'détection...")

for folder in os.listdir(dataset_path):
    folder_path = os.path.join(dataset_path, folder)
    if os.path.isdir(folder_path):
        for file in os.listdir(folder_path):
            if file.endswith(('.jpg', '.png', '.jpeg')):
                img_path = os.path.join(folder_path, file)

                # 1. Nchofo wach l'tswira m9rouwa
                img = cv2.imread(img_path)
                if img is None:
                    print(f"❌ Tswira khassra wla khawya: {file}. Ghadi nt3adawha...")
                    continue

                try:
                    # 2. YOLO kaydetecti
                    results = model(img_path, conf=0.25)
                    
                    detected_classes = []
                    if results and len(results) > 0 and len(results[0].boxes) > 0:
                        for box in results[0].boxes:
                            class_name = model.names[int(box.cls[0])]
                            confidence = float(box.conf[0])
                            detected_classes.append((class_name, confidence))
                    
                    # 3. N9arro wach fiha anomalie
                    found_anomaly = None
                    for cls_name, conf in detected_classes:
                        if cls_name in anomaly_classes:
                            found_anomaly = (cls_name, conf)
                            break
                    
                    if found_anomaly:
                        results_data.append({
                            "folder": folder,
                            "image": file,
                            "status": "anomalie",
                            "class": found_anomaly[0], 
                            "confidence": found_anomaly[1]
                        })
                        print(f"⚠️ Anomalie f: {folder} ({found_anomaly[0]})")
                    else:
                        results_data.append({
                            "folder": folder,
                            "image": file,
                            "status": "ok",
                            "class": None,
                            "confidence": 0.0
                        })
                        print(f"✅ OK: {folder}")
                        
                except Exception as e:
                    print(f"❌ Erreur f {file}: {e}")

with open('results.json', 'w') as f:
    json.dump(results_data, f)

print("🎉 Salat l'détection! L'natija mkhzena f results.json")