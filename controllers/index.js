const express = require('express'),
      router = express.Router();

//default home page
router.get('/', require('./home'));

/* GET tool page. */
router.get('/outil/:name', require('./tools'));
//router.get('/tools/:name', require('./tools'));

/* Verify if your email is authorized */
router.post('/verify', require('./verifydomains'));

//POST new consultation : form validation, a consultation (with statut = requested is added to collection Consultations and mail is sent to asker
router.post('/insert', require('./consultations'));

// confirm consultation deployment
router.get('/confirmation/:URL', require('./consultations'));


module.exports = router;
