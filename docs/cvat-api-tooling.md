# CVAT API Tooling

## 원칙

이 프로젝트는 CVAT의 내부 DB나 Django 앱을 직접 건드리지 않고 공식 REST API만 호출한다. CVAT 문서의 REST API 설계 원칙은 `GET`, `POST`, `PATCH`, `PUT`, `DELETE`와 `/api/tasks`, `/api/projects`, `/api/jobs` 같은 평평한 리소스 경로를 기준으로 한다.

## Tool 계층

1. 정적 고수준 Tool
   - Cline이 자연어에서 안정적으로 고를 수 있게 이름과 설명을 명확히 둔다.
   - task, project, job, label, annotation, request처럼 반복 사용 가능성이 높은 API만 포함한다.
   - 예: `cvat_list_tasks`, `cvat_create_task`, `cvat_attach_task_data`.

2. 범용 API Tool
   - `cvat_api_request`는 `/api/` 아래 공식 CVAT REST 엔드포인트를 직접 호출한다.
   - CVAT 버전 차이 또는 아직 고수준 Tool이 없는 API를 막지 않기 위한 escape hatch다.
   - 상태 변경 메서드는 `confirmMutation: true`가 필요하다.

3. OpenAPI 생성 Tool
   - `scripts/generate-tool-catalog.js`는 `/api/schema/` 또는 저장된 OpenAPI JSON을 읽고 MCP Tool 카탈로그를 만든다.
   - `CVAT_GENERATED_TOOLS_PATH`를 설정하면 서버 시작 시 생성 Tool을 함께 노출한다.
   - CVAT upstream에 포함될 때는 이 생성 단계를 CI에서 검증해 API 변경을 추적한다.

## 인증

기본 인증은 CVAT Personal Access Token이다.

```text
Authorization: Bearer <CVAT_AUTH_TOKEN>
```

레거시 토큰을 써야 하는 서버는 `CVAT_AUTH_SCHEME=Token`으로 바꿀 수 있다.

## 안전장치

- 모든 API path는 `/api/`로 시작해야 한다.
- binary download는 `outputPath`가 workspace 내부일 때만 저장한다.
- 범용 mutation과 생성 mutation은 명시 확인값이 있어야 실행된다.
- `cvat_replace_task_annotations`는 기존 annotation을 교체하므로 `confirmReplace: true`가 필요하다.

## 확장 기준

새 정적 Tool은 다음 조건을 만족할 때만 추가한다.

- Cline 자연어 사용 빈도가 높다.
- OpenAPI 생성 Tool보다 입력 스키마를 더 안전하고 간단하게 줄일 수 있다.
- CVAT 공식 API에 있는 동작을 그대로 감싼다.
- 하나의 Tool이 하나의 명확한 CVAT 작업에 대응한다.
