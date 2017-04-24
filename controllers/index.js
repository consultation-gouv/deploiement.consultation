const express = require('express'),
      router = express.Router();

/* GET tool page. */
router.get('/outils/:name', require('./tools'));
/* Verify if your email is authorized */
router.post('/verify', require('./verifydomains'));
//POST new consultation : form validation, a consultation (with statut = requested is added to collection Consultations and mail is sent to asker
router.post('/insert', require('./consultations'));
// confirm consultation deployment
router.get('/confirmation/:URL', require('./consultations'));

module.exports = router;
