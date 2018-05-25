const express = require('express'),
      router = express.Router();

const tools = require('../models/tools');

/* GET tool page. */
//router.get('/outils/:name', function(req, res, next) {
//});

router.get('/outil/:name', function(req, res, next) {
//router.get('/tools/:name', function(req, res, next) {
  //search tool in mongodb tools collection
  tools.findTool(req.params.name, function(err, tool) {
          //display tool data with deploy view
          res.render('deploy',  {includeDeploy: true, tool: tool});
  });
});

module.exports = router;
