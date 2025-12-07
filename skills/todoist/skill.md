# Todoist

**Use for:** Personal task management - create, list, complete, update, delete tasks

## Endpoints

| Operation | Method | Path |
|-----------|--------|------|
| List tasks | GET | `rest/v2/tasks` |
| Get task | GET | `rest/v2/tasks/{id}` |
| Create task | POST | `rest/v2/tasks` |
| Update task | POST | `rest/v2/tasks/{id}` |
| Complete task | POST | `rest/v2/tasks/{id}/close` |
| Reopen task | POST | `rest/v2/tasks/{id}/reopen` |
| Delete task | DELETE | `rest/v2/tasks/{id}` |
| List projects | GET | `rest/v2/projects` |
| List labels | GET | `rest/v2/labels` |

## Query Filters

Add to path as query params:

| Filter | Path |
|--------|------|
| Due today | `rest/v2/tasks?filter=today` |
| Due this week | `rest/v2/tasks?filter=7%20days` |
| Overdue | `rest/v2/tasks?filter=overdue` |
| No due date | `rest/v2/tasks?filter=no%20date` |
| By project | `rest/v2/tasks?project_id={id}` |
| Subtasks of task | `rest/v2/tasks?parent_id={id}` |

## Create Task

```json
{
  "content": "Task name",
  "due_string": "today",
  "labels": ["AI"],
  "priority": 4,
  "project_id": "123",
  "description": "Optional notes"
}
```

**Fields:**
- `content` (required): Task title
- `due_string`: Natural language date (`today`, `tomorrow`, `next monday`, `2025-01-15`)
- `labels`: Array of label names
- `priority`: 1 (normal) to 4 (urgent)
- `project_id`: Target project (cannot be changed after creation)
- `parent_id`: Create as subtask of another task

## Update Task

```json
{
  "content": "Updated title",
  "due_string": "tomorrow",
  "priority": 2
}
```

**Note:** Cannot update `project_id`. To move a task, delete and recreate it.

## AI Defaults

When creating tasks for the user:
1. Always add `"labels": ["AI"]` so user knows task was AI-created
2. Use `"due_string": "today"` if user doesn't specify a date
3. Include `project_id` at creation if user specifies a project

## Important Notes

- **Subtasks:** When retrieving a task, also fetch subtasks with `?parent_id={task_id}`
- **Priority:** 1 = normal, 4 = urgent (reverse of what you might expect)
- **Rate limits:** ~450 requests per 15 minutes

## Full API Docs

https://developer.todoist.com/rest/v2/
