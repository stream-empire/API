const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db = require('./queries');


app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

// Endpoints


app.get('/', (request, response) => {
    response.json({ info: 'Node.js, express, and Postgres API'})
})
app.get('/users/getall', db.getUsers);
// /users/leaderboard/shards/:count
// /users/leaderboard/rank/:count
// /users/all
// /user/give/shards/:name&:amount

app.get('/user/get/', db.getUser)
//app.post('/users/create', db.createUser)
//app.put('/users/:id', db.updateUser)
//app.delete('/users/:id', db.deleteUser)


app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})