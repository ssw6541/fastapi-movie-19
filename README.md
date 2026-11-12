# TVING 스타일 영화 탐색

React(Vite) 프론트엔드와 FastAPI 백엔드로 TMDB 콘텐츠를 표시합니다.

## 설정 및 실행

1. 프로젝트 루트의 `.env`에 TMDB API Key 또는 API Read Access Token을 입력합니다. 토큰을 입력하면 토큰이 우선 사용됩니다. 실제 키는 프론트엔드에 전달되지 않습니다.
2. 프로젝트 루트에서 패키지를 설치하고 개발 서버를 실행합니다:
   ```powershell
   npm install
   npm run setup
   npm run dev
   ```
3. http://localhost:5173 을 엽니다. 백엔드만 실행하려면 `npm run dev:back`, 프론트엔드만 실행하려면 `npm run dev:front`를 사용합니다. `setup`과 백엔드 스크립트는 Windows의 Python 가상환경 경로를 사용합니다.

TMDB는 작품 정보와 이미지를 제공하며 영상 재생, 로그인 및 TVING 자체 콘텐츠 제공 기능은 포함하지 않습니다.

