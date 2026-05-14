const pagingProperties = {
  page: {
    type: "integer",
    minimum: 1,
    description: "CVAT page number.",
  },
  page_size: {
    type: "integer",
    minimum: 1,
    maximum: 1000,
    description: "Number of results per page.",
  },
};

export const staticTools = [
  {
    name: "cvat_server_about",
    description: "Get basic CVAT server information from GET /api/server/about.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "cvat_get_api_schema",
    description: "Fetch the CVAT OpenAPI schema from GET /api/schema/ so official API endpoints can be inspected or converted into MCP tools.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "cvat_list_tasks",
    description: "List CVAT tasks with official /api/tasks filters such as search, status, project_id, assignee, owner, sort, page, and page_size.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        search: { type: "string" },
        status: { type: "string" },
        project_id: { type: "integer" },
        assignee: { type: "string" },
        owner: { type: "string" },
        sort: { type: "string" },
        ...pagingProperties,
      },
    },
  },
  {
    name: "cvat_get_task",
    description: "Get one CVAT task by id from GET /api/tasks/{id}.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["taskId"],
      properties: {
        taskId: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "cvat_create_task",
    description: "Create a CVAT task using POST /api/tasks. Use cvat_attach_task_data afterward to upload images or videos.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "labels"],
      properties: {
        name: { type: "string", minLength: 1 },
        labels: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: true,
            required: ["name"],
            properties: {
              name: { type: "string" },
              color: { type: "string" },
              attributes: { type: "array" },
            },
          },
        },
        project_id: { type: "integer", minimum: 1 },
        assignee_id: { type: "integer", minimum: 1 },
        segment_size: { type: "integer", minimum: 0 },
        overlap: { type: "integer", minimum: 0 },
        subset: { type: "string" },
      },
    },
  },
  {
    name: "cvat_attach_task_data",
    description: "Attach local, server, or remote media to a task using POST /api/tasks/{id}/data/ with CVAT upload headers.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["taskId"],
      properties: {
        taskId: { type: "integer", minimum: 1 },
        clientFiles: {
          type: "array",
          description: "Local workspace file paths to upload as client_files.",
          items: { type: "string" },
        },
        serverFiles: {
          type: "array",
          description: "Files already available in the CVAT server share.",
          items: { type: "string" },
        },
        remoteFiles: {
          type: "array",
          description: "Remote URLs for CVAT to fetch.",
          items: { type: "string" },
        },
        options: {
          type: "object",
          description: "Additional DataRequest fields such as image_quality, sorting_method, use_cache, chunk_size, start_frame, stop_frame.",
          additionalProperties: true,
        },
      },
    },
  },
  {
    name: "cvat_get_task_annotations",
    description: "Get task annotations from GET /api/tasks/{id}/annotations/.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["taskId"],
      properties: {
        taskId: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "cvat_replace_task_annotations",
    description: "Replace task annotations with PUT /api/tasks/{id}/annotations/. Requires confirmReplace=true.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["taskId", "annotations", "confirmReplace"],
      properties: {
        taskId: { type: "integer", minimum: 1 },
        annotations: {
          type: "object",
          additionalProperties: true,
          description: "CVAT LabeledDataRequest JSON.",
        },
        confirmReplace: {
          type: "boolean",
          description: "Must be true because this replaces current task annotations.",
        },
      },
    },
  },
  {
    name: "cvat_list_jobs",
    description: "List CVAT jobs with official /api/jobs filters such as task_id, project_id, state, stage, assignee, sort, page, and page_size.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        task_id: { type: "integer", minimum: 1 },
        project_id: { type: "integer", minimum: 1 },
        state: { type: "string" },
        stage: { type: "string" },
        assignee: { type: "string" },
        sort: { type: "string" },
        ...pagingProperties,
      },
    },
  },
  {
    name: "cvat_get_job",
    description: "Get one CVAT job by id from GET /api/jobs/{id}.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["jobId"],
      properties: {
        jobId: { type: "integer", minimum: 1 },
      },
    },
  },
  {
    name: "cvat_get_request",
    description: "Get a CVAT background request by id from GET /api/requests/{id}; useful after imports, exports, or data upload.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["requestId"],
      properties: {
        requestId: { type: "string", minLength: 1 },
      },
    },
  },
  {
    name: "cvat_list_projects",
    description: "List CVAT projects with /api/projects filters such as search, owner, assignee, sort, page, and page_size.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        search: { type: "string" },
        owner: { type: "string" },
        assignee: { type: "string" },
        sort: { type: "string" },
        ...pagingProperties,
      },
    },
  },
  {
    name: "cvat_create_project",
    description: "Create a CVAT project using POST /api/projects.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "labels"],
      properties: {
        name: { type: "string", minLength: 1 },
        labels: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: true,
            required: ["name"],
            properties: {
              name: { type: "string" },
              color: { type: "string" },
              attributes: { type: "array" },
            },
          },
        },
        bug_tracker: { type: "string" },
      },
    },
  },
  {
    name: "cvat_list_labels",
    description: "List labels with /api/labels filters such as task_id, project_id, job_id, name, search, and page_size.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        task_id: { type: "integer", minimum: 1 },
        project_id: { type: "integer", minimum: 1 },
        job_id: { type: "integer", minimum: 1 },
        name: { type: "string" },
        search: { type: "string" },
        ...pagingProperties,
      },
    },
  },
  {
    name: "cvat_api_request",
    description: "Call any official CVAT REST endpoint under /api/. For POST, PATCH, PUT, or DELETE, confirmMutation must be true.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["method", "path"],
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        },
        path: {
          type: "string",
          pattern: "^/api/",
          description: "CVAT API path, for example /api/tasks or /api/jobs/12/annotations/.",
        },
        query: {
          type: "object",
          additionalProperties: true,
        },
        body: {
          type: ["object", "array", "string", "null"],
        },
        outputPath: {
          type: "string",
          description: "Workspace-relative path for binary downloads.",
        },
        confirmMutation: {
          type: "boolean",
          description: "Required as true for non-GET methods.",
        },
      },
    },
  },
];

