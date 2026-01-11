# AgentOS Integrations

Open-source apps and integrations for [AgentOS](https://github.com/jcontini/agentos).

## Mental Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  INTERFACES: MCP Server • HTTP API • CarPlay • Widgets • ...       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  APPS: Tasks • Databases • Messages • Calendar • Finance • Web     │
│  Location: apps/{app}/readme.md — schema + actions                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  INTEGRATIONS: todoist • linear • apple-contacts • mimestream      │
│  Location: apps/{app}/connectors/{name}/readme.md                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTORS: rest: • graphql: • sql: • swift: • csv: • command:     │
│  Location: AgentOS Core (Rust)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Terminology

| Term | Meaning | Notes |
|------|---------|-------|
| **App** | Data type with unified schema + actions | tasks, contacts, email |
| **Integration** | Service that implements app(s) | todoist, linear, apple-contacts |
| **Account** | Your configured access to an integration | Credentials, API keys, or "default" for local |
| **Executor** | Protocol handler in Rust core | `rest:`, `sql:`, `graphql:` |

> **Note:** We're migrating from "Connector" to "Integration". Code and folders still use "connector" but documentation uses "integration".

## Structure

```
apps/
  tasks/
    readme.md              # Schema + actions
    connectors/
      todoist/
        readme.md          # Auth + action implementations
      linear/
        readme.md
  databases/
    readme.md
    connectors/
      postgres/
        readme.md
      sqlite/
        readme.md
```

## Core Concepts

| Layer | What | Examples |
|-------|------|----------|
| **App** | Capability with unified schema | Tasks, Contacts, Messages |
| **Integration** | Service that implements app(s) | todoist, linear, apple-contacts |
| **Executor** | Protocol handler (Rust) | `rest:`, `sql:`, `graphql:` |

### How It Works

```
AI calls: Tasks(action: "list", integration: "todoist")
    ↓
AgentOS loads: apps/tasks/connectors/todoist/readme.md
    ↓
Executes: rest: block with injected credentials
    ↓
Returns: Unified task schema
```

## Current Apps

| App | Integrations |
|-----|------------|
| Tasks | todoist, linear |
| Messages | imessage, whatsapp, cursor |
| Databases | postgres, sqlite, mysql |
| Calendar | apple |
| Contacts | apple |
| Finance | copilot |
| Web | exa, firecrawl, reddit |

## Development

```bash
git clone https://github.com/jcontini/agentos-integrations
cd agentos-integrations
npm install    # Sets up pre-commit hooks via husky
```

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- App schema definition
- Connector YAML format  
- Executor blocks (rest, graphql, sql, applescript)
- Security architecture

## License

MIT
