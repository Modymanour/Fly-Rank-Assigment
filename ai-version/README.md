# AI Version Task API

A small Node.js Express todo application with in-memory storage and Swagger documentation.

## Features

- Get all tasks with optional filters and pagination
- Get task by ID
- Search tasks by title, category, or done status
- Add tasks
- Update tasks
- Delete tasks
- Reset tasks to the original default list
- Stats endpoint
- Health check endpoint
- Swagger UI available at `/api-docs`

## Install & Run

```bash
cd ai-version
npm install
npm start
```

Then open `http://localhost:3000/api-docs`.

## Default tasks

- id: `1`, title: `Buy groceries`, category: `personal`, done: `false`
- id: `2`, title: `Finish assignment`, category: `work`, done: `false`
- id: `3`, title: `Clean room`, category: `home`, done: `true`

## Endpoints

- `GET /tasks`
- `GET /tasks/:id`
- `GET /tasks/search`
- `GET /stats`
- `GET /health`
- `POST /reset`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`

## Pagination

Use `page` and `limit` query parameters for multi-item endpoints like `/tasks` and `/tasks/search`.

Example:

```bash
curl "http://localhost:3000/tasks?page=1&limit=2"
```
