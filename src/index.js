#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── NacosClient: 封装 Nacos 1.x Open API ───────────────────────────
class NacosClient {
  constructor() {
    this.serverAddr = process.env.NACOS_SERVER_ADDR || "127.0.0.1:8848";
    this.contextPath = (process.env.NACOS_CONTEXT_PATH || "/nacos").replace(/\/+$/, "");
    this.baseUrl = `http://${this.serverAddr}${this.contextPath}`;
    this.username = process.env.NACOS_USERNAME || "nacos";
    this.password = process.env.NACOS_PASSWORD || "nacos";
    this.defaultNamespace = process.env.NACOS_NAMESPACE || "";
    this.defaultGroup = process.env.NACOS_GROUP || "DEFAULT_GROUP";
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  async login() {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }
    try {
      const url = `${this.baseUrl}/v1/auth/login`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`,
      });
      if (!res.ok) {
        console.error(`[Nacos] login failed: ${res.status}`);
        this.accessToken = null;
        return null;
      }
      const data = await res.json();
      this.accessToken = data.accessToken;
      const ttl = (data.tokenTtl || 18000) - 30;
      this.tokenExpireTime = Date.now() + ttl * 1000;
      console.error(`[Nacos] login success, token expires in ${ttl}s`);
      return this.accessToken;
    } catch (e) {
      console.error(`[Nacos] login error: ${e.message}`);
      this.accessToken = null;
      return null;
    }
  }

  async authQuery() {
    const token = await this.login();
    return token ? `accessToken=${encodeURIComponent(token)}&` : "";
  }

  /**
   * 获取单个配置
   * Nacos 1.x: GET /v1/cs/configs?dataId=xxx&tenant=xxx&group=xxx
   */
  async getConfig(dataId, namespace, group) {
    const ns = namespace || this.defaultNamespace;
    const grp = group || this.defaultGroup;
    const auth = await this.authQuery();
    const url = `${this.baseUrl}/v1/cs/configs?${auth}dataId=${encodeURIComponent(dataId)}&tenant=${encodeURIComponent(ns)}&group=${encodeURIComponent(grp)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getConfig failed (${res.status}): ${text}`);
    }
    return await res.text();
  }

  /**
   * 列出配置列表
   * Nacos 1.x: GET /v1/cs/configs?search=accurate&dataId=&tenant=xxx&group=xxx&pageNo=1&pageSize=200
   */
  async listConfigs(namespace, group) {
    const ns = namespace || this.defaultNamespace;
    const grp = group || this.defaultGroup;
    const auth = await this.authQuery();
    const url = `${this.baseUrl}/v1/cs/configs?${auth}search=accurate&dataId=&tenant=${encodeURIComponent(ns)}&group=${encodeURIComponent(grp)}&pageNo=1&pageSize=200`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`listConfigs failed (${res.status}): ${text}`);
    }
    return await res.json();
  }

  /**
   * 发布配置
   * Nacos 1.x: POST /v1/cs/configs with form body
   * 自动根据 dataId 扩展名设置 type（yaml/properties/json/text）
   */
  async publishConfig(dataId, content, namespace, group) {
    const ns = namespace || this.defaultNamespace;
    const grp = group || this.defaultGroup;
    const token = await this.login();
    const params = new URLSearchParams();
    params.append("dataId", dataId);
    params.append("group", grp);
    params.append("tenant", ns);
    params.append("content", content);
    if (dataId.endsWith(".yaml") || dataId.endsWith(".yml")) {
      params.append("type", "yaml");
    } else if (dataId.endsWith(".properties")) {
      params.append("type", "properties");
    } else if (dataId.endsWith(".json")) {
      params.append("type", "json");
    } else {
      params.append("type", "text");
    }
    if (token) params.append("accessToken", token);
    const url = `${this.baseUrl}/v1/cs/configs`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`publishConfig failed (${res.status}): ${text}`);
    }
    return await res.text();
  }

  /**
   * 获取全部配置内容
   */
  async getAllConfigs(namespace, group) {
    const listResult = await this.listConfigs(namespace, group);
    const items = listResult.pageItems || [];
    const configs = [];
    for (const item of items) {
      try {
        const content = await this.getConfig(item.dataId, namespace, group);
        configs.push({ dataId: item.dataId, group: item.group, content });
      } catch (e) {
        configs.push({ dataId: item.dataId, group: item.group, error: e.message });
      }
    }
    return configs;
  }
}

// ─── MCP Server ──────────────────────────────────────────────────────
const nacos = new NacosClient();
const server = new McpServer({
  name: "nacos-mcp-server",
  version: "1.0.0",
});

server.tool(
  "nacos_get_config",
  "获取 Nacos 中单个配置的内容。用于查看指定 dataId 的 yaml/properties 配置。",
  {
    dataId: z.string().describe("配置的 dataId，如 re-gateway.yaml、re-product.yaml"),
    namespace: z.string().optional().describe("命名空间 ID，默认使用环境变量 NACOS_NAMESPACE"),
    group: z.string().optional().describe("配置分组，默认使用环境变量 NACOS_GROUP"),
  },
  async ({ dataId, namespace, group }) => {
    try {
      const content = await nacos.getConfig(dataId, namespace, group);
      return { content: [{ type: "text", text: content }] };
    } catch (e) {
      return { content: [{ type: "text", text: `获取配置失败: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "nacos_list_configs",
  "列出 Nacos 中指定命名空间/分组下的所有配置项（dataId 列表）。",
  {
    namespace: z.string().optional().describe("命名空间 ID，默认使用环境变量 NACOS_NAMESPACE"),
    group: z.string().optional().describe("配置分组，默认使用环境变量 NACOS_GROUP"),
  },
  async ({ namespace, group }) => {
    try {
      const result = await nacos.listConfigs(namespace, group);
      const items = result.pageItems || [];
      const lines = [
        `配置列表 (共 ${result.totalCount || items.length} 项):`,
        "",
        ...items.map((item) => `- ${item.dataId}`),
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (e) {
      return { content: [{ type: "text", text: `列出配置失败: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "nacos_get_all_configs",
  "获取 Nacos 中指定命名空间/分组下的全部配置内容。返回每个 dataId 对应的完整配置。",
  {
    namespace: z.string().optional().describe("命名空间 ID，默认使用环境变量 NACOS_NAMESPACE"),
    group: z.string().optional().describe("配置分组，默认使用环境变量 NACOS_GROUP"),
  },
  async ({ namespace, group }) => {
    try {
      const configs = await nacos.getAllConfigs(namespace, group);
      const parts = configs.map((c) => {
        if (c.error) return `===== ${c.dataId} =====\n[错误] ${c.error}`;
        return `===== ${c.dataId} =====\n${c.content}`;
      });
      return { content: [{ type: "text", text: parts.join("\n\n") }] };
    } catch (e) {
      return { content: [{ type: "text", text: `获取全部配置失败: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "nacos_publish_config",
  "发布配置到 Nacos。原样保存配置内容，不修改任何格式（缩进、注释、空行等）。使用前必须先通过 nacos_get_config 获取当前内容，在原始内容基础上修改后再发布。",
  {
    dataId: z.string().describe("配置的 dataId，如 re-gateway.yaml"),
    content: z.string().describe("完整的配置内容，必须保持原始格式（YAML/properties 原样保存）"),
    namespace: z.string().optional().describe("命名空间 ID，默认使用环境变量 NACOS_NAMESPACE"),
    group: z.string().optional().describe("配置分组，默认使用环境变量 NACOS_GROUP"),
  },
  async ({ dataId, content, namespace, group }) => {
    try {
      const result = await nacos.publishConfig(dataId, content, namespace, group);
      return { content: [{ type: "text", text: `发布成功: ${dataId} (${result})` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `发布配置失败: ${e.message}` }], isError: true };
    }
  }
);

// ─── 启动 ────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[Nacos MCP Server] started");
