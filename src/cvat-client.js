import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";

const JSON_CONTENT_TYPES = [
  "application/json",
  "application/vnd.cvat+json",
  "application/problem+json",
];

export class CvatApiError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "CvatApiError";
    this.details = details;
  }
}

export class CvatClient {
  constructor(options = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.CVAT_BASE_URL);
    this.authToken = options.authToken ?? process.env.CVAT_AUTH_TOKEN;
    this.authScheme = options.authScheme ?? process.env.CVAT_AUTH_SCHEME ?? "Bearer";
    this.organization = options.organization ?? process.env.CVAT_ORGANIZATION;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.cwd = options.cwd ?? process.cwd();
  }

  async request({ method = "GET", path, query, body, headers, outputPath } = {}) {
    const upperMethod = method.toUpperCase();
    const url = this.#buildUrl(path, query);
    const requestHeaders = this.#headers(headers);
    const init = {
      method: upperMethod,
      headers: requestHeaders,
    };

    if (body !== undefined && body !== null && upperMethod !== "GET") {
      if (typeof body === "string") {
        init.body = body;
      } else {
        init.body = JSON.stringify(body);
      }
      requestHeaders.set("Content-Type", requestHeaders.get("Content-Type") ?? "application/json");
    }

    const response = await this.fetchImpl(url, init);
    return this.#formatResponse(response, outputPath);
  }

  async uploadTaskData({ taskId, clientFiles = [], serverFiles = [], remoteFiles = [], options = {} } = {}) {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new Error("taskId must be a positive integer.");
    }

    const form = new FormData();
    for (const filePath of clientFiles) {
      const resolved = resolve(this.cwd, filePath);
      const data = await readFile(resolved);
      form.append("client_files", new Blob([data]), basename(resolved));
    }
    appendMany(form, "server_files", serverFiles);
    appendMany(form, "remote_files", remoteFiles);
    appendFields(form, options);

    const headers = this.#headers({
      "Upload-Start": "true",
      "Upload-Finish": "true",
      "Upload-Multiple": "true",
    });

    const url = this.#buildUrl(`/api/tasks/${taskId}/data/`);
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers,
      body: form,
    });
    return this.#formatResponse(response);
  }

  #buildUrl(path, query) {
    if (!path || typeof path !== "string") {
      throw new Error("path is required.");
    }
    if (!path.startsWith("/api/")) {
      throw new Error("Only CVAT API paths starting with /api/ are allowed.");
    }

    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, stringifyQueryValue(item));
        }
      } else {
        url.searchParams.set(key, stringifyQueryValue(value));
      }
    }
    return url;
  }

  #headers(extra = {}) {
    const headers = new Headers(extra);
    headers.set("Accept", headers.get("Accept") ?? "application/vnd.cvat+json");
    if (this.authToken) {
      headers.set("Authorization", `${this.authScheme} ${this.authToken}`);
    }
    if (this.organization) {
      headers.set("X-Organization", this.organization);
    }
    return headers;
  }

  async #formatResponse(response, outputPath) {
    const contentType = response.headers.get("content-type") ?? "";
    const metadata = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType,
    };

    let payload;
    if (isJsonContentType(contentType)) {
      payload = await readJsonSafely(response);
    } else if (contentType.startsWith("text/")) {
      payload = await response.text();
    } else if (outputPath) {
      const target = this.#resolveOutputPath(outputPath);
      const data = Buffer.from(await response.arrayBuffer());
      await writeFile(target, data);
      payload = { savedTo: target, bytes: data.byteLength };
    } else if (response.status === 204) {
      payload = null;
    } else {
      const data = Buffer.from(await response.arrayBuffer());
      payload = {
        binary: true,
        bytes: data.byteLength,
        note: "Binary response was not returned inline. Pass outputPath to save it in the workspace.",
      };
    }

    const result = { ...metadata, data: payload };
    if (!response.ok) {
      throw new CvatApiError(`CVAT API request failed with ${response.status}`, result);
    }
    return result;
  }

  #resolveOutputPath(outputPath) {
    const target = resolve(this.cwd, outputPath);
    const root = resolve(this.cwd);
    if (target !== root && !target.startsWith(root + sep)) {
      throw new Error("outputPath must stay inside the current workspace.");
    }
    return target;
  }
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    throw new Error("CVAT_BASE_URL is required.");
  }
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function stringifyQueryValue(value) {
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function isJsonContentType(contentType) {
  return JSON_CONTENT_TYPES.some((type) => contentType.includes(type));
}

async function readJsonSafely(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function appendMany(form, key, values) {
  for (const value of values ?? []) {
    form.append(key, String(value));
  }
}

function appendFields(form, fields) {
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      appendMany(form, key, value);
    } else if (typeof value === "object") {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  }
}
