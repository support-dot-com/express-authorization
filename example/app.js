/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var authorization = require('../');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

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
