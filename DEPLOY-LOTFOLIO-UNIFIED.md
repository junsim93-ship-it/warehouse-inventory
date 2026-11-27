# Lotfolio 통합 워크스페이스 배포

대상 프로젝트는 `warehouse-inventory-84fef`, Hosting 사이트는 `warehouse-unified-84fef`다. 실제 배포 디렉터리는 `hosting/unified/`다. 아래 운영 단계는 Firebase 배포 권한이 있는 담당자가 실행한다.

## 1. 로컬 검증

저장소 루트에서 Node.js 22 이상과 Java 21 이상을 사용한다. 아래 테스트는 로컬 전용 프로젝트 `demo-lotfolio`를 사용하며 Firestore와 Storage를 함께 시작한다.

```sh
npm ci
npm run build:unified
node --test tests/lotfolio.test.mjs tests/lotfolio-legacy.test.mjs
node scripts/lotfolio-emulators.mjs test
npx firebase emulators:start --only hosting --config firebase.unified.json
```

Hosting 에뮬레이터가 출력한 주소에서 로그인 화면과 모바일 드로어를 확인한다. Hosting 단독 실행에서는 앱이 배포용 Firebase 설정을 사용하므로 운영 데이터를 쓰는 연습용으로 사용하지 않는다. 서비스 에뮬레이터를 유지하려면 별도 터미널에서 `node scripts/lotfolio-emulators.mjs start`를 실행한다. Auth는 9097, Firestore는 8787, Storage는 9297 포트를 사용한다. 테스트는 승인된 두 권한, 만료·미승인·회수 세션, 파일 크기·형식, 디자인 키 충돌과 변경, 대표 이미지, 원본 파일과 제품 가져오기를 검증한다.

## 2. 현재 운영본 확보

1. Firebase 콘솔에서 **프로젝트 ID**와 **Hosting 사이트 ID**를 확인한다. Hosting 릴리스 기록에서 현행 릴리스의 배포 시각과 버전을 기록한다.
2. Firestore Database → 규칙에서 현재 **게시 중인 전체 규칙**을 별도 파일에 복사한다. 서버에 있는 `approved()`, `roles`, `suppliers`, `purchaseOrders`, 재고·감사 관련 규칙을 보존한다. 저장소의 `firestore.rules`는 로컬 테스트용 기준이며 운영본보다 오래되었을 수 있다.
3. Storage 버킷이 있으면 버킷명, 현재 Storage 규칙 전문, CORS 설정을 함께 보관한다. 이 문서의 배포 범위는 통합 Hosting 사이트와 신규 경로의 규칙이다. 기존 Cloud Functions, 재고 문서, BOM, 공급처, 발주서 데이터는 배포 대상으로 지정하지 않는다.

## 3. Storage 활성화

