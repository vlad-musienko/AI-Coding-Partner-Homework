# Homework 5: Configure MCP Servers

**Author:** Vlad Musienko

## Overview

This homework demonstrates connecting an AI coding assistant (Claude Code) to four MCP (Model Context Protocol) servers:

1. **GitHub MCP** — queries pull requests, commits, and issues from GitHub repositories.
2. **Filesystem MCP** — exposes a local directory so Claude can list and read files.
3. **Jira MCP** — connects to Atlassian Jira to fetch tickets and project data.
4. **Custom MCP (FastMCP)** — a hand-built server that serves lorem ipsum text via a `read` tool and a resource URI.

## Project Structure

```
homework-5/
├── README.md               — this file
├── HOWTORUN.md             — install, run, connect, and usage instructions
├── TASKS.md                — original task specification
├── .mcp.json               — MCP server configuration for all four servers
├── custom-mcp-server/
│   ├── server.py           — FastMCP server implementation
│   ├── lorem-ipsum.md      — source text for the resource/tool output
│   └── requirements.txt    — Python dependencies (includes fastmcp)
└── docs/
    └── screenshots/
        ├── github-mcp-result.png
        ├── filesystem-mcp-result.png
        ├── jira-mcp-result.png
        └── custom-mcp-read-tool-result.png
```

## Resources vs Tools (Custom MCP)

| Concept | What it is | How Claude uses it |
|---------|-----------|-------------------|
| **Resource** | A URI that exposes data (files, APIs, etc.) | Claude fetches it passively, like reading a URL |
| **Tool** | A callable action with optional parameters | Claude invokes it actively, like calling a function |

The custom server exposes both:
- **Resource** `lorem://ipsum?word_count=N` — returns N words from `lorem-ipsum.md`
- **Tool** `read(word_count=30)` — same content, callable as a tool

## Setup

See [HOWTORUN.md](HOWTORUN.md) for full install and connection instructions.
