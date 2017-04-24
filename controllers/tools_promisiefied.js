var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require("../mongo/db_connect");

require('dotenv').config();//to get environnement variable 

//verification connexion db
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(callback) {
    console.log('connection succeeded');
});

//main module to verify and confirm a consultation deployment request
var Promise = require('bluebird');
var ocv = Promise.promisifyAll(require('ogp-consultation-verification')(mongoose));
//importation of  model mongoose for consultation and tools
var consultation = require('../models/consultation');
var tools = require('../models/tools');
//generate unique id
var uuid = require('node-uuid');
//generate slug
var slugify = require('slugify');
//allow verifications and operations on email strings
var validator = require('validator');
//register client for api 
var unirest = require('unirest');
//sanitize data form
var sanitizeHtml = require('sanitize-html'); 
//execute shell
var exec =require('child_process').exec;

function PromiseError(message) {
  this.name = 'PromiseError';
  this.message = message;
  this.stack = (new Error()).stack;
}
PromiseError.prototype = Object.create(Error.prototype);
PromiseError.prototype.constructor = PromiseError;


//OCV configuration
ocv.configureAsync({
      persistentConsultationModel: consultation,
      expirationTime: 1200, // 20 minutes
      verificationURL: process.env.URLPLATFORM +'/confirmation/${URL}',
      emailFieldName: 'adminEmail',
      transportOptions: {
          service: 'Sendgrid',
          auth: {
            user: process.env.SENDGRIDUSER,
            pass: process.env.SENDGRIDPASS
          }
      },
      verifyMailOptions: {
          from: 'consultation.etalab.gouv.fr <ne-pas-repondre@consultation.etalab.gouv.fr>',
          subject: 'Confirmez votre demande de consultation',
          html: '<p>Merci de confirmer votre demande en cliquant sur  <a href="${URL}">ce lien</a>. Si cela ne fonctionne pas, ' +
            'copier et coller le lien suivant dans la barre d adresse de votre navigateur :</p><p>${URL}</p>',
          text: 'Merci de confirmer votre demande en cliquant sur {URL}'
      },
      confirmMailOptions: {
          from: 'consultation.etalab.gouv.fr <ne-pas-repondre@consultation.etalab.gouv.fr>',
          subject: 'Demande de consultation confirmée ! ',
          html: '<p>Votre demande de consultation a été confirmée. Le déploiement est en cours. Vous recevrez un e-mail avec des instructions dans quelques minutes.</p>',
          text: 'Votre demande de consultation a été confirmée. Le déploiement est en cours. Vous recevrez un e-mail avec des instructions dans quelques minutes.'
      }
})
.then(function(options) {
      console.log('configured: ' + (typeof options === 'object'));
      return ocv.generateTempConsultationModelAsync(consultation);
})
.then(function(tempConsultationModel) {
      console.log('generated temp consultation model: ' + (typeof tempConsultationModel === 'function'));
})
.catch(function(err) {
      console.log('ERROR!');
      console.log(err);
});

/* GET tool page. */
router.get('/tools/:name', function(req, res, next) {
//  console.log(req);
  var tool = req.params.name;
  //search tool in mongo
  tools.findOne({ name: tool}, function(err, t) {
      if (t === null) {
          next();
      } else {
          res.render('form',  t);
      }
  });
});

//POST new consultation : form validation, a consultation (with statut = requested is added to collection Consultations and mail is sent to asker
router.post('/insert', function(req, res, next) {
  //server side verification on email 
  var email = validator.normalizeEmail(req.body.adminEmail);
  var emailValid = validator.isEmail(email);
  var emailGouvFr = validator.matches(email, '\.gouv\.fr$');
  if (emailValid && !emailGouvFr)  { 
      return res.json({
          msg: 'Votre email n\'est pas autorisé pour déployer une consultation. Veuillez saisir un email terminant par ".gouv.fr"', 
          class:'alert-danger',
          title:'Attention ! ',
          type: req.body.type
      });
  } else {
    //if user want to register a consultation
    if (req.body.type === 'register') {
      var newConsult = new consultation({
          _id: uuid.v1(),//verifier si unique
          slug: sanitizeHtml(req.body.slug),//ne pas autoriser le point regex az09 - et verifier si unique (do a get request on provider api) 
          adminEmail: sanitizeHtml(email),
          name: sanitizeHtml(req.body.name), 
          adminName: sanitizeHtml(req.body.adminName),
          adminOrganizationName: sanitizeHtml(req.body.adminOrganizationName),
          adminPhone:sanitizeHtml(req.body.adminPhone),
          toolname: sanitizeHtml(req.body.toolName)
      });
      ocv.createTempConsultationAsync(newConsult) 
      .then(function(data) {
            console.log(data);
          var newTempConsultation = data;
          // new consultation created
          if (newTempConsultation) {
            var URL = newTempConsultation[ocv.options.URLFieldName];
            return ocv.sendVerificationEmailAsync(email, URL);
          } else {
            res.json({
              msg: 'Vous avez déjà une demande de consultation en cours de confirmation. Confirmez-la avant d\'en créer une autre.',
              title: 'Attention !',
              class: 'alert-danger'
            });
          }
      })
      .then(function(info){
            res.json({
                msg: 'Un email vient de vous être envoyé pour confirmer votre demande.',
                class: 'alert-success',
                title: 'Bravo ! ',
                info: info
            });
      })
      .then(function(err){
console.log("error"+ err);
          if (err.name !== 'PromiseError') {
            return res.status(404).send('FAILED');
          }
      });
    /* if type != register resend verification button was clicked*/
    } else {
        ocv.resendVerificationEmailAsync(email)     
        .then(function(consultationFound){
            if (userFound) {
                res.json({
                  msg: 'An email has been sent to you, yet again. Please check it to verify your account.'
                });
            } else {
                res.json({
                  msg: 'Your verification code has expired. Please sign up again.'
                });
            }
        })
        .catch(function() {
          return res.status(404).send('ERROR: resending verification email FAILED');
        });
    }
  }
});

