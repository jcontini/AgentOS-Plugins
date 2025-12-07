# Linear

**Use for:** Project management, issue tracking, sprint planning

## API Type

Linear uses **GraphQL**. All queries go to `graphql` endpoint.

## Common Queries

**Get my assigned issues:**
```graphql
{
  viewer {
    assignedIssues(first: 50) {
      nodes { identifier title priority state { name } dueDate }
    }
  }
}
```

**Get all issues (with pagination):**
```graphql
{
  issues(first: 100) {
    nodes { id identifier title description state { name } }
    pageInfo { hasNextPage endCursor }
  }
}
```

**Get issue by identifier:**
```graphql
{
  issues(first: 1, filter: { identifier: { eq: "DEV-123" } }) {
    nodes { id identifier title description }
  }
}
```

**Get teams:**
```graphql
{
  teams { nodes { id name } }
}
```

## Mutations

**Create issue:**
```graphql
mutation {
  issueCreate(input: {
    title: "Fix login bug"
    teamId: "TEAM-ID"
    description: "Users can't log in on mobile"
  }) {
    success
    issue { identifier url }
  }
}
```

**Update issue:**
```graphql
mutation {
  issueUpdate(id: "ISSUE-ID", input: {
    stateId: "STATE-ID"
    priority: 1
  }) {
    success
    issue { identifier state { name } }
  }
}
```

**Add comment:**
```graphql
mutation {
  commentCreate(input: {
    issueId: "ISSUE-ID"
    body: "Looking into this now"
  }) {
    success
  }
}
```

## Tips

- **Always paginate:** Default limit is 50. Use `first: 100` and check `hasNextPage`
- **Issue identifiers:** Format is `TEAM-123` (e.g., `DEV-42`, `ENG-100`)

## Full API Docs

- [Linear GraphQL API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [GraphQL Explorer](https://studio.apollographql.com/public/Linear-API/home)
