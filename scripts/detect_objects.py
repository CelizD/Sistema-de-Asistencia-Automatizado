#!/usr/bin/env python3
"""
Script de detección de objetos usando YOLOv8
Detecta personas y sillas en imágenes
"""

import sys
import json
import os

def detect_objects(image_path, confidence_threshold=0.5):
    """
    Detecta personas y sillas en una imagen usando YOLO
    
    Args:
        image_path: Ruta a la imagen
        confidence_threshold: Umbral de confianza mínimo
        
    Returns:
        dict con personCount, chairCount, occupancyRate, detections
    """
    try:
        # Intentar importar dependencias
        try:
            import cv2
            from ultralytics import YOLO
            import numpy as np
        except ImportError as e:
            # Si las dependencias no están instaladas, retornar resultado vacío
            return {
                "personCount": 0,
                "chairCount": 0,
                "occupancyRate": 0,
                "confidence": 0,
                "detections": [],
                "error": f"Dependencias no instaladas: {str(e)}"
            }
        
        # Cargar modelo YOLO (se descarga automáticamente la primera vez)
        model = YOLO("yolov8n.pt")  # Modelo nano (más rápido)
        
        # Leer imagen
        if not os.path.exists(image_path):
            return {
                "personCount": 0,
                "chairCount": 0,
                "occupancyRate": 0,
                "confidence": 0,
                "detections": [],
                "error": f"Imagen no encontrada: {image_path}"
            }
        
        # Ejecutar detección
        results = model(image_path, conf=confidence_threshold)
        
        # Procesar resultados
        person_count = 0
        chair_count = 0
        detections = []
        
        # Clases de COCO dataset
        # 0 = person, 56 = chair
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()
                
                # Convertir coordenadas
                x1, y1, x2, y2 = xyxy
                bbox = {
                    "x": int(x1),
                    "y": int(y1),
                    "width": int(x2 - x1),
                    "height": int(y2 - y1)
                }
                
                class_name = model.names[cls]
                
                # Contar personas
                if cls == 0:  # person
                    person_count += 1
                    detections.append({
                        "class": "person",
                        "confidence": round(conf, 2),
                        "bbox": bbox
                    })
                
                # Contar sillas
                elif cls == 56:  # chair
                    chair_count += 1
                    detections.append({
                        "class": "chair",
                        "confidence": round(conf, 2),
                        "bbox": bbox
                    })
        
        # Calcular tasa de ocupación
        if chair_count > 0:
            occupancy_rate = min(100, int((person_count / chair_count) * 100))
        else:
            # Si no hay sillas detectadas, asumimos ocupación basada en presencia de personas
            occupancy_rate = 100 if person_count > 0 else 0
        
        # Calcular confianza promedio
        if detections:
            avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
        else:
            avg_confidence = 0
        
        return {
            "personCount": person_count,
            "chairCount": chair_count,
            "occupancyRate": occupancy_rate,
            "confidence": round(avg_confidence, 2),
            "detections": detections
        }
        
    except Exception as e:
        return {
            "personCount": 0,
            "chairCount": 0,
            "occupancyRate": 0,
            "confidence": 0,
            "detections": [],
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Usage: python detect_objects.py <image_path> [confidence_threshold]"
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    confidence_threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
    
    result = detect_objects(image_path, confidence_threshold)
    print(json.dumps(result))
