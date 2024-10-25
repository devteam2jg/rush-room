#!/bin/bash

# Docker 컨테이너 실행 명령어
docker run -d -p 3000:3000 --name rush-room-v3 --restart unless-stopped rush-room-v3

# 실행 결과 출력
if [ $? -eq 0 ]; then
  echo "Docker container 'rush-room-v3' started successfully."
else
  echo "Failed to start Docker container 'rush-room-v3'."
fi