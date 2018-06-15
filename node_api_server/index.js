#!/usr/bin/env node

'use strict';

var app = require('connect')();
var http = require('http');
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var serverPort = 8080;
//need to access database to get providers tools keys
var mongoose = require("../mongo/db_connect");
var tools = require('../models/tools');

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers'
};

// The Swagger document that specify the platform API 
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());
  //security
  app.use(middleware.swaggerSecurity({
    api_key: function (req, def, scopes, callback) {
      var sentkey =  req.headers['x-api-key'] || null;
      if (sentkey === null) {
        callback({"message":"access denied!","statusCode":401});
      } 
      else {
        //call mongo collection to see if provider key exists
        tools.findOne({ api_key_patch: sentkey }, (err, t) => {
            if (t) {
              callback();//the key sent matches with provider key in mongo tools collection, proceed :)
            } 
            else {
              callback({"message":"access denied!","statusCode":403});
            }
        });
      }
    }//end function api_key
  }));

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  // Start the server
  var server = http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });

});

