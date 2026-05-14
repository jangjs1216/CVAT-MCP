import assert from "node:assert/strict";
import test from "node:test";
import { CvatClient } from "../src/cvat-client.js";

test("builds CVAT request with bearer auth and organization header", async () => {
  let captured;
  const client = new CvatClient({
    baseUrl: "http://cvat.example",
    authToken: "secret",
    organization: "demo",
    fetchImpl: async (url, init) => {
      captured = { url: String(url), init };
      return jsonResponse({ results: [] });
    },
  });

  const result = await client.request({
    path: "/api/tasks",
    query: { search: "road", page_size: 10 },
  });

  assert.equal(result.status, 200);
  assert.equal(captured.url, "http://cvat.example/api/tasks?search=road&page_size=10");
  assert.equal(captured.init.headers.get("Authorization"), "Bearer secret");
  assert.equal(captured.init.headers.get("X-Organization"), "demo");
  assert.equal(captured.init.headers.get("Accept"), "application/vnd.cvat+json");
});

test("rejects non-CVAT API paths", async () => {
  const client = new CvatClient({
    baseUrl: "http://cvat.example",
    fetchImpl: async () => jsonResponse({}),
  });

  await assert.rejects(
    () => client.request({ path: "https://example.com/api/tasks" }),
    /Only CVAT API paths/,
  );
});

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    headers: {
      "content-type": "application/vnd.cvat+json",
      ...(init.headers ?? {}),
    },
  });
}
