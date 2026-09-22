import uuid
import json
import csv
import logging
import io
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document

from app.schemas.remedy import RemedyCreate
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────
# Existing remedy ingestion helpers (used by JSON form + API)
# ─────────────────────────────────────────────────────────────────

def format_remedy_text(remedy: RemedyCreate) -> str:
    """Formats a structured remedy into an information-dense text representation

    optimized for semantic symptom matching and precaution retrieval.
    """
    ingredients_str = ", ".join(
        [f"{ing.name} ({ing.amount})" + (f" - {ing.notes}" if ing.notes else "") for ing in remedy.ingredients]
    )
    symptoms_str = ", ".join(remedy.applicable_symptoms)
    prep_str = " ".join([f"Step {i+1}: {step}" for i, step in enumerate(remedy.preparation_steps)])
    precautions_str = "; ".join(remedy.precautions_and_contraindications)
    who_avoid_str = "; ".join(remedy.who_should_avoid)
    side_effects_str = "; ".join(remedy.possible_side_effects) if remedy.possible_side_effects else "None reported"

    return (
        f"Remedy Name: {remedy.name}\n"
        f"Target Symptoms / Ailments: {symptoms_str}\n"
        f"Ingredients: {ingredients_str}\n"
        f"Preparation Steps: {prep_str}\n"
        f"Recommended Dosage & Schedule: {remedy.dosage_and_frequency}\n"
        f"Mandatory Precautions & Warnings: {precautions_str}\n"
        f"Who Must Avoid This Remedy (Contraindications): {who_avoid_str}\n"
        f"Possible Side Effects: {side_effects_str}\n"
        f"Tags: {', '.join(remedy.tags)}"
    )


def create_document_from_remedy(remedy: RemedyCreate, doc_id: str) -> Document:
    """Creates a LangChain Document with rich metadata."""
    content = format_remedy_text(remedy)
    metadata: Dict[str, Any] = {
        "id": doc_id,
        "name": remedy.name,
        "applicable_symptoms": remedy.applicable_symptoms,
        "ingredients": [ing.model_dump() for ing in remedy.ingredients],
        "preparation_steps": remedy.preparation_steps,
        "dosage_and_frequency": remedy.dosage_and_frequency,
        "precautions_and_contraindications": remedy.precautions_and_contraindications,
        "who_should_avoid": remedy.who_should_avoid,
        "possible_side_effects": remedy.possible_side_effects,
        "tags": remedy.tags
    }
    return Document(page_content=content, metadata=metadata)


def ingest_remedy(remedy: RemedyCreate) -> str:
    """Ingests a single remedy into the Qdrant vector store."""
    doc_id = str(uuid.uuid4())
    doc = create_document_from_remedy(remedy, doc_id)
    vector_store = get_vector_store()
    vector_store.add_documents(documents=[doc], ids=[doc_id])
    logger.info(f"Successfully ingested remedy: {remedy.name} (ID: {doc_id})")
    return doc_id


def ingest_remedies_bulk(remedies: List[RemedyCreate]) -> List[str]:
    """Ingests multiple remedies in bulk into the Qdrant vector store."""
    docs = []
    ids = []
    for r in remedies:
        doc_id = str(uuid.uuid4())
        ids.append(doc_id)
        docs.append(create_document_from_remedy(r, doc_id))
    
    vector_store = get_vector_store()
    vector_store.add_documents(documents=docs, ids=ids)
    logger.info(f"Successfully ingested {len(remedies)} remedies into vector store.")
    return ids


# ─────────────────────────────────────────────────────────────────
# File Parsers — PDF, Excel, TXT, JSON
# ─────────────────────────────────────────────────────────────────

