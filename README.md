# CVAT MCP

CVAT MCP는 Cline에서 자연어로 CVAT 작업을 수행할 수 있게 하는 stdio MCP 서버입니다. CVAT의 공식 REST API만 호출하며, Node 내장 기능만 사용하므로 별도 런타임 의존성이 없습니다.

## 목표

- CVAT 공식 API를 MCP Tool로 노출한다.
- Cline에서 "CVAT task 목록 보여줘", "새 task 만들고 이미지를 업로드해" 같은 텍스트 요청을 하면 적절한 CVAT API가 호출되도록 한다.
- 기존 CVAT 프로젝트에 어떻게 포함될지에 대한 단계별 계획을 문서로 남긴다.

## 구성

- `src/index.js`: Cline이 실행하는 MCP stdio 엔트리포인트
- `src/static-tools.js`: 자주 쓰는 CVAT API를 고수준 MCP Tool로 정의
- `src/cvat-client.js`: CVAT REST API 클라이언트
- `scripts/generate-tool-catalog.js`: CVAT OpenAPI 스키마에서 추가 MCP Tool 카탈로그 생성
- `docs/integration-plan.md`: 기존 CVAT에 포함시키는 계획
- `docs/cvat-api-tooling.md`: CVAT API를 Tool로 확장하는 방식

## 요구사항

- Node.js 20 이상
- 접근 가능한 CVAT 서버
- CVAT Personal Access Token 권장

CVAT 공식 문서는 서버 API가 HTTP REST API이며, API 스키마와 Swagger 문서를 서버에서 제공한다고 설명합니다. PAT 인증은 `Authorization: Bearer <token>` 헤더를 사용합니다.

## 실행

```powershell
npm test
```

```powershell
$env:CVAT_BASE_URL="http://localhost:8080"
$env:CVAT_AUTH_TOKEN="your_pat"
npm start
```

서버는 MCP stdio 프로세스이므로 사람이 직접 대화형으로 쓰는 프로그램이 아닙니다. Cline이 프로세스를 실행하고 stdin/stdout으로 JSON-RPC 메시지를 주고받습니다.

## Cline 설정

Cline의 `cline_mcp_settings.json`에 아래 서버를 추가합니다. Windows 경로는 실제 저장소 경로로 바꿉니다.

```json
{
  "mcpServers": {
    "cvat-mcp": {
      "command": "node",
      "args": ["C:\\Users\\준승\\Desktop\\Development\\CVAT-MCP\\src\\index.js"],
      "env": {
        "CVAT_BASE_URL": "http://localhost:8080",
        "CVAT_AUTH_TOKEN": "your_pat",
        "CVAT_AUTH_SCHEME": "Bearer"
      },
      "disabled": false,
      "alwaysAllow": [
        "cvat_server_about",
        "cvat_list_tasks",
        "cvat_get_task",
        "cvat_list_projects",
        "cvat_list_jobs"
      ]
    }
  }
}
```

쓰기 작업을 자동 승인하려면 신중해야 합니다. `cvat_api_request`의 `POST`, `PATCH`, `PUT`, `DELETE`와 생성된 mutation 도구는 `confirmMutation: true`가 있어야 실행됩니다.

## Cline 프롬프트 예시

```text
CVAT 서버 상태를 확인해줘.
```

```text
CVAT에서 "road"가 들어간 task를 찾아서 상태와 assignee를 요약해줘.
```

```text
CVAT에 "sample cars" task를 만들고 label은 car, person으로 설정해줘.
```

```text
task 12의 annotation JSON을 가져와서 현재 workspace에 요약해줘.
```

## 기본 제공 Tool

- `cvat_server_about`
- `cvat_get_api_schema`
- `cvat_list_tasks`
- `cvat_get_task`
- `cvat_create_task`
- `cvat_attach_task_data`
- `cvat_get_task_annotations`
- `cvat_replace_task_annotations`
- `cvat_list_jobs`
- `cvat_get_job`
- `cvat_get_request`
- `cvat_list_projects`
- `cvat_create_project`
- `cvat_list_labels`
- `cvat_api_request`

## 공식 API 전체를 Tool로 확장

CVAT 서버에서 OpenAPI 스키마를 받아 추가 도구 카탈로그를 만들 수 있습니다.

```powershell
node scripts/generate-tool-catalog.js http://localhost:8080/api/schema/ generated/cvat-tools.json
```

인터넷 연결은 필수가 아닙니다. MCP 서버와 생성 스크립트는 `CVAT_BASE_URL` 또는 명령에 입력한 CVAT 주소로 직접 API를 호출합니다. 내부망 CVAT 서버를 쓰는 경우에도 MCP 서버가 그 서버의 `/api/schema/`에 접근할 수 있으면 Tool 카탈로그를 생성할 수 있습니다.

다만 CVAT 버전에 따라 OpenAPI 스키마와 엔드포인트가 다를 수 있습니다. `https://app.cvat.ai/api/schema/`처럼 외부 공개 서버 기준으로 생성한 Tool은 내부 CVAT 서버 버전과 맞지 않을 수 있으므로, 실사용 전에는 실제 사용할 CVAT 서버의 schema로 다시 생성하는 것을 권장합니다.

```powershell
node scripts/generate-tool-catalog.js http://실제_CVAT_주소/api/schema/ generated/cvat-tools.json
```

이후 Cline 설정에 아래 환경 변수를 추가합니다.

```json
{
  "CVAT_GENERATED_TOOLS_PATH": "generated/cvat-tools.json"
}
```

생성 도구는 `{path, query, body}` 형태의 입력을 받고 실제 CVAT 엔드포인트로 전달됩니다. 자주 쓰는 작업은 정적 고수준 도구를 우선 사용하고, CVAT 버전별 새 엔드포인트는 생성 도구 또는 `cvat_api_request`로 처리합니다.

## 참고 문서

- CVAT Server API: https://docs.cvat.ai/docs/api_sdk/api/
- CVAT Access Tokens: https://docs.cvat.ai/docs/api_sdk/access_tokens/
- Cline MCP 설정: https://docs.cline.bot/mcp/adding-and-configuring-servers
- MCP stdio transport: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
