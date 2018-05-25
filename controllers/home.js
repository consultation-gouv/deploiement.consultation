const express = require('express'),
      router = express.Router();

//redirect to ogptoolbox collections site instead index

router.get('/', function(req, res) {
	res.statusCode = 302;
	res.setHeader("Location", 'https://consultation.etalab.gouv.fr');
	//res.setHeader("Location", 'https://ogptoolbox.org/fr/collections/1');
	res.end();
});

module.exports = router;

