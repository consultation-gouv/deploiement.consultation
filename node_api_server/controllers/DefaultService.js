'use strict';

var mongoose = require('../../mongo/db_connect');
var consultation = require('../../models/consultation');
var tools = require('../../models/tools');

exports.instanceRequestsGET = function(args, res, next) {
  /**
   * no parameters expected in the args except the API-KEY 
  **/
  var sentkey =  args.headers['x-api-key'] || null;
  if (sentkey === null) {
        callback({"message":"access denied!","statusCode":401});
  }
  else {
        //call mongo tool collection to see if provider key exists
        tools.findOne({ api_key_patch: sentkey }, (err, tool) => {
          var toolname = tool.name;
          //return consultations done with this tool
	  consultation.find({toolname: toolname}).exec(function(err, consults) {
	      if (err) {
		  return res.send(err);
	      }
              var results = {};
	      results['application/json'] = {
		  "items" : consults 
	      };
	      res.setHeader('Content-Type', 'application/json');
	      res.end(JSON.stringify(results[Object.keys(results)[0]]) || {}, null, 2);
	  });
        });   
  }
}

exports.instanceRequestsIdPATCH = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (UUID)
  * payload (InstanceEditionPayload)
  **/
  consultation.findById(args.id.value, function(err, consult) {
    if (err) return res.send(500, { error: err });
    //get value returned by provider
    var value = args.payload.value;
    consult.status = value.status; 
    if (value.metadata) consult.metadata = value.metadata;
    consult.save(function(err) {
      if (err) return res.send(500, {error: err});
      var results = {};
      results['application/json'] = consult; 
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results[Object.keys(results)[0]] || {}, null, 2));
    });
  });
}
