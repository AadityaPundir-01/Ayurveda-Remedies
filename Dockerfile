# ==============================================================================
# Production Dockerfile for AyurvedaRemedies Backend (FastAPI + LangGraph)
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set working directory
WORKDIR /app

# Install system utilities needed for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (leveraging Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the FastEmbed ONNX model to eliminate first-request cold-start latency
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

# Copy application source code and seed data
COPY app/ ./app/
COPY data/ ./data/
COPY seed_data.py .

# Expose port (informative)
EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 and dynamic cloud $PORT (fallback: 8000)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
