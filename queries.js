//Credentials
const dotenv = require('dotenv');
dotenv.config()
const serverIp = process.env.SERVERIP;
const serverUser = process.env.SERVERUSERNAME;
const serverPass = process.env.SERVERPASSWORD;
const serverDb = process.env.SERVERDB;
const shardKey = process.env.SHARDKEY;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(`postgres://${serverUser}:${serverPass}@${serverIp}:5432/${serverDb}`, {logging: false});
const Op = Sequelize.Op;
const bcrypt = require('bcrypt');
//this sets up the streamer data table
class streamer extends Sequelize.Model {};
streamer.init({
    discordId: {type: Sequelize.STRING, unique: true},
    twitchId: {type: Sequelize.STRING, unique: true},
    twitchName: {type: Sequelize.STRING, unique: true},
    siteName: {type: Sequelize.STRING, unique: true},
    email: {type: Sequelize.STRING, unique: true},
    discordName: Sequelize.STRING,
    admin: Sequelize.BOOLEAN,
    password: Sequelize.STRING,
    shards: Sequelize.INTEGER,
    verified: Sequelize.BOOLEAN,
    thumbnail: Sequelize.STRING,
    isLive: Sequelize.BOOLEAN,
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
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
            response.status(200).json(streamers.map(s => JSON.parse(`{"discordName": ${s.discordName ? `"${s.discordName}"` : null}, "discordId": ${s.discordId ? `"${s.discordId}"` : null}, "twitchName": ${s.twitchName ? `"${s.twitchName}"` : null}, "twitchId": ${s.twitchId ? `"${s.twitchId}"` : null}, "siteName": "${s.siteName}", "shards": ${s.shards}, "thumbnail": ${s.thumbnail ? `"${s.thumbnail}"` : null}}`)));
        }, err => {
            response.status(500).json({error: err, status: 'Internal Server Error'})
        })
}
// {where: {discordId: request.query.discordId}}|{where: {siteName: request.query.sitename}}
const getUser = (request, response) => {
    if (!request.query.discordid && !request.query.sitename && !request.query.twitchname) response.status(200).json({error: 'You must provide a valid query string.'})
    if (request.query.discordid || request.query.sitename || request.query.twitchname) {
        
        streamer.findAll({
            where: {
                [Op.or]: [
                    {discordId: request.query.discordid !== undefined ? request.query.discordid : 'none'},
                    {siteName: request.query.sitename !== undefined ? request.query.sitename : 'none'},
                    {twitchName: request.query.twitchname !== undefined ? request.query.twitchname : 'none'}
                ]
            }
        }).then(streamers => {
            if (streamers[0] === undefined) response.status(404).json({error: 'Not found'});
            else response.status(200).json(JSON.parse(`{"discordName": ${streamers[0].discordName ? `"${streamers[0].discordName}"` : null}, "discordId": ${streamers[0].discordId ? `"${streamers[0].discordId}"` : null}, "twitchName": ${streamers[0].twitchName ? `"${streamers[0].twitchName}"` : null}, "twitchId": ${streamers[0].twitchId ? `"${streamers[0].twitchId}"` : null}, "siteName": "${streamers[0].siteName}", "shards": ${streamers[0].shards}, "thumbnail": ${streamers[0].thumbnail ? `"${streamers[0].thumbnail}"` : null}}`));
        }, err => {
            response.status(500).json({error: err, status: 'Internal Server Error'})
        })
    }
}

const createUser = (request, response) => {
    var { name, email, password } = request.body;
    name = name.toLowerCase();
    if (!name || !email || !password) {response.status(200).json({error: 'Incorrect data sent'}); return;}
    streamer.findAll({
        where: {
            [Op.or]: [
                {siteName: name !== undefined ? name : 'none'},
                {email: email !== undefined ? email : 'none'}
            ]
        }
    }).then(streamers => {
        if (streamers[0] === undefined) {
            var now = new Date(Date.now());
            bcrypt.hash(password, 10).then(hashedPass => {
                streamer.create({siteName: name, email: email, verified: false, createdAt: now, updatedAt: now, password: hashedPass, shards: 0}).then(newStreamer => {
                    request.session.user = newStreamer;
                    delete request.session.user.password;
                    response.status(201).json(newStreamer);
                });
            }, err => {
                response.status(500).json({error: err, status: 'Internal Server Error'});
            });
        }else {
            response.status(200).json({error: 'There is already a user with this username or email'});
        }
    }).catch(err => {
        response.status(500).json({error: err, status: 'Internal Server Error'});
    })
}
  
