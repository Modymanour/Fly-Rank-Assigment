# Task API

Simple Express task management API for Assignment 1.

## What this is

A small REST API built with Node.js and Express that manages a SQLite database task list. It supports retrieving tasks, searching, creating, updating, deleting, and basic health/status endpoints.

## Why SQLite

SQLite was chosen for its compatibility with Expressjs along with its ease of use: single file, zero setup and an autmoatic (file name).db created immediately upon run.

### tasks.db run on DB Browser
<img width="1920" height="1040" alt="image" src="https://github.com/user-attachments/assets/a1fd7a3d-99f4-43e5-ba2a-a58799ffa45b" />


## Install & Run

```bash
npm install
node index.js (or node . from any terminal if in project folder)
```

The server listens on port `3000` by default.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Get server meta data |
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
- `database.js` — Database configuration file with 3 seeded tasks rows
- `swagger.js` — Swagger configuration file
- `api-docs.json` — resulted json from the swagger js file that is used by swagger to opne
- `tasks.db` — The database
- `package.json` — Project metadata and dependencies

## Dependencies

- `express`
- `Swagger`
- `Better-SQLite`


## I vs AI
### Prompt Image
<img width="909" height="728" alt="image" src="https://github.com/user-attachments/assets/956b416d-498c-48aa-a722-3847276f60ad" />

There are some differences ,offcourse, between our approaches:
- The AI more so implemented swagger using inline @swagger followed by yaml like configuration. If it was me, I wouldve either made a seperate yaml file or found a way to automate the process
- The AI implemented more variable validation more so than me. That is something that I will be working on since I think it is a good habit
- The AI used a lot more built in functions than me, and I think that is credited to me being new to the language

---
Assigment 2 
### Prompt Image

Overall, the result from the AI's work is extremely similar to my work except for 2 things: one major & one minor.
Due to me saying "and seed 3 rows so the database under any circumstances have 3 rows" it made the database able to only have 3 rows. I meant in a case of 
errors or bugs happening, or a person just starting the db for it to have 3 rows; Yet, my wording made it seem like there should only be 3 rows ever. The minor difference is the use of db.prepare in which the AI keeps the command saved and I just use them when needed.


## Running SQL by Hand

There is a section in assigment 2 where I have to run 5 SQL commands by hand and since I have run them all I will be documenting what two of them done:
```bash
UPDATE tasks SET done = 1;
DELETE FROM tasks WHERE done = 1;
```
The first one makes all the tasks in my database done & the second deletes all the done tasks so effectively the database is empty until I restart the backend again

## Repository

`https://github.com/Modymanour/Fly-Rank-Assigment`
