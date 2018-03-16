var express = require('express');
var session = require('express-session');
var http = require('http');
var path = require('path');
var authorization = require('../');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// setup permission middleware
var ensureNounVerb = authorization.ensureRequest.isPermitted('noun:verb');

// Define Routes
app.get('/', function (req, res) {
  res.render('home', { authenticated: req.session.user ? true : false });
});

app.get('/login', function (req, res) {
  res.render('login', { });
});

app.post('/login', function (req, res) {
  req.session.user = {
    username: "root",
    permissions: [ 'noun:*' ]
  };
  res.redirect('/');
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.get('/assert', ensureNounVerb, function (req, res) {
  res.render('assert', { });
});

// Start Server
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
