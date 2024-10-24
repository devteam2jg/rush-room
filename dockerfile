# 1. 베이스 이미지 선택
FROM node:22

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 필요한 파일 복사
COPY package*.json ./
RUN npm install -g pnpm
# 4. 의존성 설치
RUN pnpm install

# 5. 애플리케이션 파일 복사
COPY . .

RUN pnpm run build
# 6. 환경 변수 설정
COPY .env .env

# 7. 포트 설정
EXPOSE 3000

# 8. 애플리케이션 시작
CMD ["pnpm","run" ,"start:prod"]