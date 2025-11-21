# React Docker 무중단 배포 가이드

React 프로젝트를 Docker로 무중단 배포하는 방법입니다. 백엔드와 동일한 Blue-Green 배포 전략을 사용합니다.

## 📋 개요

- **Docker 컨테이너**: Nginx를 포함한 React 빌드 이미지
- **Blue-Green 배포**: 백엔드와 동일한 방식
- **포트 전환**: 3000 (Blue) ↔ 3001 (Green)

## 🐳 React Dockerfile

React 프로젝트 루트에 `Dockerfile` 생성:

```dockerfile
# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 파일 복사
COPY package.json package-lock.json* ./
# 또는 pnpm 사용 시
# COPY package.json pnpm-lock.yaml* ./

# 의존성 설치
RUN npm ci --only=production=false
# 또는 pnpm 사용 시
# RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 소스 코드 복사
COPY . .

# 환경 변수 설정 (빌드 시점)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# 빌드
RUN npm run build
# 또는 pnpm 사용 시
# RUN pnpm build

# 프로덕션 스테이지
FROM nginx:alpine

# 빌드된 파일 복사
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx 설정 파일 복사 (선택사항)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Nginx 설정 파일

React 프로젝트 루트에 `nginx.conf` 생성:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 라우팅 지원 (필수!)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss application/json;
}
```

## 🚀 배포 스크립트

`deploy-blue-green-react.sh` 파일 생성:

