FROM python:3.10-slim

WORKDIR /workspace

# Install curl for health probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install plug-in packages first (kernel, later ERP modules) for better layer caching.
# requirements.txt lists the same packages with -e.
COPY kernel/backend/ /workspace/kernel/backend/
RUN pip install --no-cache-dir -e /workspace/kernel/backend --config-settings editable_mode=compat

# Copy api-server application
COPY apps/api-server/ /workspace/apps/api-server/
WORKDIR /workspace/apps/api-server

# Install api-server dependencies
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH="/workspace/apps/api-server"
ENV PYTHONUNBUFFERED=1
ENV PORT=8001

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
