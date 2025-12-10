#!/bin/bash
set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 설정
PROJECT_DIR="/home/hanrhfqkq/blog-backend"
BLUE_PORT=4000
GREEN_PORT=4001
BLUE_CONTAINER="blog-backend-blue"
GREEN_CONTAINER="blog-backend-green"
IMAGE_NAME="blog-backend"
# GitHub Actions 등 비대화형 환경에서 이전 컨테이너 제거 여부를 제어
REMOVE_OLD_CONTAINER_ON_DEPLOY="${REMOVE_OLD_CONTAINER_ON_DEPLOY:-false}"
NGINX_CONFIG="/etc/nginx/sites-available/blog-backend"
NGINX_ENABLED="/etc/nginx/sites-enabled/blog-backend"

CONTAINER_WAIT_TIMEOUT=120
CONTAINER_WAIT_INTERVAL=2
# 컨테이너 실행 상태 대기
wait_for_container_running() {
    local container_name=$1
    local elapsed=0

    echo -e "${YELLOW}컨테이너 상태 확인 중: ${container_name}${NC}"

    while [ $elapsed -lt $CONTAINER_WAIT_TIMEOUT ]; do
        status=$(docker inspect -f '{{.State.Status}}' "$container_name" 2>/dev/null || true)

        if [ "$status" = "running" ]; then
            echo -e "${GREEN}✓ 컨테이너 실행 확인: ${container_name}${NC}"
            return 0
        fi

        if [ "$status" = "exited" ] || [ "$status" = "dead" ] || [ -z "$status" ]; then
            echo -e "${RED}✗ 컨테이너 실행 실패: ${container_name} (상태: ${status:-unknown})${NC}"
            docker logs "$container_name" || true
            return 1
        fi

        sleep $CONTAINER_WAIT_INTERVAL
        elapsed=$((elapsed + CONTAINER_WAIT_INTERVAL))
    done

    echo -e "${RED}✗ 컨테이너가 제한 시간 내 실행되지 않았습니다: ${container_name}${NC}"
    docker logs "$container_name" || true
    return 1
}

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

# Nginx 설정 업데이트
update_nginx_config() {
    local target_port=$1
    local target_container=$2
    
    echo -e "${YELLOW}Nginx 설정 업데이트 중... (트래픽을 포트 ${target_port}로 전환)${NC}"
    
    # 템플릿 파일 사용 (heredoc 문제 완전 회피)
    # 템플릿 파일을 복사하고 포트만 교체
    if [ -f "$PROJECT_DIR/nginx.conf.template" ]; then
        sudo cp "$PROJECT_DIR/nginx.conf.template" $NGINX_CONFIG
        # 플레이스홀더를 실제 포트로 교체
        sudo sed -i "s/TARGET_PORT_PLACEHOLDER/${target_port}/g" $NGINX_CONFIG
    else
        # 템플릿 파일이 없으면 직접 생성 (heredoc 사용, 하지만 더 안전하게)
        sudo bash -c "cat > $NGINX_CONFIG" <<'EOF'
upstream backend {
    server localhost:TARGET_PORT_PLACEHOLDER;
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
EOF
        # 플레이스홀더를 실제 포트로 교체
        sudo sed -i "s/TARGET_PORT_PLACEHOLDER/${target_port}/g" $NGINX_CONFIG
    fi
    
    # Nginx 설정 파일 활성화 (심볼릭 링크 생성)
    if [ ! -L "$NGINX_ENABLED" ]; then
        echo -e "${YELLOW}Nginx 설정 파일 활성화 중...${NC}"
        sudo ln -sf $NGINX_CONFIG $NGINX_ENABLED
    fi

    # Nginx 설정 테스트
    if sudo nginx -t > /dev/null 2>&1; then
        # Nginx가 실행 중이면 reload, 아니면 start
        if systemctl is-active --quiet nginx 2>/dev/null; then
            sudo systemctl reload nginx
        else
            echo -e "${YELLOW}Nginx 시작 중...${NC}"
            sudo systemctl start nginx
        fi
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

    if wait_for_container_running $container_name; then
        echo -e "${GREEN}✓ 배포 성공: ${container_name}${NC}"
        return 0
    else
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
            echo -e "${GREEN}✓ 배포 성공!${NC}"
            
            # 이전 컨테이너 자동 제거 (환경 변수로 제어)
            if [ "$REMOVE_OLD_CONTAINER_ON_DEPLOY" = "true" ]; then
                echo -e "${YELLOW}환경 변수에 따라 이전 컨테이너를 제거합니다...${NC}"
                stop_container $old_container
                docker image prune -f
            else
                echo -e "${YELLOW}이전 컨테이너를 유지합니다. 제거하려면 REMOVE_OLD_CONTAINER_ON_DEPLOY=true 설정${NC}"
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

