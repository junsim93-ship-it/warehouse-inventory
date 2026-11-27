# Lotfolio 패키징 · 창고 워크스페이스

`unified/`는 통합 사이트의 Firebase Hosting 공개 디렉터리입니다. `/`에서 로그인하면 로트 생성기가 열리고, 사이드바에서 디자인 라이브러리, 부자재 계산·발주, 창고 구획도, 제품 마스터로 이동할 수 있습니다. 기존 주소 `/calculator.html`은 부자재 계산 화면을 엽니다.

셸과 신규 화면의 편집 원본은 저장소 루트의 `lotfolio/`에 있습니다. 창고와 계산기 화면은 `hosting/unified/`의 기존 배포 파일을 사용합니다. 저장소 루트에서 빌드한 뒤 로컬 Hosting으로 열 수 있습니다.

```sh
npm ci
npm run build:unified
npx firebase emulators:start --only hosting --config firebase.unified.json --project warehouse-inventory-84fef
```

Hosting만 실행하면 로그인과 업무 데이터 요청은 운영 Firebase 서비스를 사용합니다. 격리된 규칙 테스트, Storage 설정, 기존 규칙 병합, 미리보기 및 롤백 절차는 [배포 안내](../DEPLOY-LOTFOLIO-UNIFIED.md)에 있습니다.
