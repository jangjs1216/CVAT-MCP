# Existing CVAT Integration Plan

## 전제

- 초기 통합은 CVAT 서버를 수정하지 않는 외부 MCP companion server로 시작한다.
- CVAT와의 계약은 공식 REST API와 OpenAPI schema다.
- Cline은 stdio MCP 서버를 실행하고, MCP Tool 호출 승인 흐름은 Cline의 기본 기능을 따른다.

## 1단계: 외부 프로젝트로 검증

목표: 현재 저장소의 `cvat-mcp`를 Cline에 등록해 실제 CVAT 서버에서 task/project/job 조회와 task 생성, data upload, annotation 조회를 검증한다.

검증:

- `cvat_server_about`가 서버 정보를 반환한다.
- `cvat_list_tasks`가 pagination 결과를 반환한다.
- `cvat_create_task` 후 `cvat_attach_task_data`로 데이터 처리가 시작된다.
- `cvat_get_request`로 background request 상태를 확인한다.

## 2단계: API coverage 확대

목표: CVAT OpenAPI schema를 기준으로 생성 Tool을 활성화한다.

작업:

- CI에서 CVAT fixture schema 또는 live dev server schema로 `generated/cvat-tools.json`을 생성한다.
- 생성된 Tool 이름, path parameter, mutation confirmation 정책을 테스트한다.
- 자주 쓰는 endpoint는 정적 고수준 Tool로 승격한다.

## 3단계: CVAT 저장소 편입 방식

권장 위치는 CVAT 본 서버 코드 내부가 아니라 client/integration 계층이다.

후보:

- `cvat-mcp/` 또는 `integrations/mcp/`: Node 기반 Cline MCP 서버
- `site/content/en/docs/api_sdk/mcp.md`: 사용자 문서
- `.devcontainer` 또는 `docker-compose.dev.yml` 예시: 로컬 CVAT와 MCP를 함께 띄우는 개발 편의 설정

이 방식은 CVAT Django backend의 요청 처리 경로를 건드리지 않으므로 기존 CVAT 배포 안정성을 해치지 않는다. CVAT 공식 API가 유지되는 한 MCP 서버는 독립 릴리스가 가능하다.

## 4단계: upstream 품질 기준

CVAT에 포함되기 전 필요한 기준:

- CVAT supported Node 버전 또는 별도 runtime 정책 결정
- PAT 권한 범위 문서화
- OpenAPI schema 변경 시 생성 Tool 테스트
- task 생성, upload, annotation read/write에 대한 integration test
- Cline 설정 예시와 보안 주의사항 문서화

## 5단계: 장기 운영

- CVAT release마다 `/api/schema/` 기반 generated catalog를 비교한다.
- breaking change가 있으면 정적 Tool부터 수정한다.
- MCP Marketplace 배포가 필요하면 Cline marketplace 메타데이터를 별도 패키징한다.
- enterprise 환경은 read-only PAT와 쓰기 PAT를 분리해 MCP 서버 설정을 두 개로 나눈다.
