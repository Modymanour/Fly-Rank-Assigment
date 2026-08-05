const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const db = require('./database.js');
const PORT = 3000;



app.use(express.json());

console.log("Database initialized and ready to use");
const rows = db.prepare('SELECT * FROM tasks').all();
console.log("Current tasks in database:", rows);

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
    res.send({"total_tasks" : tasks.length, "done" : tasks.filter(t => t.done).length, "open" : tasks.filter(t => !t.done).length}) 
});

//Seed & Reset
app.post('/reset', (req, res) => {
    tasks = [
        { id: 1, title: "Task 1", done: false },
        { id: 2, title: "Task 2", done: false },
        { id: 3, title: "Task 3", done: false },
    ];
    res.status(200).json({ status: "success", message: "Tasks reset successfully" });
});

//Get server health
app.get('/health', (req, res) => {
    res.send({"status" : "ok"})
})

//Get all tasks
app.get('/tasks', (req, res) => {
    // res.json(tasks);
    const data = db.prepare("SELECT * FROM tasks").all();
    res.status(200).send({status: "success", data: pagination(req, res, data) });
});

//Query for task
app.get('/tasks/search', (req, res) => {
    var curtitles = tasks;
    if(req.query.title){
        curtitles = curtitles.filter(t => t.title.toLowerCase().includes(req.query.title.toLowerCase()));
    }
    if(req.query.done){
        const doneStatus = req.query.done.toLowerCase() === 'true';
        curtitles = curtitles.filter(t => t.done == doneStatus);
    }
    if(curtitles.length === 0){
        return res.status(404).json({ "error": "No tasks found matching the criteria or tasks are empty" });
    }   
    res.status(200).json({ status: "success", data: pagination(req, res, curtitles) });
})

//Get Task by Id
app.get('/tasks/:id', (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ error: "Task Id is missing" });
    }
    const taskId = parseInt(req.params.id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ status: "success", data: task });
})

//Create a new task
app.post('/tasks', (req, res) => {
    if(!req.body.title){
        return res.status(400).json({ error: "Title is required" });
    }
    const title = req.body.title;
    const newTask = {
        id: tasks.length + 1,
        title: title,
        done: false
    }
    tasks.push(newTask);
    res.status(201).json({ status: "Created", data: newTask });
});

//Update a task
app.put('/tasks/:id', (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ "error": "Task Id is missing"})
    }
    if(!req.body.title){
        return res.status(400).json({ "error": "Task Title is missing"})
    }
    const taskId = parseInt(req.params.id);
    var task = tasks.find(t => t.id === taskId);
    task.title = req.body.title;
    res.status(200).json({ status: "success", data: task });
});

//Delete a task
app.delete('/tasks/:id', (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ "error": "Task Id is missing"})
    }
    const taskId = parseInt(req.params.id);
    task = tasks.find(t => t.id === taskId);
    if(!task){
        return res.status(404).json({ "error": "Task not found"})
    }
    tasks = tasks.filter(t => t.id !== taskId);
    res.status(204).json({ status: "success", message: "Task deleted successfully" });
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