def parse_pdf(file_bytes: bytes) -> str:
    """Extracts all text from a PDF file using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text.strip():
                pages_text.append(f"[Page {page_num + 1}]\n{text.strip()}")
        doc.close()
        full_text = "\n\n".join(pages_text)
        logger.info(f"PDF parsed: {len(pages_text)} pages, {len(full_text)} characters extracted.")
        return full_text
    except Exception as e:
        logger.error(f"PDF parsing failed: {e}")
        raise ValueError(f"Failed to parse PDF file: {str(e)}")


def parse_excel(file_bytes: bytes) -> str:
    """Extracts all data from an Excel file (.xlsx) as structured text."""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
        all_sheets_text = []
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            rows_text = []
            headers = []
            for row_idx, row in enumerate(ws.iter_rows(values_only=True)):
                # Skip entirely empty rows
                row_values = [str(cell).strip() if cell is not None else "" for cell in row]
                if not any(row_values):
                    continue
                if row_idx == 0:
                    headers = row_values
                    rows_text.append("Headers: " + " | ".join(headers))
                else:
                    if headers:
                        # Format as key: value pairs for richer semantic content
                        row_pairs = [f"{h}: {v}" for h, v in zip(headers, row_values) if v]
                        rows_text.append(", ".join(row_pairs))
                    else:
                        rows_text.append(" | ".join(row_values))
            if rows_text:
                all_sheets_text.append(f"[Sheet: {sheet_name}]\n" + "\n".join(rows_text))
        wb.close()
        full_text = "\n\n".join(all_sheets_text)
        logger.info(f"Excel parsed: {len(wb.sheetnames)} sheets, {len(full_text)} characters extracted.")
        return full_text
    except Exception as e:
        logger.error(f"Excel parsing failed: {e}")
        raise ValueError(f"Failed to parse Excel file: {str(e)}")


def parse_txt(file_bytes: bytes) -> str:
    """Decodes a plain text file to string."""
    try:
        # Try UTF-8 first, fallback to latin-1
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1")
        logger.info(f"TXT parsed: {len(text)} characters.")
        return text.strip()
    except Exception as e:
        logger.error(f"TXT parsing failed: {e}")
        raise ValueError(f"Failed to parse text file: {str(e)}")


def parse_csv(file_bytes: bytes) -> str:
    """Extracts all data from a CSV file as structured text.
    
    Reads headers from the first row and formats each subsequent row as
    key: value pairs for rich semantic embedding.
    """
    try:
        try:
            text_content = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text_content = file_bytes.decode("latin-1")
        
        reader = csv.DictReader(io.StringIO(text_content))
        rows_text = []
        headers = reader.fieldnames or []
        
        if headers:
            rows_text.append("Headers: " + " | ".join(headers))
        
        for row_idx, row in enumerate(reader):
            # Format each row as "field: value, field: value" for semantic richness
            row_pairs = [f"{k}: {v}" for k, v in row.items() if v and str(v).strip()]
            if row_pairs:
                rows_text.append(f"Row {row_idx + 1}: " + ", ".join(row_pairs))
        
        full_text = "\n".join(rows_text)
        logger.info(f"CSV parsed: {len(rows_text)} rows, {len(full_text)} characters extracted.")
        return full_text
    except Exception as e:
        logger.error(f"CSV parsing failed: {e}")
        raise ValueError(f"Failed to parse CSV file: {str(e)}")


def parse_json_file(file_bytes: bytes) -> str:
    """Converts a JSON file to rich text for semantic embedding.
    
    Handles:
    - List of remedy-like dicts
    - Single dict
    - Nested structures (flattened to text)
    """
    try:
        data = json.loads(file_bytes.decode("utf-8"))
        
        def dict_to_text(d: dict, prefix: str = "") -> str:
            """Recursively flattens a dict to readable text."""
            lines = []
            for key, value in d.items():
                if isinstance(value, dict):
                    lines.append(f"{prefix}{key}:")
                    lines.append(dict_to_text(value, prefix + "  "))
                elif isinstance(value, list):
                    list_str = "; ".join([str(v) for v in value])
                    lines.append(f"{prefix}{key}: {list_str}")
                else:
                    lines.append(f"{prefix}{key}: {value}")
            return "\n".join(lines)
        
        if isinstance(data, list):
            entries = []
            for i, item in enumerate(data):
                if isinstance(item, dict):
                    entries.append(f"--- Entry {i + 1} ---\n{dict_to_text(item)}")
                else:
                    entries.append(str(item))
            full_text = "\n\n".join(entries)
        elif isinstance(data, dict):
            full_text = dict_to_text(data)
        else:
            full_text = str(data)
        
        logger.info(f"JSON parsed: {len(full_text)} characters extracted.")
        return full_text
    except Exception as e:
        logger.error(f"JSON parsing failed: {e}")
        raise ValueError(f"Failed to parse JSON file: {str(e)}")


# ─────────────────────────────────────────────────────────────────
# Chunking & Vector Ingestion for Uploaded Documents
# ─────────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Splits large text into overlapping chunks for better semantic coverage."""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        # Try to break at a natural boundary (newline or period)
        if end < len(text):
            last_newline = chunk.rfind("\n")
            last_period = chunk.rfind(". ")
            break_point = max(last_newline, last_period)
            if break_point > chunk_size // 2:
                chunk = text[start:start + break_point + 1]
                end = start + break_point + 1
        chunks.append(chunk.strip())
        start = end - overlap
    
    return [c for c in chunks if c.strip()]


def ingest_document_from_file(
    file_bytes: bytes,
    filename: str,
    file_extension: str,
) -> Dict[str, Any]:
    """
    Main entry point for admin file uploads.
    
    Parses the file by type, chunks the text, embeds each chunk,
    and stores all chunks in Qdrant with source metadata.
    
    Returns a summary dict with chunks_indexed and source info.
    """
    ext = file_extension.lower().lstrip(".")
    
    # Parse file by type
    if ext == "pdf":
        text = parse_pdf(file_bytes)
    elif ext in ("xlsx", "xls"):
        text = parse_excel(file_bytes)
    elif ext == "csv":
        text = parse_csv(file_bytes)
    elif ext == "txt":
        text = parse_txt(file_bytes)
    elif ext == "json":
        text = parse_json_file(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Supported: .pdf, .xlsx, .xls, .csv, .txt, .json")
    
    if not text.strip():
        raise ValueError(f"No text content could be extracted from the uploaded file '{filename}'.")
    
    # Split into chunks
    chunks = chunk_text(text, chunk_size=800, overlap=100)
    logger.info(f"File '{filename}' → {len(chunks)} chunks to index.")
    
    # Build LangChain Documents with rich source metadata
    docs = []
    ids = []
    for i, chunk in enumerate(chunks):
        doc_id = str(uuid.uuid4())
        ids.append(doc_id)
        docs.append(Document(
            page_content=chunk,
            metadata={
                "id": doc_id,
                "source": "admin_upload",
                "source_file": filename,
                "file_type": ext,
                "chunk_index": i,
                "total_chunks": len(chunks),
                # These allow the RAG node to surface this in safety/precaution metadata
                "who_should_avoid": [],
                "precautions_and_contraindications": [],
                "applicable_symptoms": [],
            }
        ))
    
    # Batch index into Qdrant
    vector_store = get_vector_store()
    vector_store.add_documents(documents=docs, ids=ids)
    logger.info(f"Successfully indexed {len(docs)} chunks from '{filename}' into Qdrant.")
    
    return {
        "source_file": filename,
        "file_type": ext,
        "characters_extracted": len(text),
        "chunks_indexed": len(docs),
        "chunk_ids": ids,
    }
