# How to Run — Homework 5 MCP Servers

## Prerequisites

- Node.js ≥ 18 (for GitHub, Filesystem, and Jira MCP servers via `npx`)
- Python ≥ 3.10 (for the custom FastMCP server)
- Claude Code CLI installed and authenticated

---

## Task 4: Custom MCP Server (FastMCP)

### 1. Install dependencies

```bash
cd homework-5/custom-mcp-server
pip3 install -r requirements.txt
```

### 2. Run the server manually (optional — for testing)

```bash
python3 server.py
```

The server starts over stdio (MCP's default transport). You can also use `fastmcp dev` for an interactive inspector:

```bash
fastmcp dev server.py
```

### 3. Connect via MCP configuration

Copy `.mcp.json` to your project root or add the `lorem-ipsum` entry to your existing `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "lorem-ipsum": {
      "command": "python3",
      "args": ["/absolute/path/to/homework-5/custom-mcp-server/server.py"]
    }
  }
}
```

> Update the path to match your local checkout.

### 4. Use / test the `read` tool in Claude Code

Once the server is connected, ask Claude:

```
Use the read tool to get 50 words of lorem ipsum.
```

Or call it with the default word count (30):

```
Call the read tool from lorem-ipsum MCP.
```

---

## Task 1: GitHub MCP

### 1. Create a GitHub Personal Access Token

Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** and create a token with repo read permissions.

### 2. Set the token in `.mcp.json`

Replace `<YOUR_GITHUB_PAT>` in `.mcp.json` with your token.

### 3. Connect

Add the `github` entry from `.mcp.json` to your Claude Code MCP config. Restart Claude Code.

### 4. Test

```
List my last 5 pull requests on <repo-name>.
```

---

## Task 2: Filesystem MCP

### 1. Configure the path

The `.mcp.json` already points to `/Users/vlad/IdeaProjects/aipcp/AI-Coding-Partner-Homework`. Update it to the directory you want to expose.

### 2. Connect

Add the `filesystem` entry from `.mcp.json` to your Claude Code MCP config. Restart Claude Code.

### 3. Test

```
List the files in the root of the project.
```

---

## Task 3: Jira MCP

### 1. Create a Jira API token

Go to **Atlassian account → Security → API tokens** and create a token.

### 2. Set credentials in `.mcp.json`

Replace the placeholder values for `JIRA_HOST`, `JIRA_USERNAME`, and `JIRA_API_TOKEN`.

### 3. Connect

Add the `jira` entry from `.mcp.json` to your Claude Code MCP config. Restart Claude Code.

### 4. Test

```
Give me the Jira tickets of the last 5 bugs on project <PROJECT_KEY>.
```

---

## MCP Configuration Verification Checklist

- [ ] `fastmcp` listed in `custom-mcp-server/requirements.txt`
- [ ] `python server.py` starts without errors
- [ ] `.mcp.json` is present and all server entries are valid JSON
- [ ] GitHub PAT replaced with a real token
- [ ] Filesystem path points to an existing directory
- [ ] Jira credentials filled in
- [ ] All four servers appear in Claude Code's MCP server list
