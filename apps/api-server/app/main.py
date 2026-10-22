from fastapi import FastAPI

app = FastAPI(title="api-server")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello from api-server"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
