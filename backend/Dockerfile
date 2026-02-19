FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files from repo root
COPY pyproject.toml uv.lock ./

# Install deps into /opt/venv so volume mount ./backend:/app doesn't wipe the env
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
RUN uv sync --frozen --no-dev

# Copy backend application code
COPY backend/ ./

# Use venv's uvicorn directly (survives volume mount)
ENV PATH="/opt/venv/bin:$PATH"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
