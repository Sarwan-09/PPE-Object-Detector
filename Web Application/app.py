from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import numpy as np
import cv2
from ultralytics import YOLO
import uuid
import os
import base64
import logging
from logging.config import dictConfig

# Logging configuration
dictConfig({
    "version": 1,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(levelname)s - %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"],
    },
})

logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MODEL_PATH = "best.pt"  # Update with your model path

# Load YOLO model
model = YOLO(MODEL_PATH)

# In-memory storage for detection history
detection_history = []

# Models
class DetectionBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_name: str

class DetectionResult(BaseModel):
    id: str
    timestamp: datetime
    type: str
    objects: List[str]
    boxes: List[DetectionBox]
    imageUrl: Optional[str] = None
    base64_image: Optional[str] = None

# Helper functions
def process_detection(img, results):
    detected_objects = []
    detection_boxes = []
    
    # Get image dimensions
    height, width = img.shape[:2]
    
    # Draw boxes on image
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # Get box coordinates
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            confidence = float(box.conf[0].cpu().numpy())
            class_id = int(box.cls[0].cpu().numpy())
            class_name = r.names[class_id]
            
            # Add to lists
            detected_objects.append(class_name)
            detection_boxes.append(DetectionBox(
                x1=float(x1),
                y1=float(y1),
                x2=float(x2),
                y2=float(y2),
                confidence=confidence,
                class_name=class_name
            ))
            
            # Draw on image
            cv2.rectangle(img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(img, label, (int(x1), int(y1)-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # Convert image to base64
    _, buffer = cv2.imencode('.jpg', img)
    base64_image = base64.b64encode(buffer).decode('utf-8')
    
    return detected_objects, detection_boxes, base64_image

# Endpoints
@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    try:
        logger.info(f"Processing detection request for file: {file.filename}")
        
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        results = model(img)
        detected_objects, detection_boxes, base64_image = process_detection(img, results)
        
        detection = DetectionResult(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            type="live",
            objects=list(set(detected_objects)),
            boxes=detection_boxes,
            base64_image=base64_image
        )
        
        detection_history.append(detection)
        logger.info(f"Detection completed. Found {len(detection.objects)} objects")
        
        return {
            "objects": detection.objects,
            "boxes": detection.boxes,
            "base64_image": detection.base64_image
        }
        
    except Exception as e:
        logger.error(f"Error during object detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        logger.info(f"Receiving upload request for file: {file.filename}")
        
        # Validate file content type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save file
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        contents = await file.read()
        
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        # Read image for detection
        img = cv2.imread(file_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Failed to read image")
        
        # Run detection
        logger.debug("Running object detection")
        results = model(img)
        detected_objects, detection_boxes, base64_image = process_detection(img, results)
        
        # Create unique detection record
        detection = DetectionResult(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            type="upload",
            objects=list(set(detected_objects)),
            boxes=detection_boxes,
            imageUrl=file_path,
            base64_image=base64_image
        )
        
        # Add to history
        detection_history.append(detection)
        logger.info(f"Upload and detection completed. Found {len(detection.objects)} unique objects")
        
        return {
            "objects": detection.objects,
            "boxes": detection.boxes,
            "base64_image": detection.base64_image
        }
        
    except Exception as e:
        logger.error(f"Error during image upload and detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history():
    return {"history": detection_history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)