export async function callStaticTool(name, args, client) {
  switch (name) {
    case "cvat_server_about":
      return client.request({ path: "/api/server/about" });
    case "cvat_get_api_schema":
      return client.request({
        path: "/api/schema/",
        headers: { Accept: "application/vnd.oai.openapi+json, application/json" },
      });
    case "cvat_list_tasks":
      return client.request({ path: "/api/tasks", query: args });
    case "cvat_get_task":
      return client.request({ path: `/api/tasks/${args.taskId}` });
    case "cvat_create_task":
      return client.request({ method: "POST", path: "/api/tasks", body: compactBody(args) });
    case "cvat_attach_task_data":
      return client.uploadTaskData(args);
    case "cvat_get_task_annotations":
      return client.request({ path: `/api/tasks/${args.taskId}/annotations/` });
    case "cvat_replace_task_annotations":
      if (args.confirmReplace !== true) {
        throw new Error("confirmReplace must be true to replace annotations.");
      }
      return client.request({
        method: "PUT",
        path: `/api/tasks/${args.taskId}/annotations/`,
        body: args.annotations,
      });
    case "cvat_list_jobs":
      return client.request({ path: "/api/jobs", query: args });
    case "cvat_get_job":
      return client.request({ path: `/api/jobs/${args.jobId}` });
    case "cvat_get_request":
      return client.request({ path: `/api/requests/${encodeURIComponent(args.requestId)}` });
    case "cvat_list_projects":
      return client.request({ path: "/api/projects", query: args });
    case "cvat_create_project":
      return client.request({ method: "POST", path: "/api/projects", body: compactBody(args) });
    case "cvat_list_labels":
      return client.request({ path: "/api/labels", query: args });
    case "cvat_api_request":
      assertMutationConfirmed(args.method, args.confirmMutation);
      return client.request(args);
    default:
      return null;
  }
}

function assertMutationConfirmed(method, confirmed) {
  if (method.toUpperCase() !== "GET" && confirmed !== true) {
    throw new Error("confirmMutation must be true for POST, PATCH, PUT, and DELETE requests.");
  }
}

function compactBody(args) {
  return Object.fromEntries(
    Object.entries(args).filter(([, value]) => value !== undefined && value !== null),
  );
}
