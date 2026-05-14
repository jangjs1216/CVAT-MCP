import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";
import { McpServer } from "../src/mcp-server.js";

test("MCP server responds to initialize and tools/list over newline JSON-RPC", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const lines = [];
  output.setEncoding("utf8");
  output.on("data", (chunk) => {
    lines.push(...chunk.trim().split("\n").filter(Boolean));
  });

  const server = new McpServer({
    name: "test-mcp",
    version: "0.0.0",
    tools: [
      {
        name: "demo",
        description: "demo tool",
        inputSchema: { type: "object", properties: {} },
      },
    ],
    callTool: async () => ({ ok: true }),
  });

  server.start({ input, output });
  input.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })}\n`);
  input.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" })}\n`);

  await waitFor(() => lines.length === 2);

  const init = JSON.parse(lines[0]);
  const list = JSON.parse(lines[1]);
  assert.equal(init.result.serverInfo.name, "test-mcp");
  assert.equal(list.result.tools[0].name, "demo");
});

function waitFor(predicate) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 1000) {
        clearInterval(timer);
        reject(new Error("Timed out waiting for condition."));
      }
    }, 10);
  });
}