const updateUser = (request, response) => {
    var { email, name, discordid, twitchname, password, newpassword } = request.body;
    name = name.toLowerCase();
    if (!password) {response.status(200).json({error: 'Incorrect data sent'}); return;}
    if (!request.session.user) {response.status(401).json({error: 'Not signed in'}); return;}
    streamer.findAll({
        where: {
            [Op.or]: [
                {siteName: request.session.user.siteName},
                {email: request.session.user.email}
            ]
        }
    }).then(streamers => {
        if (streamers[0] !== undefined) {
            var now = new Date(Date.now());
            bcrypt.compare(password, streamers[0].password).then(match => {
                if (match) {
                    bcrypt.hash(newpassword ? newpassword : password, 10).then(hashedPass => {
                        streamers[0].update({email: email !== undefined ? email : streamers[0].email, siteName: name !== undefined ? name : streamers[0].siteName, discordId: discordid  !== undefined ? discordid : streamers[0].discordId, twitchName: twitchname !== undefined ? twitchname : streamers[0].twitchName, updatedAt: now, password: hashedPass, shards: 0}).then(updatedStreamer => {
                            request.session.user = updatedStreamer;
                            delete request.session.user.password;
                            response.status(200).json(updatedStreamer);
                        });
                    }, err => {
                        response.status(500).json({error: err, status: 'Internal Server Error'});
                    });
                }else {
                    response.status(401).json({error: 'Incorrect credentials'})
                }
            }, err => {
                response.status(500).json({error: err, status: 'Internal Server Error'});
            });
        }else {
            response.status(401).json({error: 'This user does not exist'});
        }
    }).catch(err => {
        response.status(500).json({error: err, status: 'Internal Server Error'});
    })
}

const deleteUser = (request, response) => {
    var { password } = request.body;
    if (!password) {response.status(200).json({error: 'Incorrect data sent'}); return;}
    if (!request.session.user) {response.status(401).json({error: 'Not signed in'}); return;}
    streamer.findAll({
        where: {
            [Op.or]: [
                {siteName: request.session.user.siteName}
            ]
        }
    }).then(streamers => {
        if (streamers[0] !== undefined) {
            bcrypt.compare(password, streamers[0].password).then(match => {
                if (match) {
                    streamers[0].destroy().then(() => {
                        request.session.reset();
                        response.status(200).json({success: true});
                    });
                }else {
                    response.status(401).json({error: 'Incorrect credentials'})
                }
            }, err => {
                response.status(500).json({error: err, status: 'Internal Server Error'});
            });
        }else {
            response.status(401).json({error: 'This user does not exist'});
        }
    }).catch(err => {
        response.status(500).json({error: err, status: 'Internal Server Error'});
    })
}
const logoutUser = (request, response) => {
    if (!request.session.user) response.status(401).json({error: 'Not signed in'});
    request.session.reset();
    response.status(200).json({success: true});
}

const loginUser = (request, response) => {
    var { name, password } = request.body
    name = name.toLowerCase();
    if (!name || !password) {response.status(200).json({error: 'Incorrect data sent'}); return;}
    streamer.findAll({
        where: {
            [Op.or]: [
                {siteName: name},
                {email: name}
            ]
        }
    }).then(streamers => {
        if (streamers[0] !== undefined) {
            bcrypt.compare(password, streamers[0].password).then(match => {
                if (match) {
                    request.session.user = streamers[0];
                    delete request.session.user.password;
                    response.status(200).json({success: true});
                }else {
                    response.status(401).json({error: 'Incorrect credentials'})
                }
            }, err => {
                response.status(500).json({error: err, status: 'Internal Server Error'});
            });
        }else {
            response.status(404).json({error: 'This user does not exist'});
        }
    }).catch(err => {
        response.status(500).json({error: err, status: 'Internal Server Error'});
    })
}

const getSelf = (request, response) => {
    if (!request.session.user) {response.status(401).json({error: 'Not signed in'}); return;}
    if (request.session.user) {
        response.redirect(`/user/get/?sitename=${request.session.user.siteName}`)
    }
}

const authDiscordCall = (request, response) => {
    if (!request.session.user) {response.status(401).json({error: 'Not signed in'}); return;}
    streamer.findAll({
        where: {
            [Op.or]: [
                {siteName: request.session.user.siteName},
                {email: request.session.user.email}
            ]
        }
    }).then(streamers => {
        if (streamers[0] !== undefined) {
            var now = new Date(Date.now());
            streamers[0].update({discordName:request.session.passport.user.username, discordId: request.session.passport.user.id, updatedAt: now}).then(updatedStreamer => {
                request.session.user = updatedStreamer;
                response.redirect('/auth/complete/discord/'); //replace this with where ever the finished sites auth complete will be
            }).catch(err => {
                if (err.errors[0].validatorKey === 'not_unique') {
                    response.status(409).json({error: 'This Discord account is already linked to a Stream Empires account.'})
                }else {
                    response.status(500).json({error: err, status: 'Internal Server Error'});
                }
            });
        }else {
            response.status(401).json({error: 'This user does not exist'});
        }
    }).catch(err => {
        response.status(500).json({error: err, status: 'Internal Server Error'});
    })
}

