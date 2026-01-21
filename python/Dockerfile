# Use official Python 3.12 slim image
FROM python:3.12-slim

# Install system dependencies for torch + pillow
RUN apt-get update && apt-get install -y \
    git \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your code
COPY . .

# Expose port 5000 for FastAPI
EXPOSE 5000

# Command to run FastAPI with uvicorn on GPU
CMD ["uvicorn", "yolo_service:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "1"]