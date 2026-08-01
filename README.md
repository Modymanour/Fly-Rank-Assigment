# Task API

Simple Express task management API for Assignment 1.

## What this is

A small REST API built with Node.js and Express that manages a simple in-memory task list. It supports retrieving tasks, searching, creating, updating, deleting, and basic health/status endpoints.

## Install & Run

```bash
npm install
node index.js (or node . from any terminal if in project folder)
```

The server listens on port `3000` by default.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Get server health status |
| GET | `/stats` | Get task counts: total, done, open |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/search` | Search tasks by `title` and/or `done` query params |
| GET | `/tasks/:id` | Get a single task by ID |
| POST | `/tasks` | Create a new task with JSON `{ title }` |
| PUT | `/tasks/:id` | Update a task title with JSON `{ title }` |
| DELETE | `/tasks/:id` | Delete a task by ID |
| POST | `/hello` | Return greeting message from JSON `{ name }` |
| POST | `/reset` | Reset the tasks list to the initial seed data |

## Example curl

Create a task:

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "New Task"}'
```

Expected response:

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "status": "Created",
  "data": {
    "id": 4,
    "title": "New Task",
    "done": false
  }
}
```

## Postman Sample
<img width="1920" height="1044" alt="image" src="https://github.com/user-attachments/assets/c179bc47-f1fa-47ef-a2d7-b6f857f748b3" />

## Notes

- This API stores tasks in memory only, so data resets when the server restarts.
- The `/tasks/search` endpoint supports `title` and `done` query parameters. Example: `/tasks/search?title=task&done=false`.
- The screenshot shown in the assignment materials is from Postman rather than Swagger.

## Project files

- `index.js` — Express server and API routes
- `package.json` — project metadata and dependencies

## Dependencies

- `express`

## Repository

`https://github.com/Modymanour/Fly-Rank-Assigment`
