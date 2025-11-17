# GitHub Actions를 통한 Google Cloud VM 배포 가이드

이 가이드는 GitHub Actions를 사용하여 Google Cloud VM에 자동으로 배포하는 방법을 설명합니다.

## 📋 사전 요구사항

1. Google Cloud VM 인스턴스 생성 및 SSH 접속 가능
2. GitHub 저장소에 Secrets 설정
3. VM에 Docker 및 Nginx 설치 완료

## 🔐 GitHub Secrets 설정

GitHub 저장소의 Settings → Secrets and variables → Actions에서 다음 Secrets를 추가하세요:

### 필수 Secrets

1. **GCP_SSH_PRIVATE_KEY**
   - VM에 접속할 수 있는 SSH 개인 키
   - 생성 방법은 아래 참고

2. **GCP_VM_IP**
   - VM의 외부 IP 주소
   - 예: `34.123.45.67`

3. **GCP_VM_USER**
   - VM의 사용자 이름
   - 예: `ubuntu`, `gcp-user`

4. **환경 변수 Secrets**
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `MASTER_ID`
   - `MASTER_PW`
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET_NAME`
   - `CLOUDFLARE_R2_PUBLIC_URL`
   - `STORAGE_PROVIDER`
   - 기타 필요한 환경 변수들

## 🔑 SSH 키 생성 및 설정

### 1. 로컬에서 SSH 키 생성 (없는 경우)

```bash
# SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_gcp

# 공개 키를 VM에 추가
ssh-copy-id -i ~/.ssh/github_actions_gcp.pub $GCP_VM_USER@$GCP_VM_IP
```

### 2. GitHub Secrets에 개인 키 추가

```bash
# 개인 키 내용 복사
cat ~/.ssh/github_actions_gcp

# GitHub Secrets → GCP_SSH_PRIVATE_KEY에 붙여넣기
# (-----BEGIN OPENSSH PRIVATE KEY----- 부터 -----END OPENSSH PRIVATE KEY----- 까지 전체)
```

### 3. VM에서 공개 키 확인

```bash
# VM에 SSH 접속
ssh $GCP_VM_USER@$GCP_VM_IP

# authorized_keys 확인
cat ~/.ssh/authorized_keys
```

## 🚀 워크플로우 설정

### 1. 워크플로우 파일 위치

`.github/workflows/deploy-gcp.yml` 파일이 자동으로 사용됩니다.

### 2. 트리거 설정

현재 설정:

- `main` 또는 `develop` 브랜치에 push 시 자동 배포
- `workflow_dispatch`로 수동 실행 가능

수정하려면 `.github/workflows/deploy-gcp.yml` 파일의 `on:` 섹션을 변경하세요.

## 📝 배포 프로세스

워크플로우가 실행되면:

1. **코드 체크아웃**: GitHub 저장소에서 코드 가져오기
2. **빌드**: Node.js 환경 설정 및 의존성 설치
3. **프로덕션 빌드**: Prisma 생성 및 TypeScript 빌드
4. **환경 변수 생성**: GitHub Secrets에서 `.env` 파일 생성
5. **배포 파일 준비**: 필요한 파일들을 `deploy/` 디렉토리에 복사
6. **압축**: `deploy.tar.gz` 생성
7. **SSH 설정**: SSH 키 설정 및 VM 접속 준비
8. **파일 전송**: SCP를 통해 VM에 파일 전송
9. **배포 실행**: VM에서 Blue-Green 무중단 배포 스크립트 실행

## 🔧 VM 초기 설정

VM에서 한 번만 실행하면 됩니다:

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Nginx 설치
sudo apt update
sudo apt install -y nginx

# 프로젝트 디렉토리 생성
mkdir -p /home/ubuntu/blog-backend

# Nginx 초기 설정 (한 번만)
sudo nano /etc/nginx/sites-available/blog-backend
# nginx.conf.template 참고하여 설정 추가

sudo ln -s /etc/nginx/sites-available/blog-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🧪 테스트

### 1. 워크플로우 수동 실행

GitHub 저장소 → Actions → "Deploy to Google Cloud VM" → "Run workflow"

### 2. 배포 확인

```bash
# VM에 SSH 접속
ssh $GCP_VM_USER@$GCP_VM_IP

