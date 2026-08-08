const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const db = require('./sqlitedatabase.js');
const pool = require('./postgresDb.js');
const { get } = require('https');
const PORT = 3000;



app.use(express.json());

// console.log("Database initialized and ready to use");
// const rows = db.prepare('SELECT * FROM tasks').all();
// console.log("Current tasks in database:", rows);

console.log("Postgres database initialized and ready to use");
(async () => {
    try {
        await pool.initializationPromise;
        const pgRows = await pool.query('SELECT * FROM tasks');
        console.log("Current tasks in Postgres database:", pgRows.rows);
    } catch (err) {
        console.error("Postgres query error:", err.message);
    }
})();

app.get('/api-docs.json', (req, res) => {
  const file = path.join(process.cwd(), 'api-docs.json');
  if (fs.existsSync(file)) return res.sendFile(file);
  return res.status(404).json({ error: 'api-docs.json not found yet — trigger some requests first' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/api-docs.json' }));

app.listen(
    PORT,
    () => {
        console.log(`server is running on Port : ${PORT}`);
        console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    }
);

//Hello Endpoint
app.post('/hello', (req, res) => {
    if(!req.body.name){
        return res.status(400).json({ error: "Name is required"});
    }
    const { name } = req.body;
    res.json({ message: `Hello, ${name}!` });
});

//Get Application Data
app.get('', (req, res) => {
    res.send({"name" : "Task API", "Version" : 1.0, "Endpoints" : ["/tasks", "/hello"]})
});

//Get Application Stats
app.get('/stats', (req, res) => {
    const tasks = db.prepare("Select * from tasks").all();
    const finishedTasks = tasks.filter(t => t.done === 1).length;
    const pendingTasks = tasks.length - finishedTasks;
    res.send({"totalTasks" : tasks.length, "finishedTasks" : finishedTasks, "pendingTasks" : pendingTasks});
});

//Seed & Reset
app.post('/reset', (req, res) => {
    db.exec("DELETE FROM tasks");
    db.exec(`
        Insert into tasks (title, done) values
        ('Laundry', 0),
        ('Cooking', 0),
        ('Cleaning', 0)
    `);
    res.status(200).json({ status: "success", message: "Tasks reset successfully" });
});

//Get server health
app.get('/health', (req, res) => {
    res.send({"status" : "ok"})
})

//Get all tasks
app.get('/tasks', async (req, res) => {
    // res.json(tasks);
    const data = await pool.query('SELECT * FROM tasks');
    res.status(200).send({status: "success", data: pagination(req, res, data.rows) });
});

//Query for task
app.get('/tasks/search', async (req, res) => {
    var curtitles = await pool.query('SELECT * FROM tasks');
    curtitles = curtitles.rows;
    if(req.query.title){
        curtitles = curtitles.filter(t => t.title.toLowerCase().includes(req.query.title.toLowerCase()));
    }
    if(req.query.done){
        const doneStatus = req.query.done.toLowerCase() === 'true';
        curtitles = curtitles.filter(t => t.done == doneStatus);
    }
    //filtering on title only for now
    if(req.query.OrderBy){
        if(("asc").includes(req.query.OrderBy.toLowerCase())){ // does not have to be exact match could be a, as, asc, sc and so forth
            curtitles.sort((a, b) => a.title.localeCompare(b.title));
        }
        else if(("desc").includes(req.query.OrderBy.toLowerCase())){// does not have to be exact match could be d, de, desc, sc and so forth
            curtitles.sort((a, b) => b.title.localeCompare(a.title));
        }
        else{
            return res.status(400).json({ "error": "Invalid OrderBy value. Use 'asc' or 'desc'." });
        }
    }
    if(curtitles.length === 0){
        return res.status(404).json({ "error": "No tasks found matching the criteria or tasks are empty" });
    }   
    res.status(200).json({ status: "success", data: pagination(req, res, curtitles) });
})

//Get Task by Id
app.get('/tasks/:id', async (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ error: "Task Id is missing" });
    }
    const taskId = parseInt(req.params.id);
    if(isNaN(taskId)){
        return res.status(400).json({ "error": "Given Task Id was not valid"});
    }
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ status: "success", data: task.rows });
})

//Create a new task
app.post('/tasks', async (req, res) => {
    if(!req.body.title){
        return res.status(400).json({ error: "Title is required" });
    }
    try{
        await pool.query('BEGIN');
        const newTask = {
            title: req.body.title,
            done: 0
        };
        await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *', [newTask.title, newTask.done]);
        await pool.query('COMMIT');
        res.status(201).json({ status: "Created", data: newTask });
    } catch (err) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ "error": err.message });
    }
});

//Update a task
app.put('/tasks/:id', async (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ "error": "Task Id is missing"})
    }
    if(!req.body.title && !req.body.done){
        return res.status(400).json({ "error": "both Updatable data are missing"})
    }
    const taskId = parseInt(req.params.id);
    if(isNaN(taskId)){
        return res.status(400).json({ "error": "Given Task Id was not valid"});
    }
    try{
        await pool.query('BEGIN');
        const task = (await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId])).rows[0];
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        if(req.body.title) task.title = req.body.title;
        if(req.body.done !== undefined) {
            if(typeof req.body.done !== 'boolean') {
                throw new Error("Invalid value for 'done'. It should be a boolean.");
            }
            task.done = req.body.done ? 1 : 0;
        }
        await pool.query('UPDATE tasks set title = $1, done = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [task.title, task.done, taskId]);
        await pool.query('COMMIT');
        res.status(200).json({ status: "success", data: task });
    }
    catch(err){
        await pool.query('ROLLBACK');
        return res.status(400).json({ "error": err.message });
    }
});

//Delete a task
app.delete('/tasks/:id', async (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ "error": "Task Id is missing"})
    }
    const taskId = parseInt(req.params.id);
    if(isNaN(taskId)){
        return res.status(400).json({ "error": "Given Task Id was not valid"});
    }
    try{
        await pool.query('BEGIN');
        const task = (await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId])).rows[0];
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
        await pool.query('COMMIT');

        res.status(204).json({ status: "success", message: "Task deleted successfully" });
    }
    catch(err){
        await pool.query("ROLLBACK");
        return res.status(400).json({ "error": err.message });  
    }
})

function pagination(req, res, list) {
    if(!req.query.page && !req.query.limit){
        return list;
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return list.slice(startIndex, endIndex);
}