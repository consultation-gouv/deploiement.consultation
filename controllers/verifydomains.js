const express = require('express'),
      router = express.Router();

const verif = require('../helpers/verification')();

router.post('/verify', function(req, res, next) {
 verif.verify(req.body.adminEmail, function(data) {
	 return res.status(data.status).json(data);
 });
});

module.exports = router;
