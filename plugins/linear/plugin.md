---
id: linear
name: Linear
description: Project management with blocking relationships, cycles, and full API access
category: productivity
icon: https://cdn.simpleicons.org/linear
color: "#5E6AD2"
protocol: shell

auth:
  type: api_key
  header: Authorization
  prefix: ""

requires:
  - curl
  - jq

actions:
  # === ISSUES ===
  list_issues:
    description: List issues with optional filters
    params:
      team:
        type: string
        description: Team name or key (e.g., "AgentOS" or "AGE")
      assignee:
        type: string
        description: Filter by assignee ("me" for current user)
      state:
        type: string
        description: Filter by state (Todo, In Progress, Done, Backlog)
      cycle:
        type: number
        description: Filter by cycle number
      limit:
        type: number
        default: 50
        description: Max results (default 50)
    run: |
      FILTER=""
      if [ -n "$PARAM_TEAM" ]; then
        FILTER="$FILTER, team: { key: { eq: \"$PARAM_TEAM\" } }"
      fi
      if [ -n "$PARAM_ASSIGNEE" ]; then
        if [ "$PARAM_ASSIGNEE" = "me" ]; then
          FILTER="$FILTER, assignee: { isMe: { eq: true } }"
        else
          FILTER="$FILTER, assignee: { name: { contains: \"$PARAM_ASSIGNEE\" } }"
        fi
      fi
      if [ -n "$PARAM_STATE" ]; then
        FILTER="$FILTER, state: { name: { eq: \"$PARAM_STATE\" } }"
      fi
      if [ -n "$PARAM_CYCLE" ]; then
        FILTER="$FILTER, cycle: { number: { eq: $PARAM_CYCLE } }"
      fi
      
      LIMIT="${PARAM_LIMIT:-50}"
      
      if [ -n "$FILTER" ]; then
        FILTER="filter: { ${FILTER#, } }"
      fi
      
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issues(first: $LIMIT, $FILTER) { nodes { identifier title state { name } priority cycle { number } project { name } assignee { name } } } }\"}" | \
      jq -r '.data.issues.nodes[] | "[\(.identifier)] \(.title) | \(.state.name) | P\(.priority // 0) | Cycle: \(.cycle.number // "-") | Project: \(.project.name // "-")"'

  get_issue:
    description: Get issue details including relations
    params:
      id:
        type: string
        required: true
        description: Issue identifier (e.g., AGE-8)
    run: |
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_ID\\\") { id identifier title description state { name } priority url cycle { number } project { name } assignee { name } relations { nodes { id type relatedIssue { identifier title } } } } }\"}" | \
      jq '.data.issue'

  create_issue:
    description: Create a new issue
    params:
      title:
        type: string
        required: true
        description: Issue title
      team:
        type: string
        required: true
        description: Team name or key
      description:
        type: string
        description: Issue description (markdown)
      priority:
        type: number
        description: Priority 0-4 (1=Urgent, 2=High, 3=Medium, 4=Low)
      project:
        type: string
        description: Project name
      state:
        type: string
        description: State name (Backlog, Todo, In Progress, Done)
      cycle:
        type: number
        description: Cycle number to assign to
    run: |
      # Build input object
      INPUT="title: \\\"$PARAM_TITLE\\\""
      
      # Get team ID
      TEAM_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ teams { nodes { id key name } } }\"}" | \
      jq -r ".data.teams.nodes[] | select(.key == \"$PARAM_TEAM\" or .name == \"$PARAM_TEAM\") | .id")
      INPUT="$INPUT, teamId: \\\"$TEAM_ID\\\""
      
      if [ -n "$PARAM_DESCRIPTION" ]; then
        DESC=$(echo "$PARAM_DESCRIPTION" | jq -Rs '.')
        INPUT="$INPUT, description: $DESC"
      fi
      if [ -n "$PARAM_PRIORITY" ]; then
        INPUT="$INPUT, priority: $PARAM_PRIORITY"
      fi
      if [ -n "$PARAM_PROJECT" ]; then
        PROJECT_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
          -H "Authorization: $AUTH_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"query\": \"{ projects { nodes { id name } } }\"}" | \
        jq -r ".data.projects.nodes[] | select(.name == \"$PARAM_PROJECT\") | .id")
        INPUT="$INPUT, projectId: \\\"$PROJECT_ID\\\""
      fi
      if [ -n "$PARAM_STATE" ]; then
        STATE_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
          -H "Authorization: $AUTH_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"query\": \"{ workflowStates { nodes { id name team { id } } } }\"}" | \
        jq -r ".data.workflowStates.nodes[] | select(.name == \"$PARAM_STATE\" and .team.id == \"$TEAM_ID\") | .id")
        INPUT="$INPUT, stateId: \\\"$STATE_ID\\\""
      fi
      if [ -n "$PARAM_CYCLE" ]; then
        CYCLE_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
          -H "Authorization: $AUTH_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"query\": \"{ cycles { nodes { id number team { id } } } }\"}" | \
        jq -r ".data.cycles.nodes[] | select(.number == $PARAM_CYCLE and .team.id == \"$TEAM_ID\") | .id")
        INPUT="$INPUT, cycleId: \\\"$CYCLE_ID\\\""
      fi
      
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { issueCreate(input: { $INPUT }) { success issue { identifier title url } } }\"}" | \
      jq '.data.issueCreate'

  update_issue:
    description: Update an existing issue
    params:
      id:
        type: string
        required: true
        description: Issue identifier (e.g., AGE-8)
      title:
        type: string
        description: New title
      description:
        type: string
        description: New description
      priority:
        type: number
        description: New priority
      state:
        type: string
        description: New state name
      cycle:
        type: number
        description: Cycle number (use 0 to remove from cycle)
    run: |
      # Get issue UUID from identifier
      ISSUE_UUID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_ID\\\") { id team { id } } }\"}" | \
      jq -r '.data.issue.id')
      TEAM_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_ID\\\") { team { id } } }\"}" | \
      jq -r '.data.issue.team.id')
      
      INPUT=""
      if [ -n "$PARAM_TITLE" ]; then
        INPUT="$INPUT, title: \\\"$PARAM_TITLE\\\""
      fi
      if [ -n "$PARAM_DESCRIPTION" ]; then
        DESC=$(echo "$PARAM_DESCRIPTION" | jq -Rs '.')
        INPUT="$INPUT, description: $DESC"
      fi
      if [ -n "$PARAM_PRIORITY" ]; then
        INPUT="$INPUT, priority: $PARAM_PRIORITY"
      fi
      if [ -n "$PARAM_STATE" ]; then
        STATE_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
          -H "Authorization: $AUTH_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"query\": \"{ workflowStates { nodes { id name team { id } } } }\"}" | \
        jq -r ".data.workflowStates.nodes[] | select(.name == \"$PARAM_STATE\" and .team.id == \"$TEAM_ID\") | .id")
        INPUT="$INPUT, stateId: \\\"$STATE_ID\\\""
      fi
      if [ -n "$PARAM_CYCLE" ]; then
        if [ "$PARAM_CYCLE" = "0" ]; then
          INPUT="$INPUT, cycleId: null"
        else
          CYCLE_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
            -H "Authorization: $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"{ cycles { nodes { id number team { id } } } }\"}" | \
          jq -r ".data.cycles.nodes[] | select(.number == $PARAM_CYCLE and .team.id == \"$TEAM_ID\") | .id")
          INPUT="$INPUT, cycleId: \\\"$CYCLE_ID\\\""
        fi
      fi
      
      INPUT="${INPUT#, }"
      
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { issueUpdate(id: \\\"$ISSUE_UUID\\\", input: { $INPUT }) { success issue { identifier title state { name } url } } }\"}" | \
      jq '.data.issueUpdate'

  # === BLOCKING RELATIONSHIPS (MCP doesn't support this!) ===
  add_blocking:
    description: Set issue A blocks issue B (A must complete before B)
    params:
      blocker:
        type: string
        required: true
        description: Issue that blocks (e.g., AGE-8)
      blocked:
        type: string
        required: true
        description: Issue that is blocked (e.g., AGE-6)
    run: |
      # Get UUIDs for both issues
      BLOCKER_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_BLOCKER\\\") { id } }\"}" | \
      jq -r '.data.issue.id')
      
      BLOCKED_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_BLOCKED\\\") { id } }\"}" | \
      jq -r '.data.issue.id')
      
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { issueRelationCreate(input: { issueId: \\\"$BLOCKER_ID\\\", relatedIssueId: \\\"$BLOCKED_ID\\\", type: blocks }) { success issueRelation { id } } }\"}" | \
      jq -r 'if .data.issueRelationCreate.success then "✅ \(.data.issueRelationCreate.issueRelation.id): '"$PARAM_BLOCKER"' blocks '"$PARAM_BLOCKED"'" else "❌ Failed: \(.errors[0].message // "Unknown error")" end'

  remove_blocking:
    description: Remove a blocking relationship
    params:
      blocker:
        type: string
        required: true
        description: Issue that blocks (e.g., AGE-8)
      blocked:
        type: string
        required: true
        description: Issue that was blocked (e.g., AGE-6)
    run: |
      # Get blocker UUID
      BLOCKER_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_BLOCKER\\\") { id } }\"}" | \
      jq -r '.data.issue.id')
      
      BLOCKED_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_BLOCKED\\\") { id } }\"}" | \
      jq -r '.data.issue.id')
      
      # Find the relation
      RELATION_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$BLOCKER_ID\\\") { relations { nodes { id type relatedIssue { id } } } } }\"}" | \
      jq -r ".data.issue.relations.nodes[] | select(.type == \"blocks\" and .relatedIssue.id == \"$BLOCKED_ID\") | .id")
      
      if [ -z "$RELATION_ID" ]; then
        echo "❌ No blocking relationship found"
        exit 1
      fi
      
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { issueRelationDelete(id: \\\"$RELATION_ID\\\") { success } }\"}" | \
      jq -r 'if .data.issueRelationDelete.success then "✅ Removed blocking relationship" else "❌ Failed" end'

  list_relations:
    description: List all relations for an issue
    params:
      id:
        type: string
        required: true
        description: Issue identifier (e.g., AGE-8)
    run: |
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ issue(id: \\\"$PARAM_ID\\\") { identifier title relations { nodes { id type relatedIssue { identifier title } } } inverseRelations { nodes { id type issue { identifier title } } } } }\"}" | \
      jq -r '
        .data.issue as $issue |
        "Issue: \($issue.identifier) - \($issue.title)\n",
        "Blocks:",
        (.data.issue.relations.nodes[] | select(.type == "blocks") | "  → \(.relatedIssue.identifier): \(.relatedIssue.title)"),
        "\nBlocked by:",
        (.data.issue.inverseRelations.nodes[] | select(.type == "blocks") | "  ← \(.issue.identifier): \(.issue.title)"),
        "\nRelated:",
        (.data.issue.relations.nodes[] | select(.type == "related") | "  ↔ \(.relatedIssue.identifier): \(.relatedIssue.title)")
      '

  # === CYCLES ===
  list_cycles:
    description: List cycles for a team
    params:
      team:
        type: string
        required: true
        description: Team name or key
      type:
        type: string
        description: Filter by current, next, or past
    run: |
      TEAM_ID=$(curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ teams { nodes { id key name } } }\"}" | \
      jq -r ".data.teams.nodes[] | select(.key == \"$PARAM_TEAM\" or .name == \"$PARAM_TEAM\") | .id")
      
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"{ team(id: \\\"$TEAM_ID\\\") { cycles { nodes { number startsAt endsAt completedIssueCountHistory scopeHistory } } } }\"}" | \
      jq -r '.data.team.cycles.nodes | sort_by(.number) | reverse | .[:5][] | "Cycle \(.number): \(.startsAt[:10]) to \(.endsAt[:10])"'

  # === PROJECTS ===
  list_projects:
    description: List all projects
    run: |
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query": "{ projects { nodes { id name state lead { name } priority } } }"}' | \
      jq -r '.data.projects.nodes[] | "[\(.id[:8])...] \(.name) | \(.state) | P\(.priority) | Lead: \(.lead.name // "-")"'

  # === TEAMS ===
  list_teams:
    description: List all teams
    run: |
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query": "{ teams { nodes { id key name } } }"}' | \
      jq -r '.data.teams.nodes[] | "[\(.key)] \(.name) | ID: \(.id)"'

  # === VIEWER ===
  whoami:
    description: Get current user info
    run: |
      curl -s -X POST "https://api.linear.app/graphql" \
        -H "Authorization: $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query": "{ viewer { id name email } }"}' | \
      jq -r '.data.viewer | "\(.name) <\(.email)> | ID: \(.id)"'
---

# Linear

Full-featured Linear integration with blocking relationships, cycles, and complete API access.

## Why This Plugin?

The official Linear MCP only exposes 23 tools and is missing critical features:
- **Blocking relationships** (this blocks that)
- **Advanced filtering** (by cycle, by relation)
- **Issue relations** (related, duplicate)

This native plugin provides full GraphQL API access.

## Authentication

Get your API key from: https://linear.app/settings/api

**Important**: Linear personal API keys are used WITHOUT the "Bearer" prefix.

## Tools

### Issues

#### list_issues
List issues with filters.

```
use-plugin(plugin: "linear", tool: "list_issues", params: {team: "AGE"})
use-plugin(plugin: "linear", tool: "list_issues", params: {team: "AGE", assignee: "me", state: "In Progress"})
use-plugin(plugin: "linear", tool: "list_issues", params: {team: "AGE", cycle: 1})
```

#### get_issue
Get full issue details including relations.

```
use-plugin(plugin: "linear", tool: "get_issue", params: {id: "AGE-8"})
```

#### create_issue
Create a new issue.

```
use-plugin(plugin: "linear", tool: "create_issue", params: {title: "New feature", team: "AGE"})
use-plugin(plugin: "linear", tool: "create_issue", params: {title: "Urgent bug", team: "AGE", priority: 1, state: "Todo"})
```

#### update_issue
Update an existing issue.

```
use-plugin(plugin: "linear", tool: "update_issue", params: {id: "AGE-8", state: "In Progress"})
use-plugin(plugin: "linear", tool: "update_issue", params: {id: "AGE-8", cycle: 1})
```

### Blocking Relationships

**This is what the official MCP can't do!**

#### add_blocking
Set issue A blocks issue B.

```
use-plugin(plugin: "linear", tool: "add_blocking", params: {blocker: "AGE-8", blocked: "AGE-6"})
```
This means AGE-8 must be completed before AGE-6.

#### remove_blocking
Remove a blocking relationship.

```
use-plugin(plugin: "linear", tool: "remove_blocking", params: {blocker: "AGE-8", blocked: "AGE-6"})
```

#### list_relations
See all relations for an issue.

```
use-plugin(plugin: "linear", tool: "list_relations", params: {id: "AGE-6"})
```

### Other Tools

#### list_cycles
```
use-plugin(plugin: "linear", tool: "list_cycles", params: {team: "AGE"})
```

#### list_projects
```
use-plugin(plugin: "linear", tool: "list_projects")
```

#### list_teams
```
use-plugin(plugin: "linear", tool: "list_teams")
```

#### whoami
```
use-plugin(plugin: "linear", tool: "whoami")
```

## Blocking Relationship Mental Model

- **"AGE-6 is blocked by AGE-8"** = AGE-8 must complete first
- The `blocker` parameter is the prerequisite issue
- The `blocked` parameter is the dependent issue

## Priority Values

| Value | Meaning |
|-------|---------|
| 0 | No priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium |
| 4 | Low |
