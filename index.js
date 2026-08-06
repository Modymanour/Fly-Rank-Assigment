const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const db = require('./database.js');
const { get } = require('https');
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
app.get('/tasks', (req, res) => {
    // res.json(tasks);
    const data = db.prepare("SELECT * FROM tasks").all();
    res.status(200).send({status: "success", data: pagination(req, res, data) });
});

//Query for task
app.get('/tasks/search', (req, res) => {
    var curtitles = db.prepare("SELECT * FROM tasks").all();
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
app.get('/tasks/:id', (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ error: "Task Id is missing" });
    }
    const taskId = parseInt(req.params.id);
    if(isNaN(taskId)){
        return res.status(400).json({ "error": "Given Task Id was not valid"});
    }
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
    try{
        const insert = db.prepare("Insert into tasks (title, done) values (?, ?)");
        const createTask = db.transaction((title) => {
            const newTask = {
                title: title,
                done: 0
            }
            insert.run(newTask.title, newTask.done);
            return newTask;
        });
        const title = req.body.title;
        const newTask = createTask(title);
        res.status(201).json({ status: "Created", data: newTask });
    }
    catch(err){
        return res.status(400).json({ "error": err.message });
    }
});

//Update a task
app.put('/tasks/:id', (req, res) => {
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

        const update = db.prepare("UPDATE tasks SET title = ?, done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        const get = db.prepare("SELECT * FROM tasks WHERE id = ?");
        const updateTask = db.transaction((taskId, title, done) => {
            const task = get.get(taskId);
            if(!task){
                throw new Error("Task not found");
            }
            if(req.body.title) task.title = req.body.title;
            if(req.body.done !== undefined) {
                if(typeof req.body.done !== 'boolean') {
                    throw new Error("Invalid value for 'done'. It should be a boolean.");
                }
                task.done = req.body.done ? 1 : 0;
            }
            
            update.run(task.title, task.done, taskId);
            return task;
        });
        
        const task = updateTask(taskId, req.body.title, req.body.done);
        res.status(200).json({ status: "success", data: task });
    }
    catch(err){
        return res.status(400).json({ "error": err.message });
    }
});

//Delete a task
app.delete('/tasks/:id', (req, res) => {
    if(!req.params.id){
        return res.status(404).json({ "error": "Task Id is missing"})
    }
    const taskId = parseInt(req.params.id);
    if(isNaN(taskId)){
        return res.status(400).json({ "error": "Given Task Id was not valid"});
    }
    try{

        const get = db.prepare("SELECT * FROM tasks WHERE id = ?");
        const deleteTask = db.transaction((taskId) => {
            const task = get.get(taskId);
            if(!task){
                throw new Error("Task not found");
            }
            const delete_ = db.prepare("DELETE FROM tasks WHERE id = ?");
            delete_.run(taskId);
        })
        deleteTask(taskId);
        
        res.status(204).json({ status: "success", message: "Task deleted successfully" });
    }
    catch(err){
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