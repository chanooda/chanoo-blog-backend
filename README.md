# 찬우 블로그 어드민

## 기술 스택

- NestJS
- Prisma (SQLite)
- Docker
- pnpm

## 개발 환경 설정

### sharp

sharp 라이브러리를 사용해 이미지를 최적화하고 있기 때문에 node_module install 시에  
`npm install --platform=linux sharp` 를 사용해야 합니다.

## 배포

### 무중단 배포 (Blue-Green)

이 프로젝트는 Docker 기반 Blue-Green 무중단 배포를 지원합니다.

자세한 내용은 [BLUE_GREEN_DEPLOYMENT.md](./BLUE_GREEN_DEPLOYMENT.md)를 참고하세요.

**빠른 시작:**

```bash
# 배포 스크립트 실행
./deploy-blue-green.sh
```

### 일반 배포

일반 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.
