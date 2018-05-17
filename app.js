'use strict';

/*
 * 
 *
 * MIT Licensed
 */

/**
 * Module dependencies
 */

require('dotenv').config();//to get environnement variable 

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const stylus = require('stylus');
const helmet = require('helmet');
const mongoose = require('mongoose');                                      

const port = process.env.PORT || 3000; 
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing y   our favicon in /public
//app.use(favicon(path.join(__dirname,  'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/modules', express.static(__dirname + '/node_modules'));

app.use(require('./controllers'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(helmet());

module.exports = app;


connect()
  .on('error', console.log)
  .on('disconnected', connect)
  //.once('open', listen) does not work with nodemon
  ;

function listen () {
  if (app.get('env') === 'test') return;
  app.listen(port);
  console.log('Express app started on port ' + port);
}

function connect () {
  return mongoose.connect('mongodb://' + process.env.MONGOUSER+ ':' + process.env.MONGOPASSWD+'@' + process.env.MONGOHOST+':27017/db_deploy').connection; 
}
