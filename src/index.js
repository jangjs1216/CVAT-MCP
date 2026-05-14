#!/usr/bin/env node
import { CvatClient } from "./cvat-client.js";
import { callGeneratedTool, loadGeneratedTools, toMcpGeneratedTool } from "./generated-tools.js";
import { McpServer } from "./mcp-server.js";
import { callStaticTool, staticTools } from "./static-tools.js";

const generatedTools = await loadGeneratedTools();
const generatedByName = new Map(generatedTools.map((tool) => [tool.name, tool]));
let client;

const server = new McpServer({
  name: "cvat-mcp",
  version: "0.1.0",
  tools: [...staticTools, ...generatedTools.map(toMcpGeneratedTool)],
  async callTool(name, args) {
    client ??= new CvatClient();
    const staticResult = await callStaticTool(name, args, client);
    if (staticResult !== null) return staticResult;

    const generatedTool = generatedByName.get(name);
    if (generatedTool) {
      return callGeneratedTool(generatedTool, args, client);
    }

    throw new Error(`Unknown tool: ${name}`);
  },
});

server.start();
