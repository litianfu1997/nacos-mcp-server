# Nacos MCP Server

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

MCP Server for [Nacos](https://nacos.io/) Config Center, allowing AI assistants (like Claude Code) to read and write Nacos configurations directly.

Based on Nacos 1.x Open API. Supports authentication (accessToken) with auto-refresh.

### Features

- **Read configs** - Get single or all configurations from Nacos
- **List configs** - List all config dataIds in a namespace/group
- **Publish configs** - Update configs with auto format detection (yaml/properties/json/text)
- **Auth support** - Auto login and token refresh, compatible with no-auth setups

### Installation

```bash
git clone https://github.com/litianfu1997/nacos-mcp-server.git
cd nacos-mcp-server
npm install
```

### Configuration

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NACOS_SERVER_ADDR` | `127.0.0.1:8848` | Nacos server address |
| `NACOS_CONTEXT_PATH` | `/nacos` | Nacos context path |
| `NACOS_NAMESPACE` | `` | Default namespace ID |
| `NACOS_GROUP` | `DEFAULT_GROUP` | Default config group |
| `NACOS_USERNAME` | `nacos` | Login username |
| `NACOS_PASSWORD` | `nacos` | Login password |

#### Claude Code Configuration

Add the `index.js` path to `~/.claude.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "nacos": {
      "command": "node",
      "args": ["/path/to/nacos-mcp-server/src/index.js"]
    }
  }
}
```

> **Windows users**: Use `cmd` as command:
> ```json
> {
>   "command": "cmd",
>   "args": ["/c", "node", "D:/path/to/nacos-mcp-server/src/index.js"]
> }
> ```

Nacos connection parameters support two configuration methods:

**Method 1: Environment Variables (via env in mcpServers)**

```json
{
  "mcpServers": {
    "nacos": {
      "command": "node",
      "args": ["/path/to/nacos-mcp-server/src/index.js"],
      "env": {
        "NACOS_SERVER_ADDR": "127.0.0.1:8848",
        "NACOS_NAMESPACE": "your-namespace-id",
        "NACOS_GROUP": "your-group",
        "NACOS_USERNAME": "nacos",
        "NACOS_PASSWORD": "nacos",
        "NACOS_CONTEXT_PATH": "/nacos"
      }
    }
  }
}
```

**Method 2: Config File (Recommended)**

Create `~/.nacos-mcp.json` in the project directory or user home directory:

```json
{
  "serverAddr": "127.0.0.1:8848",
  "contextPath": "/nacos",
  "namespace": "your-namespace-id",
  "group": "DEFAULT_GROUP",
  "username": "nacos",
  "password": "nacos"
}
```

Config priority: Project `.nacos-mcp.json` > User home `~/.nacos-mcp.json` > Environment variables > Defaults.

### MCP Tools

#### `nacos_get_config`

Get a single config by dataId.

**Parameters:**
- `dataId` (required) - Config dataId, e.g. `re-gateway.yaml`
- `namespace` (optional) - Namespace ID, defaults to env `NACOS_NAMESPACE`
- `group` (optional) - Config group, defaults to env `NACOS_GROUP`

#### `nacos_list_configs`

List all configs in a namespace/group.

**Parameters:**
- `namespace` (optional) - Namespace ID
- `group` (optional) - Config group

#### `nacos_get_all_configs`

Get full content of all configs in a namespace/group.

**Parameters:**
- `namespace` (optional) - Namespace ID
- `group` (optional) - Config group

#### `nacos_publish_config`

Publish (update) a config. Content is saved as-is, preserving original format (indentation, comments, blank lines).

**Parameters:**
- `dataId` (required) - Config dataId
- `content` (required) - Full config content (must preserve original format)
- `namespace` (optional) - Namespace ID
- `group` (optional) - Config group

**Important:** Always `nacos_get_config` first, modify the original content, then publish. Format type (yaml/properties/json/text) is auto-detected from dataId extension.

### Requirements

- Node.js >= 18.0.0 (built-in `fetch`)
- Nacos 1.x or 2.x (uses 1.x compatible API)

### License

MIT

---

<a id="中文"></a>

## 中文

[Nacos](https://nacos.io/) 配置中心的 MCP Server，让 AI 助手（如 Claude Code）可以直接读写 Nacos 配置。

基于 Nacos 1.x Open API，支持认证（accessToken）及自动刷新。

### 功能特性

- **读取配置** - 获取单个或全部 Nacos 配置
- **列出配置** - 列出指定命名空间/分组下的所有配置 dataId
- **发布配置** - 更新配置，自动识别格式（yaml/properties/json/text）
- **认证支持** - 自动登录与 Token 刷新，兼容无认证环境

### 安装

```bash
git clone https://github.com/litianfu1997/nacos-mcp-server.git
cd nacos-mcp-server
npm install
```

### 配置

#### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NACOS_SERVER_ADDR` | `127.0.0.1:8848` | Nacos 服务器地址 |
| `NACOS_CONTEXT_PATH` | `/nacos` | Nacos 上下文路径 |
| `NACOS_NAMESPACE` | `` | 默认命名空间 ID |
| `NACOS_GROUP` | `DEFAULT_GROUP` | 默认配置分组 |
| `NACOS_USERNAME` | `nacos` | 登录用户名 |
| `NACOS_PASSWORD` | `nacos` | 登录密码 |

