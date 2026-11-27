# 창고 · 부자재 통합 관리

`unified/`는 [통합 관리 사이트](https://warehouse-unified-84fef.web.app/)에서 제공하던 프런트엔드 배포 파일입니다. 창고 재고는 `/`, 부자재 계산은 `/calculator.html`에서 열립니다. JavaScript와 CSS는 배포 당시의 빌드 결과물입니다. Cloud Functions 원본과 Firestore 데이터는 이 폴더에 포함되지 않습니다.

저장소 루트에서 아래 명령을 실행하면 Firebase Hosting 에뮬레이터로 두 화면을 열 수 있습니다.

```sh
npm ci
npx firebase emulators:start --only hosting --config firebase.unified.json --project warehouse-inventory-84fef
```

에뮬레이터는 정적 파일을 로컬에서 제공합니다. 로그인과 업무 데이터 요청은 화면에 설정된 운영 Firebase 서비스를 사용합니다.
