const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db = require('./queries');
const session = require('client-sessions');

app.use(session({
    cookieName: 'session',
    secret: '1554848757296',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  }));

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
app.post('/users/create', db.createUser)
//app.put('/users/:id', db.updateUser)
//app.delete('/users/:id', db.deleteUser)


app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})