#### Claude Code 配置

将 `index.js` 路径配置到 `~/.claude.json` 的 `mcpServers` 下即可：

```json
{
  "mcpServers": {
    "nacos": {
      "command": "node",
      "args": ["/path/to/nacos-mcp-server/src/index.js"]
    }
  }
}
```

> **Windows 用户**：使用 `cmd` 作为 command：
> ```json
> {
>   "command": "cmd",
>   "args": ["/c", "node", "D:/path/to/nacos-mcp-server/src/index.js"]
> }
> ```

Nacos 连接参数支持两种配置方式：

**方式一：环境变量（在 mcpServers 中配置 env）**

```json
{
  "mcpServers": {
    "nacos": {
      "command": "node",
      "args": ["/path/to/nacos-mcp-server/src/index.js"],
      "env": {
        "NACOS_SERVER_ADDR": "127.0.0.1:8848",
        "NACOS_NAMESPACE": "your-namespace-id",
        "NACOS_GROUP": "your-group",
        "NACOS_USERNAME": "nacos",
        "NACOS_PASSWORD": "nacos",
        "NACOS_CONTEXT_PATH": "/nacos"
      }
    }
  }
}
```

**方式二：配置文件（推荐）**

在项目目录或用户目录下创建 `~/.nacos-mcp.json`：

```json
{
  "serverAddr": "127.0.0.1:8848",
  "contextPath": "/nacos",
  "namespace": "your-namespace-id",
  "group": "DEFAULT_GROUP",
  "username": "nacos",
  "password": "nacos"
}
```

配置优先级：项目目录 `.nacos-mcp.json` > 用户目录 `~/.nacos-mcp.json` > 环境变量 > 默认值。

### MCP 工具

#### `nacos_get_config`

获取单个配置的内容。

**参数：**
- `dataId`（必填）- 配置的 dataId，如 `re-gateway.yaml`
- `namespace`（可选）- 命名空间 ID，默认使用环境变量 `NACOS_NAMESPACE`
- `group`（可选）- 配置分组，默认使用环境变量 `NACOS_GROUP`

#### `nacos_list_configs`

列出指定命名空间/分组下的所有配置项（dataId 列表）。

**参数：**
- `namespace`（可选）- 命名空间 ID
- `group`（可选）- 配置分组

#### `nacos_get_all_configs`

获取指定命名空间/分组下的全部配置内容。返回每个 dataId 对应的完整配置。

**参数：**
- `namespace`（可选）- 命名空间 ID
- `group`（可选）- 配置分组

#### `nacos_publish_config`

发布（更新）配置。原样保存配置内容，不修改任何格式（缩进、注释、空行等）。

**参数：**
- `dataId`（必填）- 配置的 dataId
- `content`（必填）- 完整的配置内容，必须保持原始格式
- `namespace`（可选）- 命名空间 ID
- `group`（可选）- 配置分组

**重要：** 必须先通过 `nacos_get_config` 获取当前内容，在原始内容基础上修改后再发布。格式类型（yaml/properties/json/text）根据 dataId 扩展名自动识别。

### 环境要求

- Node.js >= 18.0.0（内置 `fetch`）
- Nacos 1.x 或 2.x（使用 1.x 兼容 API）

### 许可证

MIT
