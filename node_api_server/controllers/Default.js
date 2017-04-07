'use strict';

var url = require('url');


var Default = require('./DefaultService');

//to implement later : see how to restrict access with provider api token
module.exports.instanceRequestsGET = function instanceRequestsGET (req, res, next) {
  Default.instanceRequestsGET(req, res, next);
};


module.exports.instanceRequestsIdPATCH = function instanceRequestsIdPATCH (req, res, next) {
  Default.instanceRequestsIdPATCH(req.swagger.params, res, next);
};
