"use strict";
require('dotenv').config();
let express = require('express');
let path = require('path');
// let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let session = require('express-session');
let passport = require('passport');
let TwitterStrategy = require('passport-twitter').Strategy;

let index = require('./routes/index');
let users = require('./routes/users');

// let app = require('express')();
let app = express();
// let http = require('http');
// let server = http.createServer(app);
/*
let server = http.createServer(function (req, res) {
   res.writeHead(200, {'Content-Type':'text/html'});
   res.end('server connected');
});
*/
// let io = require('socket.io').listen(server);
// let io = require('socket.io').listen(server);
// app.io = io;
// server.listen(3000);//8888番ポートで起動

/*
io.use(function(socket, next){
   console.log(socket);
   next();
});
*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// session configuration
let sessionMiddleware = session({
   secret: 'secret',
   resave: false,
   saveUninitialized: false,
   cookie: {
      httpOnly: true,
      secure: false,
      maxage: 1000 * 60 * 30
   }
});
app.session = sessionMiddleware;
app.use(sessionMiddleware);

// passport configuration
passport.serializeUser( function(user, done) {
   done(null, user);
});
passport.deserializeUser( function(user, done) {
   done(null, user) ;
});
passport.use(new TwitterStrategy(
   {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "http://localhost:3000/callback"
   }, function (token, tokenSecret, profile, done) {

      profile.twitter_token = token;
      profile.twitter_token_secret = tokenSecret;

      return done(null, profile);

   }
));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/store', express.static(path.join(__dirname, 'store')));
app.use('/javascripts/packery.js', express.static(path.join(__dirname, 'node_modules', 'packery', 'dist', 'packery.pkgd.js')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
// app.use('/users', users);

app.get('/test', function (req, res) {
   console.log(req);
   console.log(res);
   res.send('test');
});

app.get('/auth', passport.authenticate('twitter'));
app.get('/callback', passport.authenticate('twitter', {
   successRedirect: '/', failureRedirect: '/'
}));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
   let err = new Error('Not Found');
   err.status = 404;
   next(err);
});

// error handler
app.use(function (err, req, res, next) {
   // set locals, only providing error in development
   res.locals.message = err.message;
   res.locals.error = req.app.get('env') === 'development' ? err : {};

   // render the error page
   res.status(err.status || 500);
   res.render('error');
});

module.exports = app;