// user accesses the link that is sent
router.get('/confirmation/:URL', function(req, res) {
  var url = req.params.URL;
  //perform actions in mongo collection Consultation when a consultation is confirmed, then send POST request to Provider API
  ocv.confirmTempConsultationAsync(url) 
  .then(function(consult){
    if (consult) {
        var obj;
        obj = {
          title: 'confirmation',
          msg: 'Bravo votre demande est confirmée. Le déploiement de votre consultation est cours. Vous recevrez un email dans quelques minutes avec les instructions pour commencer.'
        };
        //rendu html
        res.render('confirmation', obj);
        //adapt consult obj before sending to provider API
        var rename = require('rename-keys');
        var result = rename(consult.toJSON(), function(str) {
            return str.replace(/^id/, "requestIdentifier");
        });
        var deleteKey = require('key-del');
        result = deleteKey(result, ['status', 'url', 'createdAt']);

        //Select End Point and provider KEY 
        //1. get name of provider tool in collection and construct headers with api key and client.method post
        tools.findOne({ name: consult.toolname }, (err, t) => {
          if (t) {
            var args = {
                data: result, // data passed to REST method
                headers: { "X-Api-Key": t.apiKey, "Content-Type": "application/json" }  
            };
            //envoi API providers
            if (t.hosting !== 'etalab') {
              unirest.post(t.urlApi + '/instances')
              .headers(args.headers)
              .send(args.data)
              .end(function(response) {
                var httpstatus = response.status;
                //console.log(httpstatus);
                if (httpstatus === 201 || httpstatus === 202) {//synchrone and asynchrone cases
                //update mongo collection consultation with data returnes (url and status)
                   consultation.findById(args.data.requestIdentifier, function(err, consult) {
                       if (err) return res.send(500, {error: err});
                       var newstatus = response.body.status;
                       var newurl = response.body.url;
                       if (newstatus) consult.status = newstatus;//only for synchrone response
                       consult.url = newurl;  
                       //update data with url and status (which should be equal to "running"
                       consult.save();
                   });               
                }
             });
           } else {//hosting etalab
           //execute shell script to deploy on etalab cloud
           var cmd1 = process.env.APPPATH + '/ogptoolbox-platform-deployment-cloud/./deploy.sh "'+ args.data.name + '" "'+ args.data.adminEmail + '" "'+ t.name +'" "'+ args.data.adminName +'" "'+ args.data.slug +'"';
           var cmd2 = '/usr/bin/sudo' + process.env.APPPATH +'/ogptoolbox-platform-deployment-cloud/postinstall/add_A_bind_record.sh "'+ args.data.slug+'" ';
           var cmd3 = '/usr/bin/sudo -u ogptoolbox '+ process.env.APPPATH + '/ogptoolbox-platform-deployment-cloud/postinstall/' + t.name +'/./'+ t.name +'.sh "' + args.data.name + '" "'+ args.data.adminEmail +'" "'+args.data.adminName+'" "'+ args.data.slug+ '" ';
           exec(cmd1, function(error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
                if (stdout) {
                    //ip of the created vm on cloud
                    var ip = '"' + stdout + '"';
                    //concact cmd2 and ip to start 2e script
                    var commande = cmd2.concat(ip);
                    exec(commande, function(error, stdout, stderr) {
                        console.log('stdout2: ' + stdout);
                        console.log('stderr2: ' + stderr);
                        if (error !== null) {
                            console.log('exec error: ' + error);
                        }
                        var commande2 = cmd3.concat(ip);
                        exec(commande2, function(error, stdout, stderr) {
                            console.log('stdout3: ' + stdout);
                            console.log('stderr3: ' + stderr);
                            if (error !== null) {
                                console.log('exec error: ' + error);
                            }
                        });
                        
                    });
                }     
           }); 

           } //fin else etalab hosting    
	    } else {
                console.log('error');
          }
        });

    } else {
        //the consultation has already been confirmation
        return res.status(404).render('confirmation', {title:'Erreur : il semble que vous ayez déjà confirmé cette consultation.'});
    }
  });
});

module.exports = router;
