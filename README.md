# Nacos MCP Server

MCP Server for [Nacos](https://nacos.io/) Config Center, allowing AI assistants (like Claude Code) to read and write Nacos configurations directly.

Based on Nacos 1.x Open API. Supports authentication (accessToken) with auto-refresh.

## Features

- **Read configs** - Get single or all configurations from Nacos
- **List configs** - List all config dataIds in a namespace/group
- **Publish configs** - Update configs with auto format detection (yaml/properties/json/text)
- **Auth support** - Auto login and token refresh, compatible with no-auth setups

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/nacos-mcp-server.git
cd nacos-mcp-server
npm install
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NACOS_SERVER_ADDR` | `127.0.0.1:8848` | Nacos server address |
| `NACOS_CONTEXT_PATH` | `/nacos` | Nacos context path |
| `NACOS_NAMESPACE` | `` | Default namespace ID |
| `NACOS_GROUP` | `DEFAULT_GROUP` | Default config group |
| `NACOS_USERNAME` | `nacos` | Login username |
| `NACOS_PASSWORD` | `nacos` | Login password |

### Claude Code Configuration

Add to `~/.claude/.mcp.json` (global) or project `.mcp.json`:

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

> **Windows users**: Use `cmd` as command:
> ```json
> {
>   "command": "cmd",
>   "args": ["/c", "node", "D:/path/to/nacos-mcp-server/src/index.js"]
> }
> ```

## MCP Tools

### `nacos_get_config`

Get a single config by dataId.

**Parameters:**
- `dataId` (required) - Config dataId, e.g. `re-gateway.yaml`
- `namespace` (optional) - Namespace ID, defaults to env `NACOS_NAMESPACE`
- `group` (optional) - Config group, defaults to env `NACOS_GROUP`

### `nacos_list_configs`

List all configs in a namespace/group.

**Parameters:**
- `namespace` (optional) - Namespace ID
- `group` (optional) - Config group

### `nacos_get_all_configs`

Get full content of all configs in a namespace/group.

**Parameters:**
- `namespace` (optional) - Namespace ID
- `group` (optional) - Config group

### `nacos_publish_config`

Publish (update) a config. Content is saved as-is, preserving original format (indentation, comments, blank lines).

**Parameters:**
- `dataId` (required) - Config dataId
- `content` (required) - Full config content (must preserve original format)
- `namespace` (optional) - Namespace ID
- `group` (optional) - Config group

**Important:** Always `nacos_get_config` first, modify the original content, then publish. Format type (yaml/properties/json/text) is auto-detected from dataId extension.

## Requirements

- Node.js >= 18.0.0 (built-in `fetch`)
- Nacos 1.x or 2.x (uses 1.x compatible API)

## License

MIT
