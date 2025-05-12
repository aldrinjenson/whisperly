import os
import logging
import base64
from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
from tempfile import NamedTemporaryFile
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()  # Load environment variables from .env

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")
openai.api_key = OPENAI_API_KEY

class AudioData(BaseModel):
    audio_data: str
    file_name: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/debug")
async def debug_endpoint(request: Request):
    """Debug endpoint to check request details"""
    headers = {k: v for k, v in request.headers.items()}
    client = request.client.host if request.client else "Unknown"
    
    return {
        "client_host": client,
        "headers": headers,
        "url": str(request.url),
        "method": request.method,
    }

@app.post("/debug")
async def debug_post(request: Request):
    """Debug endpoint for POST requests"""
    headers = {k: v for k, v in request.headers.items()}
    client = request.client.host if request.client else "Unknown"
    
    return {
        "client_host": client,
        "headers": headers,
        "url": str(request.url),
        "method": request.method,
    }

@app.post("/transcribe")
@app.post("/transcribe/")
async def transcribe_audio(request: Request, file: Optional[UploadFile] = File(None), audio_data: Optional[Dict[str, Any]] = Body(None)):
    """Transcribe audio from file upload or base64 data"""
    logger.info(f"Received transcription request at URL: {request.url}")
    logger.info(f"Request headers: {dict(request.headers)}")
    
    # Check if we're receiving base64 data
    if audio_data and "audio_data" in audio_data:
        logger.info(f"Received base64 audio data, file_name: {audio_data.get('file_name', 'unknown.m4a')}")
        try:
            # Decode base64 data
            audio_bytes = base64.b64decode(audio_data["audio_data"])
            logger.info(f"Decoded base64 data, size: {len(audio_bytes)} bytes")
            
            if len(audio_bytes) == 0:
                error_msg = "Decoded audio data is empty"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
                
            # Save to temporary file
            file_extension = ".m4a"
            with NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
                logger.info(f"Saving base64 audio to temporary file: {tmp.name}")
                tmp.write(audio_bytes)
                tmp_path = tmp.name
                
            # Process with OpenAI
            logger.info("Sending file to OpenAI Whisper API")
            with open(tmp_path, "rb") as audio_file:
                try:
                    transcript = openai.Audio.transcribe("whisper-1", audio_file)
                    logger.info("Received transcription from OpenAI")
                except Exception as whisper_error:
                    logger.error(f"OpenAI Whisper API error: {str(whisper_error)}")
                    raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(whisper_error)}")
            
            os.remove(tmp_path)
            logger.info("Temporary file removed")
            
            return JSONResponse({"transcription": transcript["text"]})
        except Exception as e:
            logger.error(f"Error processing base64 audio: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
    
    # Traditional file upload
    if not file:
        logger.error("No file or audio data provided")
        raise HTTPException(status_code=400, detail="No file or audio data provided")
        
    logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
    
    # More flexible content type checking
    valid_audio_types = ["audio/", "video/", "application/octet-stream"]
    is_valid = any(file.content_type.startswith(prefix) for prefix in valid_audio_types)
    
    if not is_valid:
        error_msg = f"Invalid file type: {file.content_type}. Please upload an audio file."
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        # Save the uploaded file to a temporary file
        file_extension = ".mp3"  # Default extension
        if "m4a" in file.content_type or file.filename.endswith(".m4a"):
            file_extension = ".m4a"
        
        with NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            logger.info(f"Saving uploaded file to temporary file: {tmp.name}")
            contents = await file.read()
            logger.info(f"File size: {len(contents)} bytes")
            
            if len(contents) == 0:
                error_msg = "Uploaded file is empty"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
                
            tmp.write(contents)
            tmp_path = tmp.name
        
        # Send to OpenAI Whisper
        logger.info("Sending file to OpenAI Whisper API")
        with open(tmp_path, "rb") as audio_file:
            try:
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
                logger.info("Received transcription from OpenAI")
            except Exception as whisper_error:
                logger.error(f"OpenAI Whisper API error: {str(whisper_error)}")
                raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(whisper_error)}")
        
        os.remove(tmp_path)
        logger.info("Temporary file removed")
        
        return JSONResponse({"transcription": transcript["text"]})
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 