require('dotenv').config();

const session = require('express-session');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const MongoStore = require('connect-mongo')(session);

const allowedDomains = ["publicboard.ca", "student.publicboard.ca"];

mongoose.connect('mongodb://localhost/vmcsc');
let db = mongoose.connection;

let schema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  discordId: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true
  }
});

db.once('open', function(){
  console.log('Connected to MongoDB');
})

db.on('error', function(err){
  console.log(err);
})

let discordUsers = mongoose.model('DiscordUser', schema);

passport.serializeUser(function(user, done) {
  done (null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new OIDCStrategy(
  {
    identityMetadata: `${process.env.OAUTH_AUTHORITY}${process.env.OAUTH_ID_METADATA}`,
    clientID: process.env.OAUTH_APP_ID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.OAUTH_REDIRECT_URI,
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.OAUTH_APP_PASSWORD,
    validateIssuer: false,
    passReqToCallback: false,
    scope: process.env.OAUTH_SCOPES.split(' ')
  },
  async function (iss, sub, profile, accessToken, refreshToken, params, done) {
    return done(null, {profile, accessToken});
  }
));

var app = express();

app.use(session({
  secret: 'your_secret_value_here',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', async function (req, res, next) {
  try{
    if (req.user){
      const name = req.user.profile._json.name;
      const email = req.user.profile._json.preferred_username;
      const domain = email.split("@")[1];
      const discordId = req.session.discordId;

      if(!allowedDomains.includes(domain)){
        next(createError("Invalid Email Address"));
      }
      else if(await discordUsers.find({email: email}).length > 0){
        next(createError("Account already assigned"));
      }
      else if(discordId === undefined){
        next(createError("Invalid Discord ID"));
      }
      else{
        await discordUsers.create({
          name: name,
          discordId: discordId,
          email: email
        });
        req.session.destroy(function(err){
          req.logout();
        });
        res.status(200).send("Verified successfully, you may close this tab.");
      }
    }
    else{
      next(createError("Not logged in"));
    }
  }
  catch(err){
    next(createError(err));
  }
});

app.get('/login/:discordId',
  async function  (req, res, next) {
    try{
      const queryDb = await discordUsers.find({discordId: req.params.discordId});
      if(queryDb.length > 0) next(createError("Already verified"));
      else{
        req.session.discordId = req.params.discordId;
        passport.authenticate('azuread-openidconnect',
          {
            response: res,
            prompt: 'login',
            failureRedirect: '/',
            successRedirect: '/'
          }
        )(req,res,next);
      }
    }
    catch(err){
      next(createError(err));
    }
  }
);

app.post('/callback',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
        response: res,
        failureRedirect: '/',
        successRedirect: '/'
      }
    )(req,res,next);
  }
);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  req.session.destroy(function(err){
    req.logout();
  });

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
