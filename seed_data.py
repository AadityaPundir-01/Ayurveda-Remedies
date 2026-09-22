import os
import json
import logging
from app.config import settings
from app.schemas.remedy import RemedyCreate
from app.services.ingestion import ingest_remedies_bulk
from app.services.vector_store import get_qdrant_client, ensure_collection_exists

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def seed_database():
    """Seeds the Qdrant vector database with initial vetted home remedies."""
    json_path = os.path.join(os.path.dirname(__file__), "data", "sample_remedies.json")
    
    if not os.path.exists(json_path):
        logger.error(f"Sample data file not found at: {json_path}")
        return

    logger.info(f"Reading sample remedies from: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    remedies = [RemedyCreate(**item) for item in raw_data]
    logger.info(f"Parsed {len(remedies)} remedies from JSON.")

    # Ensure Qdrant collection is ready
    client = get_qdrant_client()
    ensure_collection_exists(client)

    # Ingest bulk
    ids = ingest_remedies_bulk(remedies)
    logger.info(f"Successfully seeded {len(ids)} remedies into collection '{settings.QDRANT_COLLECTION_NAME}'.")
    print(f"\nSeeding Complete! Successfully added {len(ids)} remedies.")
    print("You can view the vectors in your browser at: http://localhost:6333/dashboard\n")


if __name__ == "__main__":
    seed_database()
