const express = require('express');
const app  = require('express')();
const PORT = 3000;

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