import os
from datetime import datetime
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

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

# ------------------------
# Pydantic models
# ------------------------


class FormatRequest(BaseModel):
    """Request body for /format endpoint.

    Attributes
    ----------
    text : str
        Raw text that needs to be refined.
    mode : str, optional
        One of ["email", "slack", "grammar", "custom"]. Defaults to "email".
    instruction : str | None, optional
        Custom instruction text required when mode == "custom".
    """

    text: str
    mode: str = "email"
    instruction: Optional[str] = None

# ------------------------
# Helper utilities
# ------------------------


def build_system_prompt(req: FormatRequest) -> str:
    """Return an appropriate system prompt based on the mode."""

    base_email = (
        "You are a helpful assistant that formats the user's raw text into a clear, "
        "professionally-written email. Preserve the user's intent while improving "
        "grammar, structure, tone and adding an appropriate greeting and closing."
    )

    base_slack = (
        "You are a helpful assistant that turns the user's raw text into a concise, "
        "well-structured Slack message. Keep it informal, clear and actionable."
    )

    base_grammar = (
        "You are a helpful assistant that fixes grammar, punctuation and overall "
        "readability of the user's text while keeping original meaning."
    )

    if req.mode == "email":
        return base_email
    if req.mode == "slack":
        return base_slack
    if req.mode == "grammar":
        return base_grammar
    # custom
    return req.instruction or "You are a helpful assistant that improves the user's text."

# ------------------------
# Routes
# ------------------------

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    keywords: str = Form(None)
):
    """Transcribe audio from file upload, with optional keywords for prompt"""
    # Validate file type
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
        
        # Send to OpenAI
        with open(tmp_path, "rb") as audio_file:
            try:
                whisper_args = {
                    "model": "whisper-1",
                    "file": audio_file
                }
                if keywords:
                    whisper_args["prompt"] = keywords
                transcript = client.audio.transcriptions.create(**whisper_args)
                transcription_text = transcript.text
                print("timestamp, transcription_text", datetime.now(), transcript.text)
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

@app.post("/format")
async def format_text(req: FormatRequest):
    """Format or refine text using OpenAI GPT-3.5-Turbo.

    The endpoint accepts a JSON body conforming to `FormatRequest` and returns JSON:

        {
          "formatted": "<formatted_text>"
        }

    Possible `mode` values:

    - email  → Formats as a professional email.
    - slack  → Formats as an informal Slack message.
    - grammar → Fixes grammar & punctuation.
    - custom → Uses the supplied `instruction` verbatim.
    """

    if req.mode == "custom" and not req.instruction:
        raise HTTPException(status_code=400, detail="`instruction` is required when mode is 'custom'.")

    try:
        system_prompt = build_system_prompt(req)

        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.text},
            ],
            max_tokens=1024,
            temperature=0.7,
        )

        formatted_text = completion.choices[0].message.content.strip()

        return JSONResponse({"formatted": formatted_text})

    except Exception as e:
        logger.error(f"Formatting error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))