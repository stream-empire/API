const dotenv = require('dotenv');
dotenv.config()
const discordClientID = process.env.DISCORDCLIENTID;
const discordSecret = process.env.DISCORDSECRET;
const twitchClientID = process.env.TWITCHCLIENTID;
const twitchSecret = process.env.TWITCHSECRET;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const request = require('request');
const db = require('./queries');
const session = require('client-sessions');
const passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var DiscordStrategy = require('passport-discord').Strategy;

app.use(express.static('root'))

app.use(session({
    cookieName: 'session',
    secret: 'x+#RK}[2b4j=)%Pc',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    cookie: {
        httpOnly: true,
        path: '/'
    }
  }));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
    var options = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Client-ID': twitchClientID,
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Authorization': 'Bearer ' + accessToken
        }
    };
  
    request(options, function (error, response, body) {
        if (response && response.statusCode == 200) {
            done(null, JSON.parse(body).data[0]);
        } else {
            done(JSON.parse(body));
        }
    });
}
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new DiscordStrategy({
    clientID: discordClientID,
    clientSecret: discordSecret,
    callbackURL: 'http://api.streamempires.live/auth/discord/callback'
},
function(accessToken, refreshToken, profile, cb) {
    cb(null, profile);
}));

passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: twitchClientID,
    clientSecret: twitchSecret,
    callbackURL: 'http://api.streamempires.live/auth/twitch/callback',
    state: true
  },
  function(accessToken, refreshToken, profile, done) {
    done(null, profile);
  }
));

// Endpoints
app.get('/', (request, response) => {
    response.redirect('/login/');
})
app.get('/users/getall/', db.getUsers);
app.get('/user/get/', db.getUser);
app.post('/users/create/', db.createUser);
app.put('/user/update/', db.updateUser);
app.delete('/user/delete/', db.deleteUser);
app.get('/user/logout/', db.logoutUser);
app.post('/user/login/', db.loginUser);
app.put('/users/shards/give/', db.giveShards);
app.put('/users/shards/take/', db.takeShards);
app.get('/user/', db.getSelf);
app.get('/auth/discord', (req, res) => {
    res.redirect('https://discordapp.com/oauth2/authorize?client_id=565660436511457281&redirect_uri=http%3A%2F%2Fapi.streamempires.live%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify')
});
app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), function(req, res) {
    db.authDiscordCall(req, res);
});
app.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user_read' }));
app.get('/auth/twitch/callback', passport.authenticate('twitch', {
    failureRedirect: '/'
}), function(req, res) {
    db.authTwitchCall(req, res);
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})
