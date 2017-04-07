const express = require('express'),
    router = express.Router(),
    nodemailer = require('nodemailer'),
    mongoose = require("../mongo/db_connect");

require('dotenv').config();//to get environnement variable 

//verification connexion db
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(callback) {
    console.log('connection succeeded');
});

//main module to verify and confirm a consultation deployment request
const ocv = require('ogp-consultation-verification')(mongoose);
//importation of  model mongoose for consultation and tools
const consultation = require('../models/consultation');
const tools = require('../models/tools');
//generate unique id
const uuid = require('node-uuid');
//generate slug
const slugify = require('slugify');
//allow verifications and operations on email strings
const validator = require('validator');
//register client for api 
const unirest = require('unirest');
//sanitize data form
const sanitizeHtml = require('sanitize-html');
//execute shell
const exec = require('child_process').exec;

//generate temp consultation collection Model
ocv.generateTempConsultationModel(consultation, function(err, tempConsultationModel) {
      if (err) {
         console.log(err);
         return;
      }
      console.log('generated temp consultation model: ' + (typeof tempConsultationModel === 'function'));
});

//OCV configuration
ocv.configure({
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
}, function(err, options) {
      if (err) {
              console.log(err);
              return;
      }
      console.log('configured: ' + (typeof options === 'object'));
});


/* GET tool page. */
router.get('/outils/:name', function(req, res, next) {
  const tool = req.params.name;
  //search tool in mongo
  tools.findOne({ name: tool}, function(err, t) {
      console.log(t)
      if (t === null) {
          next();
      } else {
          res.render('deploy',  {includeDeploy: true, tool: t});
      }
  });
});

//POST new consultation : form validation, a consultation (with statut = requested is added to collection Consultations and mail is sent to asker
router.post('/insert', function(req, res, next) {
  //server side verification on email 
  const email = validator.normalizeEmail(req.body.adminEmail);
  const emailValid = validator.isEmail(email);
  const domainArray = [".(gouv)\.(fr)$", "(octo)\.(com)$"];
  const re = new RegExp(domainArray.join("|"), "i");
  if (emailValid && !email.match(re) )  { 
      return res.json({
          msg: 'Votre email n\'est pas autorisé pour déployer une consultation. Veuillez saisir un email terminant par ".gouv.fr"', 
          class:'alert-danger',
          title:'Attention ! ',
          type: req.body.type
      });
  } 
  else {
    //if user want to register a consultation
    if (req.body.type === 'register') {
      const newConsult = new consultation({
          _id: uuid.v1(),//verifier si unique
          slug: sanitizeHtml(req.body.slug), 
          adminEmail: sanitizeHtml(email),
          name: sanitizeHtml(req.body.name), 
          adminName: sanitizeHtml(req.body.adminName),
          adminOrganizationName: sanitizeHtml(req.body.adminOrganizationName),
          adminPhone:sanitizeHtml(req.body.adminPhone),
          toolname: sanitizeHtml(req.body.toolName)
      });

      ocv.createTempConsultation(newConsult, function(err, existingPersistentConsultation, newTempConsultation) {
          if (err) {
           return res.status(404).send('ERROR: creating temp consultation FAILED');
          }

          // new consultation created
          if (newTempConsultation) {
            const URL = newTempConsultation[ocv.options.URLFieldName];
            //an email is sent to confirm deployment
            ocv.sendVerificationEmail(email, URL, function(err, info) {
              if (err) {
                return res.status(404).send('ERROR: sending verification email FAILED');
              }
              res.json({
                msg: 'Un email vient de vous être envoyé pour confirmer votre demande.',
                class: 'alert-success',
                title: 'Bravo ! ',
                info: info
              });
            });
          // Consultation already exists in temporary collection!
          } else {
            res.json({
              msg: 'Vous avez déjà une demande de consultation en cours de confirmation. Confirmez-la avant d\'en créer une autre.',
              title: 'Attention !',
              class: 'alert-danger'
            });
          }
      });    
    /* if type != register resend verification button was clicked*/
    } else {
        ocv.resendVerificationEmail(email, function(err, userFound) {
          if (err) {
            return res.status(404).send('ERROR: resending verification email FAILED');
          }
          if (userFound) {
            res.json({
              msg: 'Une demande de confirmation vous a à nouveau été envoyée par email.',
              title: 'Bravo ! ',
              class: 'alert-success'
            });
         } else {
            res.json({
              msg: 'Votre code de vérification a expiré. Merci de soumettre à nouveau votre demande.',
              title: 'Attention ! ',
              class: 'alert-danger'
            });
         }
    });
  }
 }

});


