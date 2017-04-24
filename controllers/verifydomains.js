const express = require('express'),
      router = express.Router();

//sanitize data form
const sanitizeHtml = require('sanitize-html');
//allow verifications and operations on email strings
const validator = require('validator');

const verify = function (data, callback) {
  if (data) {
	  const email = validator.normalizeEmail(data);
	  const emailValid = validator.isEmail(email);
	  const domainArray = [".(gouv)\.(fr)$", "(octo)\.(com)$"];
	  const re = new RegExp(domainArray.join("|"), "i");
      const obj = {};
      if (emailValid && !email.match(re) )  {
		  obj.success = false;
		  obj.msg  = 'Votre email n\'est pas autorisé pour déployer une consultation.';
	  } else {
	  	  obj.success = true;
	  }
      callback(obj);
  }
}

router.post('/verify', function(req, res, next) {
 verify(req.body.adminEmail, function(data) {
	 return res.json(data);
 });
});

module.exports = router;