```bash
#!/bin/bash
set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 설정
PROJECT_DIR="/home/ubuntu/blog-frontend"
BLUE_PORT=3000
GREEN_PORT=3001
BLUE_CONTAINER="blog-frontend-blue"
GREEN_CONTAINER="blog-frontend-green"
IMAGE_NAME="blog-frontend"
NGINX_CONFIG="/etc/nginx/sites-available/blog-frontend"
NGINX_ENABLED="/etc/nginx/sites-enabled/blog-frontend"
HEALTH_CHECK_URL="http://localhost"
MAX_HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=2

# 현재 활성화된 환경 확인
get_active_environment() {
    if docker ps --format '{{.Names}}' | grep -q "^${BLUE_CONTAINER}$"; then
        echo "blue"
    elif docker ps --format '{{.Names}}' | grep -q "^${GREEN_CONTAINER}$"; then
        echo "green"
    else
        echo "none"
    fi
}

# 헬스 체크 함수
health_check() {
    local port=$1
    local container_name=$2
    local retries=0
    
    echo -e "${YELLOW}헬스 체크 시작: ${container_name} (포트 ${port})${NC}"
    
    while [ $retries -lt $MAX_HEALTH_CHECK_RETRIES ]; do
        if curl -f -s "${HEALTH_CHECK_URL}:${port}" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 헬스 체크 성공: ${container_name}${NC}"
            return 0
        fi
        
        retries=$((retries + 1))
        echo -e "${YELLOW}헬스 체크 재시도 ${retries}/${MAX_HEALTH_CHECK_RETRIES}...${NC}"
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    echo -e "${RED}✗ 헬스 체크 실패: ${container_name}${NC}"
    return 1
}

# Nginx 설정 업데이트
update_nginx_config() {
    local target_port=$1
    local target_container=$2
    
    echo -e "${YELLOW}Nginx 설정 업데이트 중... (포트 ${target_port})${NC}"
    
    sudo tee $NGINX_CONFIG > /dev/null <<EOF
upstream frontend {
    server localhost:${target_port};
}

server {
    listen 3000;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

    # 심볼릭 링크 생성
    if [ ! -L "$NGINX_ENABLED" ]; then
        echo -e "${YELLOW}Nginx 설정 활성화 중...${NC}"
        sudo ln -sf $NGINX_CONFIG $NGINX_ENABLED
    fi

    # Nginx 설정 테스트
    if sudo nginx -t > /dev/null 2>&1; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx 설정 업데이트 완료${NC}"
        return 0
    else
        echo -e "${RED}✗ Nginx 설정 오류${NC}"
        sudo nginx -t
        return 1
    fi
}

# 컨테이너 중지 및 제거
stop_container() {
    local container_name=$1
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${YELLOW}컨테이너 중지 중: ${container_name}${NC}"
        docker stop $container_name || true
        docker rm $container_name || true
        echo -e "${GREEN}✓ 컨테이너 제거 완료: ${container_name}${NC}"
    fi
}

# 새 컨테이너 배포
deploy_new_container() {
    local target_env=$1
    local target_port=$2
    local container_name=$3
    
    echo -e "${YELLOW}새 컨테이너 배포 중: ${container_name} (포트 ${target_port})${NC}"
    
    # 기존 컨테이너 중지
    stop_container $container_name
    
    # 이미지 빌드
    echo -e "${YELLOW}Docker 이미지 빌드 중...${NC}"
    cd $PROJECT_DIR
    docker build -t $IMAGE_NAME:latest .
    
    # 새 컨테이너 실행
    echo -e "${YELLOW}컨테이너 실행 중: ${container_name}${NC}"
    docker run -d \
        --name $container_name \
        -p ${target_port}:80 \
        --restart unless-stopped \
        $IMAGE_NAME:latest
    
    # 헬스 체크
    if health_check $target_port $container_name; then
        echo -e "${GREEN}✓ 배포 성공: ${container_name}${NC}"
        return 0
    else
        echo -e "${RED}✗ 배포 실패: ${container_name}${NC}"
        docker logs $container_name
        stop_container $container_name
        return 1
    fi
}

# 롤백
rollback() {
    local current_env=$1
    
    echo -e "${RED}롤백 시작...${NC}"
    
    if [ "$current_env" = "blue" ]; then
        update_nginx_config $GREEN_PORT $GREEN_CONTAINER
        stop_container $BLUE_CONTAINER
    elif [ "$current_env" = "green" ]; then
        update_nginx_config $BLUE_PORT $BLUE_CONTAINER
        stop_container $GREEN_CONTAINER
    fi
    
    echo -e "${GREEN}✓ 롤백 완료${NC}"
}

# 메인 배포 로직
main() {
    echo -e "${GREEN}=== React Blue-Green 무중단 배포 시작 ===${NC}"
    
    # 프로젝트 디렉토리 확인
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}✗ 프로젝트 디렉토리를 찾을 수 없습니다: ${PROJECT_DIR}${NC}"
        exit 1
    fi
    
    # 현재 활성 환경 확인
    current_env=$(get_active_environment)
    echo -e "${YELLOW}현재 활성 환경: ${current_env}${NC}"
    
    # 배포할 환경 결정
    if [ "$current_env" = "blue" ] || [ "$current_env" = "none" ]; then
        deploy_env="green"
        deploy_port=$GREEN_PORT
        deploy_container=$GREEN_CONTAINER
        old_container=$BLUE_CONTAINER
    else
        deploy_env="blue"
        deploy_port=$BLUE_PORT
        deploy_container=$BLUE_CONTAINER
        old_container=$GREEN_CONTAINER
    fi
    
    echo -e "${YELLOW}배포 대상 환경: ${deploy_env} (포트 ${deploy_port})${NC}"
    
    # 새 컨테이너 배포
    if deploy_new_container $deploy_env $deploy_port $deploy_container; then
        # 트래픽 전환
        echo -e "${YELLOW}트래픽 전환 중...${NC}"
        if update_nginx_config $deploy_port $deploy_container; then
            echo -e "${GREEN}✓ 트래픽 전환 완료${NC}"
            
            # 잠시 대기 후 최종 헬스 체크
            echo -e "${YELLOW}최종 헬스 체크 중...${NC}"
            sleep 5
            
            if health_check $deploy_port $deploy_container; then
                echo -e "${GREEN}✓ 배포 성공!${NC}"
                
                # 이전 컨테이너 제거 (선택사항)
                if [ "$REMOVE_OLD_CONTAINER_ON_DEPLOY" = "true" ]; then
                    echo -e "${YELLOW}이전 컨테이너 제거 중...${NC}"
                    stop_container $old_container
                    docker image prune -f
                fi
            else
                echo -e "${RED}✗ 최종 헬스 체크 실패 - 롤백 중...${NC}"
                rollback $current_env
                exit 1
            fi
        else
            echo -e "${RED}✗ 트래픽 전환 실패 - 롤백 중...${NC}"
            rollback $current_env
            exit 1
        fi
    else
        echo -e "${RED}✗ 배포 실패${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}=== 배포 완료 ===${NC}"
}

# 스크립트 실행
main "$@"
```

