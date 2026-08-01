const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3000;

const initialTasks = [
  { id: 1, title: 'Buy groceries', category: 'personal', done: false },
  { id: 2, title: 'Finish assignment', category: 'work', done: false },
  { id: 3, title: 'Clean room', category: 'home', done: true },
];

let tasks = JSON.parse(JSON.stringify(initialTasks));

app.use(express.json());

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AI Version Task API',
    version: '1.0.0',
    description: 'A small in-memory task API with Swagger documentation.',
  },
  servers: [{ url: `http://localhost:${PORT}` }],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function paginate(items, page, limit) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const offset = (page - 1) * limit;
  const data = items.slice(offset, offset + limit);
  return { data, meta: { page, limit, total, pages } };
}

function parsePagination(req) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  return { page: Math.max(page, 1), limit: Math.max(limit, 1) };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - done
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Buy groceries
 *         category:
 *           type: string
 *           example: personal
 *         done:
 *           type: boolean
 *           example: false
 *     TaskInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           example: Read a book
 *         category:
 *           type: string
 *           example: personal
 *         done:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Server health check
 *     responses:
 *       200:
 *         description: Server is up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get task statistics
 *     responses:
 *       200:
 *         description: Task statistics returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_tasks:
 *                   type: integer
 *                   example: 3
 *                 done:
 *                   type: integer
 *                   example: 1
 *                 open:
 *                   type: integer
 *                   example: 2
 */
app.get('/stats', (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const open = total - done;
  res.json({ total_tasks: total, done, open });
});

/**
 * @swagger
 * /reset:
 *   post:
 *     summary: Reset tasks to initial state
 *     responses:
 *       200:
 *         description: Tasks reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
app.post('/reset', (req, res) => {
  tasks = JSON.parse(JSON.stringify(initialTasks));
  res.json({ status: 'success', tasks });
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get tasks with optional filters and pagination
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: done
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
app.get('/tasks', (req, res) => {
  let filtered = [...tasks];
  if (req.query.title) {
    filtered = filtered.filter((task) =>
      task.title.toLowerCase().includes(req.query.title.toLowerCase())
    );
  }
  if (req.query.category) {
    filtered = filtered.filter(
      (task) => task.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }
  if (req.query.done !== undefined) {
    const doneValue = String(req.query.done).toLowerCase() === 'true';
    filtered = filtered.filter((task) => task.done === doneValue);
  }
  const { page, limit } = parsePagination(req);
  const paginated = paginate(filtered, page, limit);
  res.json({ status: 'success', meta: paginated.meta, data: paginated.data });
});

/**
 * @swagger
 * /tasks/search:
 *   get:
 *     summary: Search tasks by title, category, or done status with pagination
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: done
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Found tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
app.get('/tasks/search', (req, res) => {
  req.url = '/tasks';
  app._router.handle(req, res);
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return res.status(404).json({ status: 'error', error: 'Task not found' });
  }
  res.json({ status: 'success', data: task });
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 */
app.post('/tasks', (req, res) => {
  const { title, category = 'general', done = false } = req.body;
  if (!title) {
    return res.status(400).json({ status: 'error', error: 'Title is required' });
  }
  const newTask = {
    id: tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1,
    title,
    category,
    done: Boolean(done),
  };
  tasks.push(newTask);
  res.status(201).json({ status: 'success', data: newTask });
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return res.status(404).json({ status: 'error', error: 'Task not found' });
  }
  const { title, category, done } = req.body;
  if (title !== undefined) task.title = title;
  if (category !== undefined) task.category = category;
  if (done !== undefined) task.done = Boolean(done);
  res.json({ status: 'success', data: task });
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const taskIndex = tasks.findIndex((item) => item.id === id);
  if (taskIndex < 0) {
    return res.status(404).json({ status: 'error', error: 'Task not found' });
  }
  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`AI Version Task API running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
