from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import numpy as np
import cv2
from ultralytics import YOLO
import uuid
import os
from PIL import Image
import io
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI()

# Add CORS middleware with updated settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5174"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLO model
try:
    model = YOLO('best.pt')
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {str(e)}")
    raise

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Store detection history in memory
detection_history = []

class DetectionResult(BaseModel):
    id: str
    timestamp: datetime
    type: str
    objects: List[str]
    imageUrl: Optional[str] = None

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    try:
        logger.info(f"Receiving detection request for file: {file.filename}")
        
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error("Failed to decode image")
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Run detection
        logger.debug("Running object detection")
        results = model(img)
        
        # Get detected objects
        detected_objects = []
        for r in results:
            for c in r.boxes.cls:
                object_name = r.names[int(c)]
                detected_objects.append(object_name)
                logger.debug(f"Detected object: {object_name}")
        
        if not detected_objects:
            logger.warning("No objects detected in the image")
        
        # Create unique detection record
        detection = DetectionResult(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            type="live",
            objects=list(set(detected_objects))
        )
        
        # Add to history
        detection_history.append(detection)
        logger.info(f"Detection completed. Found {len(detection.objects)} unique objects")
        
        return {"objects": detection.objects}
        
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
        
        # Get detected objects
        detected_objects = []
        for r in results:
            for c in r.boxes.cls:
                object_name = r.names[int(c)]
                detected_objects.append(object_name)
                logger.debug(f"Detected object: {object_name}")
        
        # Create unique detection record
        detection = DetectionResult(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            type="upload",
            objects=list(set(detected_objects)),
            imageUrl=file_path
        )
        
        # Add to history
        detection_history.append(detection)
        logger.info(f"Upload and detection completed. Found {len(detection.objects)} unique objects")
        
        return {"objects": detection.objects}
        
    except Exception as e:
        logger.error(f"Error during image upload and detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history():
    return {"history": detection_history}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)