#!/bin/bash
set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정
PROJECT_DIR="/home/ubuntu/blog-backend"
BLUE_PORT=4000
GREEN_PORT=4001
BLUE_CONTAINER="blog-backend-blue"
GREEN_CONTAINER="blog-backend-green"
IMAGE_NAME="blog-backend"
NGINX_CONFIG="/etc/nginx/sites-available/blog-backend"
NGINX_ENABLED="/etc/nginx/sites-enabled/blog-backend"
# 헬스 체크 URL: VM 내부에서 컨테이너를 확인하는 주소 (실제 배포 주소가 아님)
# 배포 스크립트가 VM 내부에서 실행되므로 localhost 사용
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
        if curl -f -s "${HEALTH_CHECK_URL}:${port}/api/health" > /dev/null 2>&1; then
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
upstream blog_backend {
    server localhost:${target_port};
}

server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://blog_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

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
        -p ${target_port}:4000 \
        --env-file $PROJECT_DIR/.env \
        -v $PROJECT_DIR/prisma:/usr/src/app/prisma \
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
        # Green으로 롤백
        update_nginx_config $GREEN_PORT $GREEN_CONTAINER
        stop_container $BLUE_CONTAINER
    elif [ "$current_env" = "green" ]; then
        # Blue로 롤백
        update_nginx_config $BLUE_PORT $BLUE_CONTAINER
        stop_container $GREEN_CONTAINER
    fi
    
    echo -e "${GREEN}✓ 롤백 완료${NC}"
}

# 메인 배포 로직
main() {
    echo -e "${GREEN}=== Blue-Green 무중단 배포 시작 ===${NC}"
    
    # 프로젝트 디렉토리 확인
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}✗ 프로젝트 디렉토리를 찾을 수 없습니다: ${PROJECT_DIR}${NC}"
        exit 1
    fi
    
    # .env 파일 확인
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${RED}✗ .env 파일을 찾을 수 없습니다: ${PROJECT_DIR}/.env${NC}"
        exit 1
    fi
    
    # Prisma 마이그레이션 실행 (배포 전에 데이터베이스 준비)
    echo -e "${YELLOW}Prisma 마이그레이션 실행 중...${NC}"
    cd $PROJECT_DIR
    
    # pnpm이 없으면 설치
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}pnpm 설치 중...${NC}"
        npm install -g pnpm || {
            echo -e "${RED}✗ pnpm 설치 실패${NC}"
            exit 1
        }
    fi
    
    # 의존성 설치 (prisma CLI 필요)
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/prisma" ]; then
        echo -e "${YELLOW}의존성 설치 중...${NC}"
        pnpm install --frozen-lockfile || {
            echo -e "${RED}✗ 의존성 설치 실패${NC}"
            exit 1
        }
    fi
    
    # Prisma 마이그레이션 실행
    pnpm exec prisma migrate deploy || {
        echo -e "${RED}✗ Prisma 마이그레이션 실패${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Prisma 마이그레이션 완료${NC}"
    
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
                read -p "이전 컨테이너를 제거하시겠습니까? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
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

