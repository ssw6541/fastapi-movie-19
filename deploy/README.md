# EC2 배포 구성

Ubuntu 서버의 `/opt/fastapi-movie`에 백엔드와 `frontend/dist`를 배치한다.
로컬에서 `npm run build --prefix frontend`로 프론트엔드를 빌드한다.
서버에는 Python 가상환경을 만들고 `backend/requirements.txt`를 설치한다.
서비스는 `fastapi-movie.service`로 FastAPI를 포트 80에 실행한다.
FastAPI가 `frontend/dist`의 React 화면과 `/api/` 요청을 함께 제공한다.

TMDB 자격 증명은 서버의 `/opt/fastapi-movie/.env`에 별도로 설정하고
서비스 사용자만 읽을 수 있도록 권한을 제한한다. 배포 파일에는 포함하지 않는다.
이 구성은 HTTP만 제공하며 HTTPS에는 도메인과 인증서 설정이 추가로 필요하다.