const authTwitchCall = (request, response) => {
    if (!request.session.user) response.status(401).json({error: 'Not signed in'});
    streamer.findAll({
        where: {
            [Op.or]: [
                {siteName: request.session.user.siteName},
                {email: request.session.user.email}
            ]
        }
    }).then(streamers => {
        if (streamers[0] !== undefined) {
            var now = new Date(Date.now());
            streamers[0].update({twitchName: request.session.passport.user.login, twitchId: request.session.passport.user.id, updatedAt: now, thumbnail: request.session.passport.user.profile_image_url}).then(updatedStreamer => {
                request.session.user = updatedStreamer;
                response.redirect('/auth/complete/twitch/'); //replace this with where ever the finished sites auth complete will be
            }).catch(err => {
                if (err.errors[0].validatorKey === 'not_unique') {
                    response.status(409).json({error: 'This Twitch account is already linked to a Stream Empires account.'})
                }else {
                    response.status(500).json({error: err, status: 'Internal Server Error'});
                }
            });;
        }else {
            response.status(401).json({error: 'This user does not exist'});
        }
    }).catch(err => {
        response.status(500).json({error: err, status: 'Internal Server Error'});
    })
}

const giveShards = (request, response) => {
    var { name, shards, authorization } = request.body;
    name = name.toLowerCase();
    shards = parseInt(shards);
    streamer.findAll({
        where: {
            [Op.or]: [
                {discordId: name},
                {siteName: name},
                {twitchName: name}
            ]
        }
    }).then(streamers => {
        if (streamers[0] === undefined) response.status(404).json({error: 'Not found'});
        else {
            if (authorization !== shardKey) response.status(401).json({error: 'Invalid authorization'});
            else {
                streamers[0].update({shards: streamers[0].shards + shards}).then(() => {
                    response.status(200).json(JSON.parse(`{"discordName": ${streamers[0].discordName ? `"${streamers[0].discordName}"` : null}, "discordId": ${streamers[0].discordId ? `"${streamers[0].discordId}"` : null}, "twitchName": ${streamers[0].twitchName ? `"${streamers[0].twitchName}"` : null}, "twitchId": ${streamers[0].twitchId ? `"${streamers[0].twitchId}"` : null}, "siteName": "${streamers[0].siteName}", "shards": ${streamers[0].shards}, "thumbnail": ${streamers[0].thumbnail ? `"${streamers[0].thumbnail}"` : null}}`));
                }).catch(err => {
                    response.status(500).json({error: err, status: 'Internal Server Error'})
                })
            }
        }
    }, err => {
        response.status(500).json({error: err, status: 'Internal Server Error'})
    })
}

const takeShards = (request, response) => {
    var { name, shards, authorization } = request.body;
    name = name.toLowerCase();
    shards = parseInt(shards);
    streamer.findAll({
        where: {
            [Op.or]: [
                {discordId: name},
                {siteName: name},
                {twitchName: name}
            ]
        }
    }).then(streamers => {
        if (streamers[0] === undefined) response.status(404).json({error: 'Not found'});
        else {
            if (authorization !== shardKey) response.status(401).json({error: 'Invalid authorization'});
            else {
                streamers[0].update({shards: streamers[0].shards - shards}).then(() => {
                    response.status(200).json(JSON.parse(`{"discordName": ${streamers[0].discordName ? `"${streamers[0].discordName}"` : null}, "discordId": ${streamers[0].discordId ? `"${streamers[0].discordId}"` : null}, "twitchName": ${streamers[0].twitchName ? `"${streamers[0].twitchName}"` : null}, "twitchId": ${streamers[0].twitchId ? `"${streamers[0].twitchId}"` : null}, "siteName": "${streamers[0].siteName}", "shards": ${streamers[0].shards}, "thumbnail": ${streamers[0].thumbnail ? `"${streamers[0].thumbnail}"` : null}}`));
                }).catch(err => {
                    response.status(500).json({error: err, status: 'Internal Server Error'})
                })
            }
        }
    }, err => {
        response.status(500).json({error: err, status: 'Internal Server Error'})
    })
}

module.exports = {
getUsers,
getUser,
createUser,
updateUser,
deleteUser,
logoutUser,
loginUser,
getSelf,
authDiscordCall,
authTwitchCall,
giveShards,
takeShards
}