# 컨테이너 상태 확인
docker ps

# 헬스 체크
curl http://localhost:4000/api/health

# Nginx를 통한 접근 확인
curl http://localhost/api/health
```

## 🔍 문제 해결

### SSH 연결 실패

```bash
# SSH 키 권한 확인
chmod 600 ~/.ssh/id_rsa

# VM의 authorized_keys 확인
cat ~/.ssh/authorized_keys

# SSH 연결 테스트
ssh -i ~/.ssh/id_rsa $GCP_VM_USER@$GCP_VM_IP
```

### 배포 실패

```bash
# VM에서 로그 확인
docker logs blog-backend-blue
docker logs blog-backend-green

# 배포 스크립트 수동 실행
cd /home/ubuntu/blog-backend
./deploy-blue-green.sh
```

### 환경 변수 문제

```bash
# .env 파일 확인
cat /home/ubuntu/blog-backend/.env

# GitHub Secrets 확인
# 저장소 → Settings → Secrets and variables → Actions
```

## 🔒 보안 고려사항

1. **SSH 키 관리**
   - 개인 키는 절대 공개하지 않기
   - GitHub Secrets에만 저장
   - 정기적으로 키 로테이션

2. **환경 변수**
   - 민감한 정보는 모두 GitHub Secrets에 저장
   - `.env` 파일은 Git에 커밋하지 않기

3. **VM 접근 제한**
   - 방화벽 규칙으로 필요한 포트만 열기
   - SSH는 특정 IP에서만 접근 가능하도록 제한 (선택사항)

## 📊 배포 모니터링

### GitHub Actions 로그

- 저장소 → Actions → 실행된 워크플로우 클릭
- 각 단계별 로그 확인

### VM에서 모니터링

```bash
# 컨테이너 상태
docker ps

# 리소스 사용량
docker stats

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 롤백

배포 실패 시 자동 롤백되거나, 수동으로 롤백할 수 있습니다:

```bash
# VM에 SSH 접속
ssh $GCP_VM_USER@$GCP_VM_IP

# 이전 버전으로 롤백
cd /home/ubuntu/blog-backend
# 백업 디렉토리에서 복원하거나
# Git에서 이전 커밋으로 체크아웃 후 재배포
```

## 📝 추가 설정

### 브랜치별 배포

다른 브랜치를 다른 VM에 배포하려면:

```yaml
# .github/workflows/deploy-gcp.yml 수정
on:
  push:
    branches: [main]  # main은 프로덕션
  workflow_dispatch:
```

별도의 워크플로우 파일을 만들어 개발 환경용으로 설정할 수 있습니다.

### 알림 설정

배포 성공/실패 시 Slack, Discord 등으로 알림을 받으려면 워크플로우에 알림 단계를 추가하세요.

## ✅ 체크리스트

배포 전 확인사항:

- [ ] GitHub Secrets 설정 완료
- [ ] SSH 키 생성 및 VM에 추가
- [ ] VM에 Docker 설치 완료
- [ ] VM에 Nginx 설치 및 초기 설정 완료
- [ ] 방화벽 규칙 설정 (포트 80, 443)
- [ ] 환경 변수 Secrets 모두 추가
- [ ] 워크플로우 파일 커밋 및 푸시

## 🎯 요약

1. **GitHub Secrets 설정**: SSH 키 및 환경 변수
2. **VM 초기 설정**: Docker, Nginx 설치
3. **워크플로우 실행**: 자동 또는 수동
4. **배포 확인**: 헬스 체크 및 로그 확인

자세한 내용은 `BLUE_GREEN_DEPLOYMENT.md`를 참고하세요.
