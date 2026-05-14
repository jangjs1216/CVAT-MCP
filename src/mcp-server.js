import readline from "node:readline";
import { CvatApiError } from "./cvat-client.js";

export class McpServer {
  constructor({ name, version, tools, callTool }) {
    this.name = name;
    this.version = version;
    this.tools = tools;
    this.callTool = callTool;
  }

  start({ input = process.stdin, output = process.stdout } = {}) {
    const rl = readline.createInterface({ input, crlfDelay: Infinity });
    rl.on("line", async (line) => {
      if (!line.trim()) return;
      let message;
      try {
        message = JSON.parse(line);
      } catch (error) {
        this.#write(output, errorResponse(null, -32700, "Parse error", error.message));
        return;
      }

      const responses = Array.isArray(message)
        ? await Promise.all(message.map((item) => this.#handle(item)))
        : [await this.#handle(message)];

      for (const response of responses.filter(Boolean)) {
        this.#write(output, response);
      }
    });
  }

  async #handle(message) {
    if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
      return errorResponse(message?.id ?? null, -32600, "Invalid Request");
    }

    const hasId = Object.hasOwn(message, "id");
    const id = message.id;
    try {
      switch (message.method) {
        case "initialize":
          if (!hasId) return null;
          return resultResponse(id, {
            protocolVersion: message.params?.protocolVersion ?? "2025-03-26",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: this.name,
              version: this.version,
            },
          });
        case "notifications/initialized":
          return null;
        case "ping":
          if (!hasId) return null;
          return resultResponse(id, {});
        case "tools/list":
          if (!hasId) return null;
          return resultResponse(id, { tools: this.tools });
        case "tools/call":
          if (!hasId) return null;
          return this.#callTool(id, message.params);
        default:
          return hasId ? errorResponse(id, -32601, "Method not found", message.method) : null;
      }
    } catch (error) {
      return hasId ? errorResponse(id, -32603, "Internal error", serializeError(error)) : null;
    }
  }

  async #callTool(id, params = {}) {
    if (!params.name) {
      return errorResponse(id, -32602, "Invalid params", "Tool name is required.");
    }

    try {
      const result = await this.callTool(params.name, params.arguments ?? {});
      return resultResponse(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      });
    } catch (error) {
      return resultResponse(id, {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify(serializeError(error), null, 2),
          },
        ],
      });
    }
  }

  #write(output, response) {
    output.write(`${JSON.stringify(response)}\n`);
  }
}

function resultResponse(id, result) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function errorResponse(id, code, message, data) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

function serializeError(error) {
  if (error instanceof CvatApiError) {
    return {
      name: error.name,
      message: error.message,
      details: error.details,
    };
  }
  return {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
  };
}
