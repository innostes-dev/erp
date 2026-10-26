FROM python:3.10-slim

WORKDIR /workspace

# Install curl for health probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy kernel package and install it in editable mode
COPY kernel/ /workspace/kernel/
RUN pip install --no-cache-dir -e /workspace/kernel

# Copy api-server application
COPY apps/api-server/ /workspace/apps/api-server/
WORKDIR /workspace/apps/api-server

# Install api-server dependencies
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH="/workspace:/workspace/apps/api-server"
ENV PYTHONUNBUFFERED=1

EXPOSE 8001

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
