
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , userAPI = require('./models/user')
  , tweetProcess = require('./routes/process')
  , session = require('./routes/session')
  , http = require('http')
  , flash = require('connect-flash')
  , connect = require('connect')
  , fs = require('fs')
  , path = require('path');

var app = express();

var secret = 'SessionSecret';
var sessionKey = 'express.sid';
var store = new connect.session.MemoryStore();
var cookieParser = express.cookieParser(secret);

var settings;
if (fs.existsSync('./settings.json')) {
    settings = require('./settings');
} else {
    settings = {};
}

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(cookieParser);
app.use(express.session({store: store, key: sessionKey}));
app.use(flash());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.locals.userAPI = userAPI;
app.locals.settings = settings;
app.locals.tweetProcess = tweetProcess;

app.get('/', session.requiresLogin, routes.index);
app.post('/', session.requiresLogin, routes.saveSettings);
app.get('/settings.json', session.requiresLogin, routes.settings);
app.get('/tweets/latest.json', session.requiresLogin, tweetProcess.latestTweets);
app.get('/login', user.login);
app.post('/login', user.processLogin);
app.post('/logout', user.logout);

//Process control stuff
app.post('/process/restart', session.requiresLogin, tweetProcess.restart);
app.post('/process/stop', session.requiresLogin, tweetProcess.stop);
app.post('/process/start', session.requiresLogin, tweetProcess.start);
app.get('/process/status.json', session.requiresLogin, tweetProcess.status);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//set up socket
var io = require('socket.io').listen(server);
tweetProcess.initSocket(io);

io.configure(function() {
    io.set('authorization', function(handshake, cb) {   
        handshake.sessionId = cookieParser(handshake, {}, function(err) {
            if (err) return cb(err, false);
            store.get(handshake.signedCookies[sessionKey], function(err, session) {
                if(err) return cb(err, false);
                if (!session) return cb(null, false);
                handshake.session = session;
                return cb(null, true);
            });
        });
    });
});

io.sockets.on('connection', function(socket) {
    socket.session = socket.handshake.session;
});
