# Blue-Green 무중단 배포 가이드

이 가이드는 Docker 컨테이너를 사용한 Blue-Green 무중단 배포 전략을 설명합니다.

## 📋 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [초기 설정](#초기-설정)
4. [배포 프로세스](#배포-프로세스)
5. [롤백](#롤백)
6. [모니터링](#모니터링)

## 개요

### Blue-Green 배포란?

Blue-Green 배포는 두 개의 동일한 환경(Blue, Green)을 유지하고, 새 버전을 비활성 환경에 배포한 후 트래픽을 전환하는 방식입니다.

- **Blue 환경**: 포트 4000
- **Green 환경**: 포트 4001
- **Nginx**: 트래픽을 활성 환경으로 라우팅

### 장점

- ✅ **무중단 배포**: 서비스 중단 없이 배포 가능
- ✅ **빠른 롤백**: 문제 발생 시 즉시 이전 버전으로 복구
- ✅ **안전한 테스트**: 새 버전을 배포한 후 충분히 테스트 가능
- ✅ **점진적 전환**: 트래픽을 점진적으로 전환 가능

## 사전 요구사항

### 1. 필수 소프트웨어 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Nginx 설치
sudo apt update
sudo apt install -y nginx curl

# Git 설치 (이미 설치되어 있을 수 있음)
sudo apt install -y git
```

### 2. 방화벽 설정

```bash
# 포트 80 (Nginx) 허용
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP traffic"

# 포트 443 (HTTPS, 선택사항) 허용
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTPS traffic"
```

### 3. 프로젝트 설정

```bash
# 프로젝트 디렉토리 생성
mkdir -p /home/ubuntu/blog-backend
cd /home/ubuntu/blog-backend

# Git 저장소 클론
git clone <your-repository-url> .

# 환경 변수 파일 생성
nano .env
# 필요한 환경 변수 설정 (DATABASE_URL, JWT_SECRET_KEY 등)
```

## 초기 설정

### 1. Nginx 초기 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/blog-backend
```

다음 내용 추가:

```nginx
upstream blog_backend {
    server localhost:4000;  # Blue 환경 (초기 활성)
}

server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://blog_backend;
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

```bash
# Nginx 활성화
sudo ln -s /etc/nginx/sites-available/blog-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # 기본 설정 제거 (선택사항)

# Nginx 설정 테스트
sudo nginx -t

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 초기 배포 (Blue 환경)

```bash
cd /home/ubuntu/blog-backend

# 배포 스크립트에 실행 권한 부여
chmod +x deploy-blue-green.sh

# 첫 배포 실행
./deploy-blue-green.sh
```

## 배포 프로세스

### 자동 배포 (권장)

```bash
cd /home/ubuntu/blog-backend

# 최신 코드 가져오기
git pull origin develop  # 또는 main

# 배포 스크립트 실행
./deploy-blue-green.sh
```

### 배포 스크립트 동작 과정

1. **현재 활성 환경 확인**: Blue 또는 Green 중 어떤 환경이 활성화되어 있는지 확인
2. **비활성 환경에 새 버전 배포**:
   - Docker 이미지 빌드
   - 새 컨테이너 실행 (포트 4000 또는 4001)
   - 헬스 체크 수행
3. **트래픽 전환**: Nginx 설정을 새 환경으로 업데이트
4. **최종 헬스 체크**: 트래픽 전환 후 최종 확인
5. **이전 컨테이너 제거**: (선택사항) 이전 버전 컨테이너 제거

### 수동 배포 단계

만약 스크립트를 사용하지 않고 수동으로 배포하려면:

```bash
# 1. 새 환경 결정 (예: Green)
TARGET_ENV="green"
TARGET_PORT=4001
TARGET_CONTAINER="blog-backend-green"

# 2. 이미지 빌드
cd /home/ubuntu/blog-backend
docker build -t blog-backend:latest .

# 3. 새 컨테이너 실행
docker run -d \
    --name $TARGET_CONTAINER \
    -p ${TARGET_PORT}:4000 \
    --env-file .env \
    -v $(pwd)/prisma:/usr/src/app/prisma \
    --restart unless-stopped \
    blog-backend:latest

# 4. 헬스 체크
sleep 10
curl -f http://localhost:${TARGET_PORT}/api/health

# 5. Nginx 설정 업데이트
sudo nano /etc/nginx/sites-available/blog-backend
# upstream을 localhost:${TARGET_PORT}로 변경

# 6. Nginx 재시작
sudo nginx -t
sudo systemctl reload nginx

# 7. 이전 컨테이너 제거
docker stop blog-backend-blue
docker rm blog-backend-blue
```

## 롤백

### 자동 롤백

배포 스크립트는 헬스 체크 실패 시 자동으로 롤백합니다.

### 수동 롤백

```bash
# 현재 활성 환경 확인
docker ps --format '{{.Names}}'

# Nginx 설정을 이전 환경으로 변경
# 예: Blue로 롤백
sudo nano /etc/nginx/sites-available/blog-backend
# upstream을 localhost:4000으로 변경

sudo nginx -t
sudo systemctl reload nginx

# 새 환경 컨테이너 중지
docker stop blog-backend-green
docker rm blog-backend-green
```

### 빠른 롤백 스크립트

`rollback.sh` 파일 생성:

```bash
#!/bin/bash
set -e

BLUE_PORT=4000
GREEN_PORT=4001
NGINX_CONFIG="/etc/nginx/sites-available/blog-backend"

# 현재 활성 환경 확인
if docker ps --format '{{.Names}}' | grep -q "blog-backend-blue"; then
    echo "Blue로 롤백 중..."
    sudo sed -i 's/localhost:4001/localhost:4000/g' $NGINX_CONFIG
    docker stop blog-backend-green || true
    docker rm blog-backend-green || true
else
    echo "Green으로 롤백 중..."
    sudo sed -i 's/localhost:4000/localhost:4001/g' $NGINX_CONFIG
    docker stop blog-backend-blue || true
    docker rm blog-backend-blue || true
fi

sudo nginx -t
sudo systemctl reload nginx
echo "롤백 완료!"
```

## 모니터링

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker ps

# 컨테이너 로그 확인
docker logs blog-backend-blue
docker logs blog-backend-green

# 실시간 로그 확인
docker logs -f blog-backend-blue
```

### 헬스 체크

```bash
# Blue 환경 헬스 체크
curl http://localhost:4000/api/health

# Green 환경 헬스 체크
curl http://localhost:4001/api/health

# Nginx를 통한 헬스 체크
curl http://localhost/api/health
```

### 리소스 사용량 확인

```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너만 확인
docker stats blog-backend-blue
```

### Nginx 상태 확인

```bash
# Nginx 상태
sudo systemctl status nginx

# Nginx 액세스 로그
sudo tail -f /var/log/nginx/access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log
```

## 문제 해결

### 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker logs <container-name>

# 컨테이너 재시작
docker restart <container-name>

# 컨테이너 제거 후 재생성
docker stop <container-name>
docker rm <container-name>
# 배포 스크립트 재실행
```

### 헬스 체크 실패

```bash
# 컨테이너 내부 확인
docker exec -it <container-name> /bin/sh

# 애플리케이션 로그 확인
docker logs <container-name>

# 포트 확인
netstat -tulpn | grep 4000
netstat -tulpn | grep 4001
```

### Nginx 설정 오류

```bash
# 설정 파일 문법 확인
sudo nginx -t

# 설정 파일 재로드
sudo systemctl reload nginx

# Nginx 재시작
sudo systemctl restart nginx
```

### 포트 충돌

```bash
# 포트 사용 확인
sudo lsof -i :4000
sudo lsof -i :4001

# 프로세스 종료
sudo kill -9 <PID>
```

## 고급 설정

### 환경 변수 관리

`.env` 파일을 안전하게 관리:

```bash
# .env 파일 권한 설정
chmod 600 .env

# 환경 변수 확인 (민감한 정보는 제외)
cat .env | grep -v SECRET
```

### Docker 이미지 태깅

버전별 이미지 태깅:

```bash
# 버전 태그로 빌드
docker build -t blog-backend:v1.0.0 .
docker build -t blog-backend:latest .

# 특정 버전으로 배포
docker run -d --name blog-backend-green \
    -p 4001:4000 \
    blog-backend:v1.0.0
```

### 자동 배포 스크립트 (Git Hook)

`.git/hooks/post-receive` 또는 CI/CD 파이프라인에서:

```bash
#!/bin/bash
cd /home/ubuntu/blog-backend
git pull origin develop
./deploy-blue-green.sh
```

## 보안 고려사항

1. **환경 변수 보호**: `.env` 파일 권한 설정
2. **방화벽 규칙**: 필요한 포트만 열기
3. **SSL/TLS**: HTTPS 사용 권장 (Let's Encrypt)
4. **정기 업데이트**: 시스템 및 Docker 이미지 정기 업데이트

## 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)
- [Blue-Green 배포 패턴](https://martinfowler.com/bliki/BlueGreenDeployment.html)
