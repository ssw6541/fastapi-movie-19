import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
BASE_URL = "https://api.themoviedb.org/3"

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15) as client:
        app.state.client = client
        yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["GET"], allow_headers=["*"])

async def tmdb(path: str, **params):
    key = os.getenv("TMDB_API_KEY", "").strip()
    token = os.getenv("TMDB_READ_ACCESS_TOKEN", "").strip()
    if not key and not token:
        raise HTTPException(503, "TMDB API 키 또는 읽기 액세스 토큰을 .env에 설정해 주세요.")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    if not token:
        params["api_key"] = key
    try:
        response = await app.state.client.get(path, params={"language": "ko-KR", **params}, headers=headers)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(502, "TMDB 인증 또는 데이터 요청에 실패했습니다. 키를 확인해 주세요.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(502, "TMDB에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.") from exc

@app.get("/api/home")
async def home():
    trending, movies, tv, popular = await asyncio.gather(
        tmdb("/trending/all/week"), tmdb("/movie/now_playing", region="KR"),
        tmdb("/tv/popular"), tmdb("/movie/popular", region="KR")
    )
    return {"trending": trending["results"], "movies": movies["results"], "tv": tv["results"], "popular": popular["results"]}

@app.get("/api/search")
async def search(q: str = Query(min_length=1, max_length=100)):
    return await tmdb("/search/multi", query=q, include_adult="false")
@app.get("/api/details/{media_type}/{item_id}")
async def details(media_type: Literal["movie", "tv"], item_id: int):
    if item_id < 1:
        raise HTTPException(422, "올바른 작품 ID가 필요합니다.")
    return await tmdb(f"/{media_type}/{item_id}", append_to_response="credits,videos,recommendations", include_video_language="ko,en")

