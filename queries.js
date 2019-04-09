//Credentials
const dotenv = require('dotenv');
dotenv.config()
const serverIp = process.env.SERVERIP;
const serverUser = process.env.SERVERUSERNAME;
const serverPass = process.env.SERVERPASSWORD;
const serverDb = process.env.SERVERDB;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(`postgres://${serverUser}:${serverPass}@${serverIp}:5432/${serverDb}`, {logging: false});
const Op = Sequelize.Op
//this sets up the streamer data table
class streamer extends Sequelize.Model {}
streamer.init({
    userID: {type: Sequelize.STRING, unique: true},
    twitchName: {type: Sequelize.STRING, unique: true},
    siteName: {type: Sequelize.STRING, unique: true},
    shards: Sequelize.INTEGER,
    verified: Sequelize.BOOLEAN,
    thumbnail: Sequelize.STRING,
    isLive: Sequelize.BOOLEAN
}, { sequelize });
//Send streamer model to database to create table
streamer.sync({force: false}).then(() => {
    console.log('Synced to database successfully!');
}).catch(err => {
    console.error('an error occured while proforming this operation', err);
});


// Queries
// get the discord user id, twitchname, sitename, shards
const getUsers = (request, response) => {
        streamer.findAll().then(streamers => {
            response.status(200).json(streamers.map(s => JSON.parse(`{"userID": "${s.userID}", "twitchName": "${s.twitchName}", "siteName": "${s.siteName}", "shards": ${s.shards}}`)));
        }, err => {
            response.status(500).json({error: err, status: 'Internal Server Error'})
        })
}
// {where: {userID: request.query.userid}}|{where: {siteName: request.query.sitename}}
const getUser = (request, response) => {
    console.log(request.query)
    if (!request.query.userid && !request.query.sitename && !request.query.twitchname) response.status(200).json({error: 'You must provide a valid query string.'})
    if (request.query.userid || request.query.sitename || request.query.twitchname) {
        
        streamer.findAll({
            where: {
                [Op.or]: [
                    {userID: request.query.userid !== undefined ? request.query.userid : 'none'},
                    {siteName: request.query.sitename !== undefined ? request.query.sitename : 'none'},
                    {twitchName: request.query.twitchname !== undefined ? request.query.twitchname : 'none'}
                ]
            }
        }).then(streamers => {
            if (streamers[0] === undefined) response.status(404).json({error: 'Not found.'});
            else response.status(200).json(JSON.parse(`{"userID": "${streamers[0].userID}", "twitchName": "${streamers[0].twitchName}", "siteName": "${streamers[0].siteName}", "shards": ${streamers[0].shards}}`));
        }, err => {
            response.status(500).json({error: err, status: 'Internal Server Error'})
        })
    }
}

const createUser = (request, response) => {
    const { name, email } = request.body
  
    pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).send(`User added with ID: ${result.insertId}`)
    })
  }
  
const updateUser = (request, response) => {
const id = parseInt(request.params.id)
const { name, email } = request.body

pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
    if (error) {
        throw error
    }
    response.status(200).send(`User modified with ID: ${id}`)
    }
)
}

const deleteUser = (request, response) => {
const id = parseInt(request.params.id)

pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
    throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
})
}

module.exports = {
getUsers,
getUser,
createUser,
updateUser,
deleteUser,
}