# 보안 수정 배포 안내

## 2026-09-11 추가 보완

- Firestore 업무 데이터 및 감사 기록 읽기는 로그인 후 8시간 이내로 제한합니다.
- 인증된 계정의 저장 시도는 성공/실패와 무관하게 분당 30회까지 허용합니다. 횟수 기록은 업무 트랜잭션과 분리해 실패 시에도 유지합니다. 제한 초과 요청도 최소 DB 조회 비용은 발생하며, 익명 트래픽이나 다계정 공격에 대한 비용 상한은 아닙니다.
- 루트 `index.html`과 `calculator.html`은 GitHub Pages에서 Firebase로 이동하는 전용 페이지입니다. 실제 화면 원본은 `src/pages/`에 있으며 빌드 시 `dist/`로 생성합니다. Firebase 배포에는 `dist/`만 사용합니다.
- 감사 기록 자동 삭제는 보관 기간이 정해질 때까지 도입하지 않습니다.

## 변경 내용

- 승인된 1/2단계 관리자만 업무 데이터를 읽습니다. 무역할 가입자는 접근할 수 없습니다.
- 모든 브라우저 직접 쓰기를 차단하고 `saveInventory` 함수가 역할·필드·자료형·크기·문서 버전을 확인합니다.
- 재고 변경, 이전 재고 보관, 서버가 작성한 감사 기록과 변경 전후 원본을 같은 트랜잭션으로 저장합니다.
- 선반 칸 수 변경과 BOM 쓰기는 2단계만 허용합니다. 기존 역할 문서는 변경하지 않습니다.
- HTML의 실제 초기 재고와 브라우저 로컬 업무 데이터 캐시를 제거했습니다. 기존 Firestore 재고는 삭제하지 않습니다.
- Firebase JS SDK 12.19.0, SheetJS 0.20.3을 고정하고 로컬로 제공하며 실행 스크립트에 SRI를 적용합니다. JSX는 배포 전에 컴파일합니다.
- 파일은 10MB 이하, 최대 40시트, 시트당 20,000행/200열, 전체 500,000셀로 제한합니다. XLSX 파싱은 Worker에서 처리하며 15초 후 중단합니다.
- 로그인은 탭 세션 단위로 유지합니다. 30분 비활동 시 로그아웃하며, 서버는 로그인 후 8시간이 지난 쓰기를 거부합니다.
- 계정당 저장은 분당 30회, 한 요청은 최대 30문서로 제한합니다. 서버 함수 최대 인스턴스는 3개입니다.

## 빌드와 검증

Node.js 22와 Java 21을 사용합니다. 루트와 functions는 별도의 잠금 파일이 있는 설치 경계입니다.

```sh
npm ci --ignore-scripts
npm --prefix functions ci --ignore-scripts
npm run build
npm test
npm run test:rules
```

단위/산출물/엑셀 테스트와 Firestore 에뮬레이터의 접근권한·원자적 저장·감사 로그·동시 수정·복원 테스트가 포함되어 있습니다. 테스트 프로젝트는 `demo-warehouse-security`이며 운영 프로젝트를 사용하지 않습니다.

검증 환경은 Node 24.20.0에서 실행했으며 배포 런타임은 Node 22로 설정했습니다. Windows에서 Java의 Unix-domain socket 오류가 발생하면 짧고 쓰기 가능한 작업 폴더를 `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=... -Djava.io.tmpdir=...`로 지정합니다.

`npm audit` 결과 High/Critical은 0건입니다. functions 의존성의 Moderate 7개 표시는 `uuid`의 v3/v5/v6 버퍼 경계 권고와 전파된 항목입니다. 이 앱은 해당 API를 호출하지 않으며, 확인한 gaxios/teeny-request 호출은 v4입니다. 보안 수정이 포함되지 않는 구버전 Firebase로 강제 다운그레이드하지 않습니다. 루트 개발 도구 포함 Moderate는 9개로 별도 추적합니다.

## 운영 반영 순서

현재 Firebase 프로젝트는 `warehouse-inventory-84fef`입니다. 권한이 있는 Firebase 계정의 CLI 로그인이 필요합니다. Cloud Functions 배포는 프로젝트의 적절한 결제 플랜과 API/IAM 구성이 필요합니다. 결제 플랜 변경은 자동 수행하지 않습니다.

