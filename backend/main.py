import os
import logging
import base64
from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from tempfile import NamedTemporaryFile
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()  # Load environment variables from .env

app = FastAPI(title="Whisperly API", 
              description="Audio transcription API for Whisperly",
              version="1.0.0")

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

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

class AudioData(BaseModel):
    audio_data: str
    file_name: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe_audio(request: Request, file: Optional[UploadFile] = File(None), audio_data: Optional[Dict[str, Any]] = Body(None)):
    """Transcribe audio from file upload or base64 data"""
    # Check if we're receiving base64 data
    if audio_data and "audio_data" in audio_data:
        try:
            # Decode base64 data
            audio_bytes = base64.b64decode(audio_data["audio_data"])
            
            if len(audio_bytes) == 0:
                raise HTTPException(status_code=400, detail="Decoded audio data is empty")
                
            # Save to temporary file
            file_extension = ".m4a"
            with NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
                
            # Process with OpenAI using new API format
            with open(tmp_path, "rb") as audio_file:
                try:
                    transcript = client.audio.transcriptions.create(
                        # model="whisper-1",
                        model="gpt-4o-transcribe",
                        file=audio_file
                    )
                    transcription_text = transcript.text
                except Exception as whisper_error:
                    logger.error(f"OpenAI API error: {str(whisper_error)}")
                    raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(whisper_error)}")
            
            os.remove(tmp_path)
            
            return JSONResponse({"transcription": transcription_text})
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error processing base64 audio: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Traditional file upload
    if not file:
        raise HTTPException(status_code=400, detail="No file or audio data provided")
        
    # More flexible content type checking
    valid_audio_types = ["audio/", "video/", "application/octet-stream"]
    is_valid = any(file.content_type.startswith(prefix) for prefix in valid_audio_types)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}. Please upload an audio file.")
    
    try:
        # Save the uploaded file to a temporary file
        file_extension = ".mp3"  # Default extension
        if "m4a" in file.content_type or file.filename.endswith(".m4a"):
            file_extension = ".m4a"
        
        with NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            contents = await file.read()
            
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
                
            tmp.write(contents)
            tmp_path = tmp.name
        
        # Send to OpenAI using new API format
        with open(tmp_path, "rb") as audio_file:
            try:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
                transcription_text = transcript.text
            except Exception as whisper_error:
                logger.error(f"OpenAI API error: {str(whisper_error)}")
                raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(whisper_error)}")
        
        os.remove(tmp_path)
        
        return JSONResponse({"transcription": transcription_text})
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 