import logging
from typing import List
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form

from app.schemas.remedy import RemedyCreate, RemedyBulkCreate, RemedyResponse
from app.services.ingestion import ingest_remedy, ingest_remedies_bulk, ingest_document_from_file
from app.services.vector_store import get_vector_store, get_qdrant_client
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin/remedies", tags=["Admin Medical Data Management"])

# Allowed file extensions for admin document uploads
ALLOWED_EXTENSIONS = {"pdf", "xlsx", "xls", "txt", "json"}
MAX_FILE_SIZE_MB = 20  # 20 MB limit


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_remedy(remedy: RemedyCreate):
    """Admin endpoint to add a new home remedy and index it into the vector database."""
    try:
        doc_id = ingest_remedy(remedy)
        return {
            "status": "success",
            "message": f"Remedy '{remedy.name}' successfully indexed into vector database.",
            "id": doc_id
        }
    except Exception as e:
        logger.error(f"Failed to ingest remedy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index remedy into vector database: {str(e)}"
        )


@router.post("/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_remedies_bulk(payload: RemedyBulkCreate):
    """Admin endpoint to bulk index multiple home remedies into the vector database."""
    try:
        ids = ingest_remedies_bulk(payload.remedies)
        return {
            "status": "success",
            "message": f"Successfully indexed {len(ids)} remedies into vector database.",
            "ids": ids
        }
    except Exception as e:
        logger.error(f"Bulk ingestion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk ingestion failed: {str(e)}"
        )


@router.get("", response_model=dict)
def list_remedies(limit: int = 20):
    """Lists indexed remedies from the Qdrant vector database."""
    try:
        client = get_qdrant_client()
        points = client.scroll(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
        
        remedy_list = []
        for p in points[0]:
            payload = p.payload or {}
            metadata = payload.get("metadata", {})
            remedy_list.append({
                "id": str(p.id),
                "name": metadata.get("name") or payload.get("name", "Unknown"),
                "applicable_symptoms": metadata.get("applicable_symptoms", []),
                "dosage_and_frequency": metadata.get("dosage_and_frequency", ""),
                "who_should_avoid": metadata.get("who_should_avoid", []),
                "precautions": metadata.get("precautions_and_contraindications", [])
            })
            
        return {
            "status": "success",
            "total_retrieved": len(remedy_list),
            "remedies": remedy_list
        }
    except Exception as e:
        logger.warning(f"Error listing remedies: {e}")
        return {
            "status": "partial",
            "remedies": [],
            "message": f"Could not list remedies: {str(e)}"
        }


# ──────────────────────────────────────────────────────────────────────────────
# NEW: Admin Document Upload — PDF, Excel, TXT, JSON → Qdrant Vector Store
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/upload-document",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a medical document (PDF/Excel/TXT/JSON) to the vector knowledge base",
    description=(
        "Admin-only endpoint. Accepts a medical document file (PDF, XLSX, XLS, TXT, or JSON), "
        "extracts its text content, chunks it, embeds it with local HuggingFace embeddings, "
        "and indexes all chunks into the Qdrant vector database. "
        "These chunks are then retrieved by the LangGraph agent during RAG consultation to improve symptom suggestions."
    )
)
async def upload_medical_document(
    file: UploadFile = File(..., description="Medical document file to ingest (.pdf, .xlsx, .xls, .txt, .json)"),
    admin_password: str = Form(..., description="Admin password to authorize this operation"),
):
    """
    Upload and ingest a medical document into the Qdrant vector knowledge base.
    
    Supported file types:
    - **PDF** (.pdf) — Research papers, medical guidelines, clinical studies
    - **Excel** (.xlsx, .xls) — Symptom-remedy tables, ingredient databases
    - **Text** (.txt) — Plain text medical notes, remedy lists
    - **JSON** (.json) — Structured remedy data, medical datasets
    
    Security: Requires valid admin password (set via ADMIN_PASSWORD env variable).
    """
    # ── 1. Authenticate ────────────────────────────────────────────────────────
    if admin_password != settings.ADMIN_PASSWORD:
        logger.warning(f"Unauthorized document upload attempt for file: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin password. Access denied."
        )
    
    # ── 2. Validate filename & extension ──────────────────────────────────────
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided. Please upload a named file."
        )
    
    filename = file.filename
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"File type '.{extension}' is not supported. "
                f"Allowed types: {', '.join('.' + e for e in sorted(ALLOWED_EXTENSIONS))}"
            )
        )
    
    # ── 3. Read file bytes & validate size ────────────────────────────────────
    file_bytes = await file.read()
    file_size_mb = len(file_bytes) / (1024 * 1024)
    
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size {file_size_mb:.1f} MB exceeds the maximum allowed size of {MAX_FILE_SIZE_MB} MB."
        )
    
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )
    
    logger.info(f"Admin document upload: '{filename}' ({file_size_mb:.2f} MB, type: .{extension})")
    
    # ── 4. Parse, chunk & ingest into Qdrant ─────────────────────────────────
    try:
        result = ingest_document_from_file(
            file_bytes=file_bytes,
            filename=filename,
            file_extension=extension,
        )
    except ValueError as ve:
        logger.error(f"File parsing error for '{filename}': {ve}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Unexpected ingestion error for '{filename}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}"
        )
    
    # ── 5. Return success response ────────────────────────────────────────────
    return {
        "status": "success",
        "message": (
            f"Document '{filename}' successfully parsed and indexed into the Qdrant vector knowledge base. "
            f"{result['chunks_indexed']} semantic chunks are now available for RAG retrieval."
        ),
        "source_file": result["source_file"],
        "file_type": result["file_type"],
        "file_size_mb": round(file_size_mb, 2),
        "characters_extracted": result["characters_extracted"],
        "chunks_indexed": result["chunks_indexed"],
    }
