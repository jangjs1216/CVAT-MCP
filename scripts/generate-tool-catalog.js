#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const METHODS = ["get", "post", "patch", "put", "delete"];

const source = process.argv[2] ?? process.env.CVAT_SCHEMA_SOURCE;
const output = process.argv[3] ?? "generated/cvat-tools.json";

if (!source) {
  console.error("Usage: node scripts/generate-tool-catalog.js <schema-url-or-file> [output]");
  process.exit(1);
}

const schema = await readSchema(source);
const tools = [];

for (const [apiPath, operations] of Object.entries(schema.paths ?? {})) {
  if (!apiPath.startsWith("/api/")) continue;

  for (const method of METHODS) {
    const operation = operations[method];
    if (!operation) continue;
    tools.push(createTool(apiPath, method.toUpperCase(), operation));
  }
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ generatedFrom: source, tools }, null, 2)}\n`);
console.error(`Wrote ${tools.length} generated CVAT MCP tools to ${output}`);

async function readSchema(value) {
  if (/^https?:\/\//.test(value)) {
    const headers = { Accept: "application/vnd.oai.openapi+json, application/json" };
    if (process.env.CVAT_AUTH_TOKEN) {
      headers.Authorization = `${process.env.CVAT_AUTH_SCHEME ?? "Bearer"} ${process.env.CVAT_AUTH_TOKEN}`;
    }
    const response = await fetch(value, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  return JSON.parse(await readFile(value, "utf8"));
}

function createTool(apiPath, method, operation) {
  const pathParams = (operation.parameters ?? [])
    .filter((parameter) => parameter.in === "path")
    .map((parameter) => parameter.name);
  const requiresMutationConfirmation = method !== "GET";

  const properties = {
    path: {
      type: "object",
      additionalProperties: true,
      properties: Object.fromEntries(pathParams.map((name) => [name, { type: "string" }])),
      required: pathParams,
      description: "Values for {path} parameters in the CVAT endpoint.",
    },
    query: {
      type: "object",
      additionalProperties: true,
      description: "Query-string parameters accepted by this CVAT endpoint.",
    },
    body: {
      type: ["object", "array", "string", "null"],
      description: "JSON request body for endpoints that accept one.",
    },
    outputPath: {
      type: "string",
      description: "Workspace-relative path for binary downloads.",
    },
  };

  if (requiresMutationConfirmation) {
    properties.confirmMutation = {
      type: "boolean",
      description: "Must be true because this endpoint can change CVAT state.",
    };
  }

  return {
    name: makeToolName(operation.operationId, method, apiPath),
    description: `${operation.summary ?? operation.description ?? "CVAT API endpoint"} (${method} ${apiPath})`,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties,
      required: pathParams.length ? ["path"] : [],
    },
    request: {
      method,
      path: apiPath,
    },
  };
}

function makeToolName(operationId, method, apiPath) {
  const raw = operationId
    ? `cvat_${operationId}`
    : `cvat_${method.toLowerCase()}_${apiPath}`;
  return raw
    .replaceAll(/[^a-zA-Z0-9_]+/g, "_")
    .replaceAll(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}
