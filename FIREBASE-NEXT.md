# 별도 Firebase 창고 화면

새 화면 주소: https://warehouse-inventory-v2-84fef.web.app/
기존 화면 주소: https://warehouse-inventory-84fef.web.app/

두 화면은 같은 Firebase 프로젝트 warehouse-inventory-84fef를 사용합니다. 기존 Authentication 계정, roles 권한, shelves/pallets 재고 문서와 saveInventory 서버 함수를 공유합니다. 새 화면에서 저장한 재고는 기존 화면에도 반영됩니다. DB 복사·초기화·위치 ID 변환은 하지 않습니다.

## 이번 반영

- 기존 도면과 위치 ID를 유지하며 기둥을 최상단에 표시하고 팔레트의 도면 텍스트를 숨깁니다.
- 선반 우선 순서와 2단 × n칸을 유지합니다. 칸은 최소 220px, 간격 20px이며 가로 스크롤합니다. 목록 보기 전환은 없습니다.
- 품목 선택 버튼을 누른 목록 안에서 이름 또는 품목코드를 검색하고 클릭·방향키·Enter로 선택합니다.
- 검색 후보는 기존 창고 재고의 제품명과 stock/p3l, stock/ecount, stock/carton의 ERP 품목입니다. 코드가 있는 ERP 제품은 코드로도 검색합니다. 기존 데이터 형식에 맞게 저장은 제품명 기준이며 새로운 제품명도 명시적으로 입력할 수 있습니다.
- 시스템 글꼴·간격·버튼 크기·카드와 팝업 스타일을 개선했습니다. 불필요한 소개 문장은 없습니다.
- 기존 계산기·엑셀·BOM 페이지, Cloud Functions와 Firestore 규칙은 변경하지 않습니다.

이 별도 화면은 기존 Firebase 앱의 개선 버전입니다. 로컬 SQLite 버전의 계정 관리·백업 관리·거래 되돌리기 서버를 복사하거나 새 Firebase 기능으로 배포하지 않습니다. 기존 Firebase 감사/복구 기능은 기존 사이트에 유지됩니다.

## 빌드·검증

```sh
npm ci --ignore-scripts
npm run build
npm run build:next
npm test
```

`build:next`는 dist-next에 새 화면만 만듭니다. 기존 dist와 src/warehouse.js를 덮어쓰지 않습니다. 자동 테스트는 제품 후보 병합·검색, 도면 JSON 동일성, SRI, 별도 Hosting 설정 및 기존 데이터 검증을 포함합니다. 실제 브라우저의 검증용 로컬 자료로 선반 18개의 두 줄 배치·겹침 없음과 검색 후 선택을 확인했습니다. 운영 DB에 테스트 재고를 쓰지 않았습니다.

## 새 화면만 배포

Firebase CLI로 프로젝트에 권한 있는 계정에 로그인한 뒤:

```sh
npm run deploy:next
```

이 명령은 firebase.next.json에 지정된 별도 Hosting 사이트만 배포합니다. 기존 Hosting 사이트, DB 규칙, Functions는 배포하지 않습니다. 새 사이트에서도 기존 승인된 계정으로 로그인합니다.

GitHub의 코드 업로드와 Firebase Hosting 배포는 별도 단계입니다. GitHub Pages의 기존 리디렉션은 그대로 유지됩니다. Firebase Blaze의 기존 사용량 과금과 읽기/쓰기 제한은 계속 적용됩니다.
