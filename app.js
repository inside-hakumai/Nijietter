"use strict";
require('dotenv').config();

const express         = require('express');
const path            = require('path');
// const favicon      = require('serve-favicon');
const logger          = require('morgan');
const cookieParser    = require('cookie-parser');
const bodyParser      = require('body-parser');
const session         = require('express-session');
const passport        = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;

const index           = require('./routes/index');
const app = express();

/**
 * viewエンジンの設定
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/**
 * セッションの設定
 */
const sessionMiddleware = session({
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

/**
 * passportの設定
 */
passport.serializeUser((user, done) => {
   done(null, user);
});
passport.deserializeUser((user, done) => {
   done(null, user) ;
});
passport.use(new TwitterStrategy(
   {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.DEPLOY_URL + "/callback"
   }, (token, tokenSecret, profile, done) => {
      profile.twitter_token = token;
      profile.twitter_token_secret = tokenSecret;
      return done(null, profile);
   }
));

/**
 * その他各種設定
 */
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

/**
 * ルーティング設定
 */
app.use('/', index);
app.get('/auth', passport.authenticate('twitter'));
app.get('/callback', passport.authenticate('twitter', {
   successRedirect: '/', failureRedirect: '/'
}));

/**
 * 404エラーを送信
 */
app.use((req, res, next) => {
   const err = new Error('Not Found');
   err.status = 404;
   next(err);
});

/**
 * エラーハンドリング
 */
app.use((err, req, res, next) => {
   // set locals, only providing error in development
   res.locals.message = err.message;
   res.locals.error = req.app.get('env') === 'development' ? err : {};

   // render the error page
   res.status(err.status || 500);
   res.render('error');
});

module.exports = app;
