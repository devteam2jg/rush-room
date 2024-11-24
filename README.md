# 프로젝트 개요
실시간 스트리밍 Web 경매 서비스
# 서비스 소개 
- 실시간 스트리밍으로 본인의 물건을 직접 홍보 및 판매
- 입찰가에 따른 경매 시간 변동으로 치열하고 재미있는 온라인 경매 경험
# 기능 소개 
### 실시간 채팅 기능
- 실시간 채팅으로 구매자 판매자가 소통할 수 있어요
### 실시간 스트리밍 기능
- 실시간 방송으로 물건을 설명할 수 있어요
### 이미지, 동영상 업로드 기능
- 경매품의 상세 이미지와 동영상을 업로드 할 수 있어요
### 활발한 경매 진행을 위한 다양한 기능
- 입찰 금액에 따라 시간이 변동되는 동적 경매시스템으로 경매 경쟁을 활발하게 만들어요
# 아키텍처 
![러시룸 아키텍처](https://github.com/user-attachments/assets/e37e0c49-b69f-40e9-a322-56b0a28e1551)

# 시연영상

[![러시룸 시연영상](http://img.youtube.com/vi/jYSYA7rW5AU/0.jpg)](https://youtu.be/jYSYA7rW5AU?t=0s) 
이미지를 클릭시 유튜브로 이동합니다.

# version 
## 2024.10.14 ~ 2024.11.15 -> v1.0 메인기능 구현 
- mediasoup를 사용해 sfu방식 실시간 스트리밍 기능 구현
- passport로 소셜 로그인 전략패턴으로 구현
- Redis와 bull(MQ)를 이용한 입찰 시스템 및 시간 감소 로직 구현
- socket 통신 구현
- 로그인 Guard 및 경매 Guard 구현
- AWS File 업로드 및 영상 파일 HLS 트랜스 코딩 구현
- 경매 서비스에 필요한 기초 CRUD 구현
- pm2기반 모노레포 방식 도입, /src/app 디렉토리
- pm2와 git-action을 이용한 3개 인스턴스 CI/CD 파이프라인 구축
- ConfigModule를 이용한 환경변수 관리
- typeorm 적용
- class-validator, class-transformer을 이용한 유효성 검사
- test를 위한 모듈 및 기능 개발 ( 익명 로그인 기능 )

# 팀원소개 
### 정현우 | Back-End Developer | Product Manager

Email. smartcow.jung@gmail.com
### 이승현 | Back-End Developer 
Email. xx@gmail.com
### 서현승 | Back-End Developer | DevOps
Email. hab5bur9@gmail.com

# 기술 스택
### Language
- Nestjs

### DB 
- typeorm
- postgresql

### auth 
- JWT
- passport 

### Bid
- Bull(Message Queue)
- redis

### Streaming
- mediasoup

### AWS 
- aws ec2 
- aws s3 
- aws CloudFront
- aws MediaConvert

# 세부 내용
### Backend Framework(NestJS)
- 더 가벼운 러닝커브
- 더 적은 설정 파일과 의존성
- JavaScript 생태계의 풍부한 라이브러리 활용 가능
- 프론트엔드와 동일한 언어 사용으로 협업 용이
### WebRTC(SFU)
- 실시간 경매라는 도메인의 특징 상, 1s 이내의 delay의 영상 송수신이 필요
    - 모바일 웹 환경에서 ffmpeg는 사용 불가
    - HLS 방식은 encoding time으로 인한 낮은 실시간성
- 1s 이내의 실시간성과, 대규모의 동접자를 수용하기 위해 webRTC 중 SFU 방식을 채택하기로 결정
    - 위의 목표를 달성하기 위해 ‘Mediasoup’ 도입 결정
        - OpenVidu
            - webRTC 실시간 영상통화 서비스를 쉽게 구축하게 해주는 platform
            - 고수준의 api를 제공하여 쉽고 빠르게 media server 구축 가능
            - 상대적으로 더 많은 리소스 사용
        - Mediasoup
            - sfu 방식의 webRTC media server 구축을 도와주는 node.js 기반 library
            - 저수준의 api를 제공. video, audio 품질, bitrate 조정, 개별 스트림 레벨 제어 등 실시간 스트리밍 품질과 관련된 다양한 요소를 직접 조절 가능
            - 상대적으로 적은 리소스 사용
### Passport 
- 초기 기획은 다양한 소셜로그인 지원
    - 서버에서 사용자의 데이터를 저장할 필요가 있었기에 OAuth2.0의 REST API 방식을 사용해야함.
    - REST API ( 권한 코드 승인 방식 )은 Handshake 과정이 존재하며 이 과정은 소셜미디어 마다 차이가 존재할 수 있음.
    - 해당 Handshake 과정을 전략패턴으로 구현하는 Passport 라이브러리 채택
- 높은 확장성: 일반 로그인 및 JWT와 연계가 용이함
    - 소셜 로그인외에 JWT 토큰을 자체 발급해야함.
    - JWT 토큰에 대한 처리(유효성) 또한 passport를 통해 간편히 다룰 수 있음.
### Lifecycle 
- 효율적인 자원관리 및 동작의 일관성 보장 필요
    - 단일 class에 로직을 집중하고 이 class를 비동기 익명생성하는 방식으로 경매 시스템을 구현. 경매가 종료된다면 GC에 의해 수집될 수 있음.
- 비동기 실행되는 경매에 접근할 방법이 필요함.
    - Hash Map으로 진행중인 경매를 관리하여 O(1)의 접근 시간을 보장함.
        - result → 사용자는 경매에 관한 모든 로직에서 경매 ID를 요구받게 됨.
- 경매 State에 따른 사용자 접근 제한이 필요함
    - Hash Map에 존재하면 경매는 진행 중이라 판단, Hash Map에 특정 경매가 존재하는지 여부를 판단하는 Guard ( nestjs)를 구현하여 진행중인 경매가 아니라면 JOIN 및 모든 요청 거부
- Lifecycle에 기능이 많아질 수록 DI 관련 로직이 증가해 효율성 감소
    - 함수형 프로그래밍 방식 채택. 미리 선언된 필요한 함수를 Lifecycle에 등록하는  것으로 IOC를 구현. Lifecycle은 의존성관련 코드가 없어도 다양한 모듈에 접근이 가능함.
### Redis 
- 실시간 데이터 처리
    - Redis의 인메모리 아키텍처는 밀리초 단위의 응답 속도를 보장하여, 실시간 입찰요청 처리를 빠르게 수행할 수 있음
- 확장성과 고가용성
    - Redis는 클러스트링을 통해 수평 확장이 가능
    - 사용자 수와 입찰 요청이 증가해도 성능 저하없이 확장 가능
- Bull Queue와의 호환성
    - 같이 도입한 기술인 Bull Queue는 Redis를 기반으로 설계되어, 두 기술 간 통합이 간단하고 효율적임
- 입찰 기록 로깅
    - 입찰 기록을 Redis에 로깅, 시간 변동 로직에서 조회하여 비교후 감소할 시간량을 산출
### Bull Queue
- 경매 입찰 요청의 동시성 문제 해결
    - 경매가 진행될 때 다수의 입찰 요청을 순차적으로 처리하고, 데이터 무결성을 보장하기 위한 메세지 큐 필요
    - Bull Queue는 메세지 큐 역할을 하며, 작업(job)을 Redis를 이용해 효율적으로 관리하고 작업 상태를 추적 가능
- 작업 처리의 안정성
    - Bull queue는 작업을 실패하면 자동으로 재시도하거 실패 상태로 전환하여 관리할 수 있는 기능을 제공함
    - 실시간 경매 중 발생할 수 있는 처리 오류를 안정적으로 관리 가능
- 직관적인  API, Nest.js에 적합
    - Bull Queue 사용하기 쉬운 API를 제공하여 작업 큐 생성, 작업 추가, 작업 처리등을 수월하게 구현 가능
    - Node.js 환경에서 사용하기 적합하도록 설계되어, Nest.js에서 쉽게 도입 가능한 기술

# 프로젝트 회고
## 한계점 및 개선 방안
- webRTC Test 불완전성
    - delay 측정의 오차
        - 실제 delay는 다음과 같은 값을 포함함.
            - delay = 송신 측 encoding time + packet send to server network time + server processing time + packet send to
              수신 network time + 수신 측 buffer time + processing time(decoding + rendering)
            - delay에서 가장 큰 영향은 사실 network time임. 아무리 서비스를 잘 만들어도 network 품질이 떨어진다면 delay는 늘어날 수 밖에 없음
            - 그리하여 delay의 요소 중 network time은 배제하고, 그 다음 크게 영향을 끼칠 수 있는 요소인 buffer time과 processing time만으로 delay를 추정함

- 시간 줄이기 로직에서 논리적 충돌(Lock)
    - 현재 시간을 줄이는 로직과 시간이 흐르는 로직에 대해 별다른 lock을 구현하지 않고 있음.
        - Node가 Single Thread 기반이라 별 문제없이 작동하는 듯 여겨지지만 정확한 이유 파악및 lock 도입 필요

- 단일 Queue로 모든 입찰 요청을 관리
    - 모든 경매에서 동일 Queue 사용
        - 병렬적으로 진행되는 각 경매 세션에 대해서 경매 입찰 메세지 큐를 분리하지 않고 있음
        - 하나의 Queue로 모든 입찰 요청을 처리하기 때문에 Queue 생성 및 관리가 단순하다는 장점이 있지만, 병목현상 발생 가능
    - 경매방 ID를 기준으로 개별 Queue 생성 필요
        - 병렬 처리가 향상되어, 특정 경매방에서 대량의 입찰 요청이 발생하더라도 다른 경매방에 영향을 주지 않음
        - 각 Queue가 특정 경매방의 작업만 처리하여, 작업 상태 추적 및 관리가 용이질 것으로 기대

- EDA(Event Driven Architecture) 구현
    - MSA에서 서비스 간 통신 미흡
        - Media Server와 Bid Server의 통신 방법으로 Bull과 Redis를 이용한 Message Subscribe 방식을 도입하려 했으나 시간적인 이유로 구현까지는 이르지 못했음
    - 경매 진행서버와 입찰 서버의 분리 필요
        - 단기간에 입찰이 엄청많이 발생하면 Bid Server가 이 응답을 다 처리하는 동안 시간을 감소시키지 못해 경매 시간이 줄지 않는 현상
            - 물리적으로 서버를 분리해야했으나 Message Subscribe 방식이 선행되어야 했기에 마찬가지로 구현에는 이르지 못했음.

- Scale out 고려 미흡
    - 현재 경매에 대한 정보는 In-memory의 Context객체를 통해 관리되고 있음
        - 만약 Context객체가 저장하고 있는 정보를 Redis로 옮겨도 지연시간이 크지 않다면 (측정 필요) 기존 Context 객체는 Redis의 값을 참조하도록 변경한 이후 인스턴스 자체를 Scailing하는 방식으로 높은 부하에 대응할 수 있을 것이라 예상