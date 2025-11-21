# 여러 프로젝트 배포 가이드

VM에 여러 프로젝트를 배포할 때의 Nginx 설정 및 관리 방법입니다.

## 📋 개요

- **Nginx**: VM에 한 번만 설치
- **각 프로젝트**: 별도의 Nginx 설정 파일 사용
- **포트 분리**: 각 프로젝트마다 고유한 포트 사용

## 🏗️ 아키텍처 예시

```
VM (단일 Nginx)
├── 프로젝트 1 (blog-backend)
│   ├── Blue: localhost:4000
│   └── Green: localhost:4001
├── 프로젝트 2 (admin-panel)
│   ├── Blue: localhost:5000
│   └── Green: localhost:5001
└── 프로젝트 3 (api-service)
    ├── Blue: localhost:6000
    └── Green: localhost:6001
```

## 📝 포트 할당 전략

각 프로젝트별로 포트를 분리합니다:

| 프로젝트 | Blue 포트 | Green 포트 | 도메인/경로 |
|---------|----------|-----------|------------|
| blog-backend | 4000 | 4001 | api.example.com 또는 /api |
| admin-panel | 5000 | 5001 | admin.example.com 또는 /admin |
| api-service | 6000 | 6001 | service.example.com 또는 /service |

## 🔧 Nginx 설정 방법

### 방법 1: 도메인 기반 라우팅 (권장)

각 프로젝트에 별도의 도메인을 사용하는 경우:

```bash
# 각 프로젝트별로 설정 파일 생성
sudo nano /etc/nginx/sites-available/blog-backend
sudo nano /etc/nginx/sites-available/admin-panel
sudo nano /etc/nginx/sites-available/api-service
```

**프로젝트 1: backend (포트 4000)**

```nginx
# /etc/nginx/sites-available/backend
upstream backend {
    server localhost:4000;  # Blue 환경 (초기 활성)
    # server localhost:4001;  # Green 환경으로 전환 시 주석 해제
}

server {
    listen 4000;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**프로젝트 2: service (포트 5000)**

```nginx
# /etc/nginx/sites-available/service
upstream service {
    server localhost:5000;  # Blue 환경 (초기 활성)
    # server localhost:5001;  # Green 환경으로 전환 시 주석 해제
}