Firebase 콘솔 → Storage에서 기본 버킷을 확인한다. 처음 활성화한다면 Blaze 요금제 및 조직의 리전 정책을 확인하고 **시작하기**에서 비공개 규칙으로 버킷을 생성한다. 앱의 `storageBucket` 값은 `warehouse-inventory-84fef.firebasestorage.app`다. 콘솔에서 확인한 기본 버킷 이름과 일치해야 한다. [Firebase Storage 설정](https://firebase.google.com/docs/storage/web/start)

브라우저에서 인증 헤더를 포함해 원본을 업로드하고 읽으므로 버킷 CORS 설정을 확인한다. Google Cloud CLI로 현재 설정을 조회하고 기존 항목을 보존한 파일에 통합 사이트의 origin을 추가한다. 실제 사용하는 `https://warehouse-unified-84fef.web.app`, 필요 시 `https://warehouse-unified-84fef.firebaseapp.com` 또는 사용 중인 맞춤 도메인을 사용한다. 배포 전 채널은 CLI가 출력한 해당 채널의 정확한 origin을 추가한다. 다음 항목은 병합 예시다. [Firebase 브라우저 다운로드와 CORS](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)

```json
{
  "origin": ["https://warehouse-unified-84fef.web.app"],
  "method": ["GET", "POST", "DELETE"],
  "responseHeader": ["Content-Type", "Authorization", "X-Goog-Upload-Protocol"],
  "maxAgeSeconds": 3600
}
```

```sh
gcloud storage buckets describe gs://warehouse-inventory-84fef.firebasestorage.app --format="json(cors_config)"
gcloud storage buckets update gs://warehouse-inventory-84fef.firebasestorage.app --cors-file=cors.merged.json
```

`cors.merged.json`은 CORS 항목들로 이루어진 **배열**이다. 버킷 이름과 원래 설정을 확인한 뒤 변경한다.

## 4. Firestore와 Storage 규칙 추가

1. 게시 중인 Firestore 규칙 사본에서 `match /databases/{database}/documents` 블록을 찾는다. 닫는 중괄호 바로 앞에 `rules/firestore-lotfolio.rules.snippet`의 내용을 넣는다. 파일 최하단의 서비스 닫는 괄호 뒤에 붙이면 컴파일되지 않는다. 이 조각은 기존 `approved()`를 호출하고 현재 역할 문서의 `sessionValidAfter`를 검사한다. 운영 `approved()`에 승인된 1·2단계 및 `auth_time` 기준 8시간 만료가 적용되는지 확인한다.
2. 검토 중인 운영 Firestore 원본을 작업 폴더 밖에 보관했다면 `node scripts/lotfolio-emulators.mjs test "/path/to/current-production.rules"`로 **해당 원본 + 스니펫**을 로컬에서 확인할 수 있다. 테스트용 병합 결과는 `.firebase/lotfolio/combined.rules`에만 작성된다. 기존 규칙의 더 넓은 와일드카드가 신규 컬렉션을 공개하는지도 함께 확인한다.
3. Storage가 신규 전용 버킷이면 `storage.rules`를 사용한다. 기존 규칙이 있는 버킷은 `match /b/{bucket}/o` 안에 신규 `lot...` 함수들과 `match /lotDesigns/{designKey}/{file}`만 병합한다. 다른 경로의 규칙과 기존 전체 경로 허용 규칙의 영향을 검토한다. Firestore 역할 문서를 처음 참조할 때 콘솔에 표시되는 Storage Rules → Firestore 연결 권한을 승인한다. [교차 서비스 권한 설정](https://firebase.google.com/docs/storage/security/rules-conditions#enhance_with_cloud_firestore)
4. 콘솔에서 두 병합본의 차이를 검토하고 규칙을 각각 게시한다. Firestore의 신규 대상은 `lotProducts`, `lotDesigns`, `lotRecords`, Storage 대상은 `lotDesigns/{designKey}/{fileId}.{ext}`다. 통합 Hosting 설정 파일에는 규칙이나 Functions 배포 항목이 없다.

## 5. 미리보기, 배포, 복구

운영 규칙 게시 후 먼저 동일 Firebase 프로젝트의 임시 Hosting 채널로 올린다.

```sh
npx firebase hosting:channel:deploy lotfolio-check --expires 1d --project warehouse-inventory-84fef --config firebase.unified.json
```

미리보기 채널은 실제 인증과 데이터를 공유한다. 승인 계정으로 기존 재고·계산 화면과 인쇄 미리보기를 읽고, 식별 가능한 테스트 제품·디자인으로 이미지/PDF 업로드, 한글 이름 다운로드, 400% 확대, 차수별 디자인 연결, Ctrl+K, 로그아웃을 점검한다. 운영 발주서를 저장할 필요 없이 발주서 품목의 로트 입력까지 확인할 수 있다. 미승인 계정에서 로그인 차단도 확인한다.

검증한 채널 버전 자체를 라이브 채널에 복제한다. 라이브 릴리스는 새 세션부터 적용되며 기존 데이터를 이관할 필요가 없다. [채널 배포와 릴리스 복제](https://firebase.google.com/docs/hosting/manage-hosting-resources)

```sh
npx firebase hosting:clone warehouse-unified-84fef:lotfolio-check warehouse-unified-84fef:live --project warehouse-inventory-84fef
```

UI를 되돌리려면 Hosting 콘솔의 해당 사이트 릴리스 기록에서 이전 버전을 선택해 롤백한다. 규칙을 되돌려야 할 때는 이후 다른 운영자가 변경한 부분을 보존하고 신규 블록만 제거하거나, 다른 변경이 없으면 저장한 직전 규칙을 다시 게시한다. 복구 과정에서 Lotfolio 문서나 원본 파일을 일괄 삭제하지 않는다.

## 저장 방식과 첨부파일 정리

제품 문서 ID는 문자열 제품번호이고 디자인 문서 ID는 표준 디자인 키다. 이미 존재하는 디자인 키는 트랜잭션에서 거부된다. 키 변경은 해당 버전의 첨부파일을 새 키 경로에 복사한 뒤 한 트랜잭션으로 새 문서를 게시하고 이전 문서를 삭제한다. 발주 이력은 발주 당시 키를 보존한다. 두 사용자가 같은 버전을 수정하면 뒤의 편집자에게 최신 자료로 다시 열라는 안내가 표시된다.

브라우저는 이미지·PDF마다 새로운 AES-256-GCM 키와 96비트 IV를 생성해 업로드 전에 암호화한다. Storage에는 원본과 크기가 같은 암호문, 원본 파일명·형식, 암호화 형식 표시가 저장된다. 키·IV·128비트 인증 태그는 승인된 세션만 읽을 수 있는 Firestore 디자인 문서의 `files[].protection`에 저장된다. 원본 열람과 한글 파일명 다운로드 시 브라우저가 인증 태그 및 경로·파일 정보를 검증하고 복호화한다. 버킷 객체만으로는 시안 원본을 열 수 없다. 디자인 키를 변경하면 새 경로에 새 암호화 키로 저장한다. 백업·복구 시 Firestore 디자인 문서와 Storage 객체를 한 쌍으로 보존해야 한다.

Storage와 Firestore에는 서비스 간 원자적 트랜잭션이 없어 업로드 도중 브라우저가 강제로 종료되거나 파일 정리 시점에 권한을 잃으면 미참조 파일이 남을 수 있다. UI가 정리 대기를 표시하면 운영 담당자가 해당 키의 최신 디자인 문서 `files[].path`와 버킷 경로를 대조한다. 진행 중인 업로드나 키 변경이 끝난 뒤 참조 여부를 한 번 더 확인하여 미참조 객체만 정리한다. 동일 이름의 이전 시안과 현재 시안은 `fileId`로 구분한다.
