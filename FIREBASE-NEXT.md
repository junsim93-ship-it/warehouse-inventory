# 별도 Firebase 창고 화면

- 새 화면: https://warehouse-inventory-v2-84fef.web.app/
- 기존 화면: https://warehouse-inventory-84fef.web.app/

새 화면은 로컬에서 제작한 React 앱의 구획도, 재고 현황, 품목 선택, 입출고 기록, 운영 관리 화면을 그대로 사용합니다. 기존 사이트의 HTML을 꾸민 버전이 아닙니다. `ui/`가 화면 원본이며 저장·인증 통신만 Firebase로 연결했습니다.

## 공유 데이터

기존 Firebase 프로젝트 `warehouse-inventory-84fef`의 Authentication 계정과 `roles` 권한, `shelves`·`pallets` 재고를 공유합니다. 위치 연결은 `functions/ui-shared/mapping.json`에 명시되어 있습니다. 기존 재고를 복사하거나 초기화하지 않습니다. 기존 도면·계산기·엑셀·BOM 페이지는 유지합니다.

선반은 2단 × n칸이며 가로 스크롤을 사용합니다. 품목은 선택 목록 안에서 검색합니다. 기존 재고의 제품명에는 안정적인 코드를 부여하고 신규 제품은 `uiProducts`에 등록합니다. 기존 재고 문서에는 원래 형식의 제품명·수량·로트·유통기한·기준수량을 저장하므로 두 화면에서 같은 값을 읽습니다.

`warehouseUiApi`는 서버에서 권한을 확인하고 Firestore 트랜잭션으로 셀 충돌, 구조 변경, 기준수량 동기화, 입출고·되돌리기를 처리합니다. 기존 사이트의 변경도 `auditLog`에서 확인할 수 있습니다. 새 사이트의 입출고 상세·되돌리기 기록은 `uiLedger`에 저장합니다. 기존 사이트에서 입력한 과거 기록에 입출고 사유가 소급 생성되지는 않습니다.

백업은 `uiBackups`와 하위 documents에 선반·팔레트 원본을 보관합니다. 수동 백업, 다운로드, 복원 직전 자동 백업과 매일 한국시간 03시 자동 백업(`warehouseDailyBackup`)을 지원합니다. 백업 파일에는 계정 비밀번호나 토큰을 포함하지 않습니다. 계정 관리는 Firebase Authentication과 roles를 사용하며 계정 변경 시 기존 세션을 만료시킵니다.

Firestore 클라이언트 쓰기는 계속 차단합니다. 제품 목록 읽기만 승인된 사용자에게 추가로 허용합니다. 백업·상세 거래·계정 관리는 서버 API를 통해 권한 검사 후 접근합니다. Firebase Blaze의 Functions·Firestore·Scheduler 사용량 과금은 적용됩니다.

## 빌드와 검증

```sh
npm ci --ignore-scripts
npm --prefix functions ci --ignore-scripts
npm run build
npm run build:next
npm test
npm run test:rules
```

규칙·API 통합 검증에는 Java 21 이상의 Firestore 에뮬레이터가 필요합니다. Windows에서 Java 로컬 소켓 오류가 나면 `JAVA_TOOL_OPTIONS=-Djava.net.preferIPv4Stack=true`를 설정하세요.

브라우저용 에뮬레이터는 `node scripts/build-emulator.mjs` 후 `firebase emulators:start --config firebase.emulator.json --project demo-react-warehouse`로 실행합니다. 이 빌드는 운영 프로젝트에 연결하지 않습니다. 검증용 계정·재고는 에뮬레이터에만 생성합니다.

## 배포

먼저 서버와 규칙을 배포합니다.

```sh
firebase deploy --only functions:inventory:warehouseUiApi,functions:inventory:warehouseDailyBackup,functions:inventory:saveInventory,firestore:rules --project warehouse-inventory-84fef
```

`saveInventory`의 기존 동작은 유지하며 계정 변경으로 만료된 세션 차단만 추가됩니다. 이후 새 사이트만 배포합니다.

```sh
npm run deploy:next
```

`firebase.next.json`에는 새 Hosting 사이트만 지정되어 있습니다. 이 명령은 기존 Hosting 사이트를 덮어쓰지 않습니다. GitHub 업로드와 Firebase 배포는 별도 단계입니다.