server {
    listen 5000;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**프로젝트 3: admin (포트 6000)**

```nginx
# /etc/nginx/sites-available/admin
upstream admin {
    server localhost:6000;  # Blue 환경 (초기 활성)
    # server localhost:6001;  # Green 환경으로 전환 시 주석 해제
}

server {
    listen 6000;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 방법 2: 경로 기반 라우팅

하나의 도메인에서 경로로 구분하는 경우:

```nginx
# /etc/nginx/sites-available/multi-project
upstream blog_backend {
    server localhost:4000;
}

upstream admin_panel {
    server localhost:5000;
}

upstream api_service {
    server localhost:6000;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    # 프로젝트 1: /api 경로
    location /api {
        proxy_pass http://blog_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 프로젝트 2: /admin 경로
    location /admin {
        proxy_pass http://admin_panel;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 프로젝트 3: /service 경로
    location /service {
        proxy_pass http://api_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🚀 배포 스크립트 수정

각 프로젝트별로 배포 스크립트를 만들거나, 환경 변수로 설정을 변경할 수 있습니다.

### 프로젝트별 배포 스크립트 예시

**프로젝트 1: blog-backend**

```bash
# deploy-blog-backend.sh
PROJECT_DIR="/home/ubuntu/blog-backend"
BLUE_PORT=4000
GREEN_PORT=4001
BLUE_CONTAINER="blog-backend-blue"
GREEN_CONTAINER="blog-backend-green"
IMAGE_NAME="blog-backend"
NGINX_CONFIG="/etc/nginx/sites-available/blog-backend"
# ... 나머지 설정
```

**프로젝트 2: admin-panel**

```bash
# deploy-admin-panel.sh
PROJECT_DIR="/home/ubuntu/admin-panel"
BLUE_PORT=5000
GREEN_PORT=5001
BLUE_CONTAINER="admin-panel-blue"
GREEN_CONTAINER="admin-panel-green"
IMAGE_NAME="admin-panel"
NGINX_CONFIG="/etc/nginx/sites-available/admin-panel"
# ... 나머지 설정
```

**프로젝트 3: api-service**

```bash
# deploy-api-service.sh
PROJECT_DIR="/home/ubuntu/api-service"
BLUE_PORT=6000
GREEN_PORT=6001
BLUE_CONTAINER="api-service-blue"
GREEN_CONTAINER="api-service-green"
IMAGE_NAME="api-service"
NGINX_CONFIG="/etc/nginx/sites-available/api-service"
# ... 나머지 설정
```

## 📋 초기 설정 단계

### 1. Nginx 설치 (한 번만)

```bash
sudo apt update
sudo apt install -y nginx
```

### 2. 각 프로젝트별 Nginx 설정 파일 생성

```bash
# 프로젝트 1
sudo nano /etc/nginx/sites-available/blog-backend
# 위의 설정 내용 추가

# 프로젝트 2
sudo nano /etc/nginx/sites-available/admin-panel
# 위의 설정 내용 추가

# 프로젝트 3
sudo nano /etc/nginx/sites-available/api-service
# 위의 설정 내용 추가
```

### 3. Nginx 설정 활성화

```bash
# 각 프로젝트별로 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/blog-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api-service /etc/nginx/sites-enabled/

# 기본 설정 제거 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🔄 배포 프로세스

각 프로젝트는 독립적으로 배포할 수 있습니다:

```bash
# 프로젝트 1 배포
cd /home/ubuntu/blog-backend
./deploy-blue-green.sh

# 프로젝트 2 배포
cd /home/ubuntu/admin-panel
./deploy-blue-green.sh

# 프로젝트 3 배포
cd /home/ubuntu/api-service
./deploy-blue-green.sh
```

각 배포는 다른 프로젝트에 영향을 주지 않습니다.

## ✅ 확인 방법

```bash
# 실행 중인 모든 컨테이너 확인
docker ps

# 각 프로젝트별 헬스 체크
curl http://localhost:4000/api/health  # 프로젝트 1
curl http://localhost:5000/api/health  # 프로젝트 2
curl http://localhost:6000/api/health  # 프로젝트 3

# Nginx를 통한 접근 확인
curl http://api.example.com/api/health      # 프로젝트 1
curl http://admin.example.com/api/health   # 프로젝트 2
curl http://service.example.com/api/health # 프로젝트 3
```

## 🛠️ 관리 팁

### 모든 프로젝트 상태 확인

```bash
# 모든 컨테이너 상태
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Nginx 설정 확인
sudo nginx -t

# Nginx 상태
sudo systemctl status nginx
```

### 로그 확인

```bash
# Nginx 액세스 로그
sudo tail -f /var/log/nginx/access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# 특정 프로젝트 컨테이너 로그
docker logs blog-backend-blue
docker logs admin-panel-blue
docker logs api-service-blue
```

### 리소스 모니터링

```bash
# 모든 컨테이너 리소스 사용량
docker stats

# 특정 프로젝트만 확인
docker stats blog-backend-blue blog-backend-green
```

## 🔒 보안 고려사항

1. **포트 관리**: 각 프로젝트별로 포트를 명확히 분리
2. **방화벽**: 필요한 포트만 열기 (보통 80, 443만)
3. **SSL/TLS**: 각 도메인별로 SSL 인증서 설정 가능
4. **환경 변수**: 각 프로젝트별 `.env` 파일 분리

## 📝 요약

- ✅ **Nginx**: VM에 한 번만 설치
- ✅ **설정 파일**: 각 프로젝트별로 별도 파일 생성
- ✅ **포트 분리**: 프로젝트마다 고유한 포트 사용
- ✅ **독립 배포**: 각 프로젝트는 독립적으로 배포 가능
- ✅ **트래픽 전환**: 각 프로젝트별로 Blue-Green 전환 가능
