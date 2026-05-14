import assert from "node:assert/strict";
import test from "node:test";
import { callStaticTool } from "../src/static-tools.js";

test("generic API request requires mutation confirmation", async () => {
  await assert.rejects(
    () =>
      callStaticTool(
        "cvat_api_request",
        { method: "POST", path: "/api/tasks", body: { name: "demo" } },
        { request: async () => ({}) },
      ),
    /confirmMutation/,
  );
});

test("create task maps to POST /api/tasks", async () => {
  const calls = [];
  const result = await callStaticTool(
    "cvat_create_task",
    { name: "demo", labels: [{ name: "car" }] },
    {
      request: async (request) => {
        calls.push(request);
        return { ok: true };
      },
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls[0], {
    method: "POST",
    path: "/api/tasks",
    body: { name: "demo", labels: [{ name: "car" }] },
  });
});
