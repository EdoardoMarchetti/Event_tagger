# Event_tagger
A streamlit app to collect event during a football match.

## Setup (uv)

Dependencies are managed with [uv](https://docs.astral.sh/uv/). From the repo root:

```bash
uv sync
```

Run the FastAPI backend:

```bash
uv run uvicorn app.main:app --reload --app-dir backend
```
