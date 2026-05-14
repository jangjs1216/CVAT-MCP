import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const HTTP_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);

export async function loadGeneratedTools(
  catalogPath = process.env.CVAT_GENERATED_TOOLS_PATH,
  baseDir = process.cwd(),
) {
  if (!catalogPath) return [];
  const resolvedPath = isAbsolute(catalogPath) ? catalogPath : resolve(baseDir, catalogPath);
  const raw = await readFile(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.tools)) {
    throw new Error("Generated tool catalog must contain a tools array.");
  }
  return parsed.tools;
}

export function toMcpGeneratedTool(entry) {
  return {
    name: entry.name,
    description: entry.description,
    inputSchema: entry.inputSchema,
  };
}

export async function callGeneratedTool(entry, args, client) {
  const request = entry.request;
  if (!request || !HTTP_METHODS.has(request.method)) {
    throw new Error(`Generated tool ${entry.name} has an invalid request definition.`);
  }

  const path = fillPathParams(request.path, args.path ?? {});
  if (request.method !== "GET" && args.confirmMutation !== true) {
    throw new Error("confirmMutation must be true for generated mutation tools.");
  }

  return client.request({
    method: request.method,
    path,
    query: args.query,
    body: args.body,
    outputPath: args.outputPath,
  });
}

function fillPathParams(pathTemplate, params) {
  return pathTemplate.replaceAll(/\{([^}]+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing path parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}
