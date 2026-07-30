const express = require('express');
const app  = require('express')();
const PORT = 3000;

var tasks = [
    { id: 1, title: "Task 1", done: false },
    { id: 2, title: "Task 2", done: false },
    { id: 3, title: "Task 3", done: false },
];

app.use(express.json());

app.listen(
    PORT,
    () => console.log(`server is running on Port : ${PORT}`)
);

app.post('/hello', (req, res) => {
    if(!req.body.name){
        return res.status(400).json({ error: "Name is required"});
    }
    const { name } = req.body;
    res.json({ message: `Hello, ${name}!` });
})

app.get('', (req, res) => {
    res.send({"name" : "Task API", "Version" : 1.0, "Endpoints" : ["/tasks", "/hello"]})
})

app.get('/health', (req, res) => {
    res.send({"status" : "ok"})
})

app.get('/tasks', (req, res) => {
    // res.json(tasks);
    res.status(200).send({status: "success", data: tasks});
});

app.get('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ status: "success", data: task });
})