// user accesses the link that is sent
router.get('/confirmation/:URL', function(req, res) {
  const url = req.params.URL;
  //perform actions in mongo collection Consultation when a consultation is confirmed, then send POST request to Provider API
  ocv.confirmTempConsultation(url, function(err, consult) {
    //if consultation was confirmed in database
    if (consult) {
        //adapt consult object before sending to provider API
        const rename = require('rename-keys');
        let result = rename(consult.toJSON(), function(str) {
            return str.replace(/^id/, "requestIdentifier");
        });
        const deleteKey = require('key-del');
        result = deleteKey(result, ['status', 'url', 'createdAt']);
        //Select End Point and provider KEY 
        //1. get name of provider tool in collection and construct headers with api key 
        tools.findOne({ name: consult.toolname }, (err, t) => {
          if (t) {
            const args = {
                data: result, // data passed to REST method
                headers: { "X-Api-Key": t.apiKey, "Content-Type": "application/json" }  
            };
            //envoi API providers (hébergement non etalab et non democracyos (sans api))
            if (t.apiKey !== undefined) {
                unirest.post(t.urlApi + '/instances')
                    .headers(args.headers)
                    .send(args.data)
                    .end(function(response) {
                        //declare variable obj that will contain messages returned
                        let obj;
                        const httpstatus = response.statusType;//1,2,3,4 ou 5
                        if (httpstatus === 2) {//synchrone and asynchrone cases
                        //update mongo collection consultation with data returnes (url and status)
                           consultation.findById(args.data.requestIdentifier, function(err, consult) {
                               //if (err) return response.status(500).send({error: err});
                               const newstatus = response.body.status;
                               const newurl = response.body.url;
                               if (newstatus) consult.status = newstatus;//only for synchrone response
                               consult.url = newurl;
                               //update data with url and status (which should be equal to "running"
                               consult.save();
                           });
                           obj = {
                              title: 'confirmation',
                              msg: 'Bravo votre demande est confirmée. Le déploiement de votre consultation est en cours. Vous recevrez un email dans quelques minutes avec les instructions pour commencer.'
                           };
                        } else {
                            //il y a une erreur
                            obj = {
                                title: 'ERREUR : quelque chose s\'est mal passé.',
                                msg: response.body.message
                            };
                        }
                        //rendu html avec message correspondant (confirmation ou erreur)
                        res.render('confirmation', obj);
                    });

            } else { //  traitement cas particulier democracyosenvoi mail
               const mail = t.email;//email associated to tool

               const transporter = nodemailer.createTransport({
                    service: 'Sendgrid',
                    auth: {
                        user: process.env.SENDGRIDUSER,
                        pass: process.env.SENDGRIDPASS
                    }
               });
               //construction du mail
               const message = '<p>Bonjour,<br><br>Une demande de déploiement a été effectuée sur la plateforme Etalab.<br><br>Voici les informations : <br>Outil : ' + consult.toolname + ' <br> Nom Organisation : ' + consult.adminOrganizationName + ' <br> Nom de la consultation : ' + consult.name + ' <br> Slug : ' + consult.slug + ' <br> email du demandeur : ' + consult.adminEmail + '<br>Téléphone : ' + consult.adminPhone + ' <br><br> Merci de bien envoyer un email au demandeur ainsi qu\'à etalab (support.consultation@etalab.gouv.fr) une fois la consultation prête.<br><br>Merci. L\'équipe Etalab';

               const mailOptions = {
                    from: '"Etalab <support.consultation@etalab.gouv.fr>', // sender address
                    to: mail+ ',support.consultation@etalab.gouv.fr', // list of receivers
                    subject: 'Une consultation avec DemocracyOS', // Subject line
                    text: escape(message), // plain text body
                    html: message // html body
               };
               // send mail with defined transport object
               transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message %s sent: %s', info.messageId, info.response);
               });

           } //end if else 
          } // end if tools exists
        });  // end toolsFindONe

    } else {// end if consult 
        //the consultation has already been confirmation
        return res.status(404).render('confirmation', {title:'Erreur : il semble que vous ayez déjà confirmé cette consultation.'});
    }
});// end ocv.confirmTempConsultation
});// end router.get('/confirmation/:URL

module.exports = router;