1. 기존 Firestore 데이터와 역할 문서를 백업하고, 유효한 2단계 관리자 계정이 있는지 확인합니다.
2. `npm run build` 후 `npx firebase deploy --only functions:inventory --project warehouse-inventory-84fef`로 서버 함수를 먼저 배포합니다.
3. 승인된 계정으로 함수를 확인한 다음, 짧은 유지보수 창에 `npx firebase deploy --only hosting,firestore:rules --project warehouse-inventory-84fef`로 프런트와 접근 규칙을 함께 반영합니다. 기존 페이지의 직접 쓰기는 이후 차단됩니다.
4. Firebase Hosting의 두 페이지에서 로그인/조회/쓰기/로그아웃을 확인합니다. 승인되지 않은 API 읽기와 직접 쓰기는 403이어야 합니다. 운영 재고를 변경하는 시험은 격리된 테스트 자료로만 합니다.
5. 기존 GitHub Pages 주소를 계속 사용하려면 새 Firebase Hosting 주소로 보내는 리디렉션을 배포합니다. GitHub Pages에서 본 앱을 직접 제공하는 방식은 `frame-ancestors`/X-Frame-Options 응답 헤더를 제공하지 못하므로, 전체 클릭재킹 방어 완료로 판정하지 않습니다.

Firebase Hosting의 설정에는 CSP(frame-ancestors none), X-Frame-Options DENY, nosniff, Referrer-Policy no-referrer, Permissions-Policy, Cache-Control no-store가 포함되어 있습니다. 루트 HTML의 CSP meta는 GitHub Pages에서 가능한 보완책이며 프레임 차단 헤더를 대신하지 않습니다.

## 별도 운영 설정

- **공개 Git 이력:** 최신 HTML에서 실제 데이터를 제거해도 과거 커밋의 데이터는 남습니다. 과거 이력 정리 또는 저장소 공개 범위 변경을 별도 처리해야 합니다. 다른 사람의 복제본·기존 캐시를 회수했다고 보장할 수 없습니다. 이 수정은 강제 푸시로 기존 이력을 덮어쓰지 않습니다.
- **App Check:** 등록된 웹 앱의 reCAPTCHA 설정이 제공되지 않아 임의 키를 넣거나 토큰 강제를 켜지 않았습니다. 클라이언트 등록과 모니터링을 완료한 뒤 Firestore enforcement 및 함수의 `ENFORCE_APP_CHECK=true`를 활성화해야 합니다. 현재도 읽기는 역할로 제한하고 쓰기는 서버 인증·역할·요청 제한으로 보호합니다.
- **MFA/API 키/IAM:** 관리자 MFA, Auth 이메일 열거 방지와 비밀번호 정책, API 키의 허용 API, 서비스 계정 IAM과 예산 알림은 콘솔에서 검토해야 합니다. 사용자 비밀번호를 변경하거나 새 권한을 부여하지 않았습니다.
- **감사 데이터 보관:** `auditLog`와 `auditVersions/{logId}/data/{before,after}`는 2단계만 읽을 수 있고 클라이언트는 쓸 수 없습니다. 보관 기간과 백업 정책을 정한 뒤 관리 경로로 운용하십시오.
- **복구:** 문제가 생기면 읽기 전용 상태를 유지하면서 수정하십시오. 예전의 공개 읽기/직접 쓰기 규칙으로 되돌리는 것을 보안 롤백으로 사용하지 마십시오.

## 데이터 형식

기존 재고 문서는 그대로 읽을 수 있고, 버전 필드가 없으면 버전 0으로 취급합니다. 첫 서버 저장부터 `_revision`이 증가합니다. 선반/팔레트의 `updatedAt`은 서버 시각으로 기록합니다. ERP 재고는 기존 업무를 위해 음수·소수를 허용하고 범위를 제한합니다. 선반 수량은 0 이상의 정수입니다.

원본 파일의 `src/warehouse.js`와 `src/calculator.jsx`를 수정한 뒤 반드시 빌드해야 합니다. `assets`는 GitHub Pages 호환을 위한 생성 파일입니다. `vendor/manifest.json`은 제3자 파일의 출처와 SHA-256을 기록하며, 잠금 파일과 `.gitattributes`가 SRI 재현성을 보장하도록 설정되어 있습니다.
