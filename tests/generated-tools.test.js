import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { callGeneratedTool, loadGeneratedTools } from "../src/generated-tools.js";

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

test("loads generated tools relative to a supplied base directory", async () => {
  const baseDir = join(tmpdir(), `cvat-mcp-${process.pid}`);
  await mkdir(join(baseDir, "generated"), { recursive: true });
  await writeFile(
    join(baseDir, "generated", "cvat-tools.json"),
    JSON.stringify({ tools: [{ name: "cvat_demo", description: "demo", inputSchema: {} }] }),
  );

  try {
    const tools = await loadGeneratedTools("generated/cvat-tools.json", baseDir);
    assert.equal(tools[0].name, "cvat_demo");
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
});