## 📝 GitHub Actions 워크플로우

React 프로젝트용 `.github/workflows/deploy-gcp.yml`:

```yaml
name: Deploy React to Google Cloud VM

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Set up Node.js
        uses: actions/setup-node@v5
        with:
          node-version: "18.x"

      - name: Install dependencies
        run: npm ci

      - name: Build React app
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}

      - name: Prepare deployment files
        run: |
          mkdir -p deploy
          cp -r build deploy/
          cp Dockerfile deploy/
          cp nginx.conf deploy/
          cp deploy-blue-green-react.sh deploy/

      - name: Create deployment archive
        run: tar czf deploy.tar.gz deploy/

      - name: Copy files to VM
        uses: appleboy/scp-action@v1
        with:
          host: ${{ secrets.GCP_VM_IP }}
          username: ${{ secrets.GCP_VM_USER }}
          key: ${{ secrets.GCP_SSH_PRIVATE_KEY }}
          source: "deploy.tar.gz"
          target: /home/${{ secrets.GCP_VM_USER }}/blog-frontend

      - name: Deploy to VM
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.GCP_VM_IP }}
          username: ${{ secrets.GCP_VM_USER }}
          key: ${{ secrets.GCP_SSH_PRIVATE_KEY }}
          script: |
            cd /home/${{ secrets.GCP_VM_USER }}/blog-frontend
            tar xzf deploy.tar.gz
            mv deploy/* .
            rm -rf deploy deploy.tar.gz
            chmod +x deploy-blue-green-react.sh
            REMOVE_OLD_CONTAINER_ON_DEPLOY=true ./deploy-blue-green-react.sh
```

## 🏗️ 아키텍처

```
외부 접근: 34.123.45.67:3000
    ↓
Nginx (포트 3000 listen)
    ↓
upstream frontend { localhost:3000 (Blue) 또는 localhost:3001 (Green) }
    ↓
Docker 컨테이너 (Nginx + React 빌드 파일)
```

## 📊 포트 구성

```
34.123.45.67:4000  → 백엔드 (Docker)
34.123.45.67:5000  → 서비스 (Docker)
34.123.45.67:6000  → admin (Docker)
34.123.45.67:3000  → React 프론트엔드 (Docker)
```

## ✅ 장점

- ✅ **백엔드와 동일한 방식**: 일관된 배포 프로세스
- ✅ **무중단 배포**: Blue-Green 전환
- ✅ **환경 일관성**: Docker로 환경 통일
- ✅ **캐싱 최적화**: Nginx 설정으로 정적 파일 캐싱
- ✅ **SPA 라우팅**: Nginx 설정으로 지원

## 🔧 초기 설정

VM에서 한 번만 실행:

```bash
# 프로젝트 디렉토리 생성
mkdir -p /home/ubuntu/blog-frontend

# Nginx 초기 설정 (선택사항, 배포 스크립트가 자동 생성)
sudo nano /etc/nginx/sites-available/blog-frontend
```

## 📝 .dockerignore

React 프로젝트 루트에 `.dockerignore` 생성:

```
node_modules
.git
.gitignore
*.md
.env*
build
coverage
.vscode
.idea
*.log
.DS_Store
```

이제 React도 백엔드와 동일한 방식으로 Docker를 사용한 무중단 배포가 가능합니다!
