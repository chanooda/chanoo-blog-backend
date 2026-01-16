#! /bin/bash

# 에러 처리 설정
set -e          # 명령 실패 시 즉시 종료
set -u          # 정의되지 않은 변수 사용 시 오류
set -o pipefail # 파이프라인에서 오류 감지

REGISTRY_URL="127.0.0.1:5001"
IMAGE_NAME="blog-server-app"
IMAGE_TAG="latest"
FULL_IMAGE_PATH="$REGISTRY_URL/$IMAGE_NAME:$IMAGE_TAG"

APP_PORT=4000
APP_NAME=blog-server
TARGET_INC="/etc/nginx/conf.d/blog_server_target.inc"
NGINX_CONF="/etc/nginx/conf.d/blog_server.conf"
NGINX_CONF_TEMPLATE="nginx.conf.template"
BLUE_PORT=3000
GREEN_PORT=3001
RETRY_MAX_COUNT=50

# Nginx 설정 파일 초기화 (존재하지 않으면 템플릿에서 복사)
if [ ! -f "$NGINX_CONF" ]; then
    echo "> Nginx 설정 파일이 존재하지 않습니다. 템플릿에서 생성합니다: $NGINX_CONF"
        
    # 템플릿 파일 존재 확인
    if [ ! -f "$NGINX_CONF_TEMPLATE" ]; then
        echo "> 오류: $NGINX_CONF_TEMPLATE 파일을 찾을 수 없습니다."
        exit 1
    fi
    
    sudo cp "$NGINX_CONF_TEMPLATE" "$NGINX_CONF"
    echo "> Nginx 설정 파일 생성 완료: $NGINX_CONF"
fi

CURRENT_PORT=$(grep -oE ":[0-9]+" $TARGET_INC 2>/dev/null | sed 's/://' || echo "")

# 1. 현재 가동 중인 포트 확인
echo "현재 가동 중인 포트: $CURRENT_PORT"

# 1-1. 신규 배포할 타겟 port 지정
if [ "$CURRENT_PORT"  == "$BLUE_PORT" ]; then
    TARGET_PORT=$GREEN_PORT
    TARGET_COLOR="green"
    IDLE_PORT=$BLUE_PORT
    IDLE_COLOR="blue"
elif [ "$CURRENT_PORT" == "$GREEN_PORT" ]; then
     TARGET_PORT=$BLUE_PORT
     TARGET_COLOR="blue"
     IDLE_PORT=$GREEN_PORT
     IDLE_COLOR="green"
else
     TARGET_PORT=$BLUE_PORT
     TARGET_COLOR="blue"
     IDLE_PORT=$GREEN_PORT
     IDLE_COLOR="green"
fi

echo "신규 배포 대상 포트: $TARGET_PORT ($TARGET_COLOR)"

# 2. 새 컨테이너 실행

# 2-1. 기존에 실행중일지 모르는 동일한 컨테이너 정리 (기존에 실행중인 컨테이너 정리하는 것 아님)
echo "> 기존 $TARGET_COLOR 컨테이너가 있다면 종료합니다."
docker rm -f "$APP_NAME-$TARGET_COLOR" 2>/dev/null || true

# 2-2. 새로운 컨테이너 실행
echo " > 이미지 다운로드를 시작합니다."

docker pull "$FULL_IMAGE_PATH"

echo " > $TARGET_PORT 포트로 $TARGET_COLOR 컨테이너를 실행합니다."
docker run -d \
  --name "$APP_NAME-$TARGET_COLOR" \
  -p "$TARGET_PORT:$APP_PORT" \
  --env-file .env \
  --restart always \
  "$FULL_IMAGE_PATH"

# 3. 새 컨테이너 Health Check
echo "> Health Check 시작: http://127.0.0.1:$TARGET_PORT"

for RETRY_COUNT in $(seq 1 $RETRY_MAX_COUNT)
do
 echo "> 접속 시도 ($RETRY_COUNT/$RETRY_MAX_COUNT)..."
 
 # 3-1 health check 엔드포인트 요청을 통해 응답에 ok가 포함되었는지 확인
 # curl 실패 시에도 계속 진행하기 위해 || true 추가
 STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 http://127.0.0.1:$TARGET_PORT/api/health || echo "000")

  if [ "$STATUS_CODE" = "200" ]; then
    echo "> Health Check 성공! 새 컨테이너가 정상적으로 구동되었습니다."
    break
  fi

  if [ $RETRY_COUNT -eq $RETRY_MAX_COUNT ]; then
    echo "> Health Check 실패 (상태 코드: ${STATUS_CODE:-연결 실패}). 배포를 중단합니다."
    docker stop "$APP_NAME-$TARGET_COLOR"
    exit 1
  fi
  
  echo "> 아직 서버가 준비되지 않았습니다. 5초 후 다시 시도합니다."
  sleep 5
done
    

# 4. Nginx 타켓 변경 /etc/nginx/conf.d/blog-backend.inc 파일 수정 통해 가리키는 port 변경
echo "> Nginx 타켓 변경: $TARGET_INC -> $TARGET_PORT"
echo "server 127.0.0.1:$TARGET_PORT;" | sudo tee $TARGET_INC > /dev/null

echo "> Nginx 설정 문법 검사 중..."
if sudo nginx -t; then
  echo "> Nginx Reload 실행"
  sudo nginx -s reload
else 
  echo "> Nginx 설정에 문제가 있습니다. 배포를 중단하고 롤백을 검토하세요."
  docker stop "$APP_NAME-$TARGET_COLOR"
  exit 1
fi

echo "> 트래픽 전환이 성공적으로 완료되었습니다."

# 5 기존 컨테이너 종료
echo "> 기존 $IDLE_COLOR 컨테이너(포트: $IDLE_PORT)를 정리합니다."
EXISTING_IDLE_CONTAINER=$(docker ps -q -f name="$APP_NAME-$IDLE_COLOR")

if [ -n "$EXISTING_IDLE_CONTAINER" ]; then
    docker stop "$APP_NAME-$IDLE_COLOR"
    docker rm "$APP_NAME-$IDLE_COLOR"
    echo "> 기존 컨테이너 삭제 완료."
else
    echo "> 삭제할 기존 컨테이너가 없습니다."
fi

echo "> 모든 배포 과정이 성공적으로 끝났습니다!"