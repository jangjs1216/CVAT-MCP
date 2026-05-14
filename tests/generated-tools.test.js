import assert from "node:assert/strict";
import test from "node:test";
import { callGeneratedTool } from "../src/generated-tools.js";

test("generated tool fills path params and forwards query/body", async () => {
  const calls = [];
  const client = {
    request: async (request) => {
      calls.push(request);
      return { ok: true };
    },
  };

  await callGeneratedTool(
    {
      name: "cvat_tasks_retrieve",
      request: { method: "GET", path: "/api/tasks/{id}" },
    },
    { path: { id: 12 }, query: { page_size: 1 } },
    client,
  );

  assert.deepEqual(calls[0], {
    method: "GET",
    path: "/api/tasks/12",
    query: { page_size: 1 },
    body: undefined,
    outputPath: undefined,
  });
});

test("generated mutation tool requires confirmation", async () => {
  await assert.rejects(
    () =>
      callGeneratedTool(
        {
          name: "cvat_tasks_destroy",
          request: { method: "DELETE", path: "/api/tasks/{id}" },
        },
        { path: { id: 12 } },
        { request: async () => ({}) },
      ),
    /confirmMutation/,
  );
});
