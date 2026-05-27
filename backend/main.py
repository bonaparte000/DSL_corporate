"""
AEO Intelligence — FastAPI Backend

Start:
  cd 26_1_DSL_Corporate
  uvicorn backend.main:app --reload --port 8000

The server reads from the `results/` directory (or `results/<brand_slug>/`)
that is produced by running run_pipeline.py first.
"""

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .result_formatter import format_results

app = FastAPI(title="AEO Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR    = Path(__file__).parent / "static"
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend-assets")

# Resolve results directory relative to project root (one level above backend/)
RESULTS_BASE = Path(__file__).parent.parent / "results"


class AnalyzeRequest(BaseModel):
    brand: str


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    brand = req.brand.strip()
    if not brand:
        raise HTTPException(status_code=400, detail="brand 이름을 입력하세요")

    # 새 파이프라인: tfidf_results.json
    if (RESULTS_BASE / "tfidf_results.json").exists():
        return format_results(brand, RESULTS_BASE)

    raise HTTPException(
        status_code=404,
        detail="분석 결과가 없습니다. run_analysis.py를 먼저 실행하세요.",
    )


@app.get("/api/url-analysis")
async def url_analysis():
    p = RESULTS_BASE / "url_analysis.json"
    if not p.exists():
        raise HTTPException(status_code=404, detail="url_analysis.json이 없습니다.")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if FRONTEND_DIST.exists():
        return FileResponse(str(FRONTEND_DIST / "index.html"))
    raise HTTPException(status_code=404, detail="Frontend not built")
