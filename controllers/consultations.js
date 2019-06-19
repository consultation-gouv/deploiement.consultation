const express = require('express'),
      router = express.Router(),
      nodemailer = require('nodemailer');

const mongoose = require('mongoose');
//main module to verify and confirm a consultation deployment request
const ocv = require('consultation-verification')(mongoose);
//importation of  model mongoose for consultation
const consultation = require('../models/consultation');
const tools = require('../models/tools');
const config = require('../helpers/ocv-config')(consultation);
//generate unique id
const uuid = require('node-uuid');
//generate slug
const slugify = require('slugify');
//register client for api 
const unirest = require('unirest');
//sanitize data form
const sanitizeHtml = require('sanitize-html');

const verif = require('../helpers/verification')();
//generate temp consultation collection Model
ocv.generateTempConsultationModel(consultation, function(err, tempConsultationModel) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('generated temp consultation model: ' + (typeof tempConsultationModel === 'function'));
});

ocv.configure(config, function(err, options) {
    if (err) {
        console.log(err);
        return;
    }
    console.log('configured: ' + (typeof options === 'object'));
});

/********************************** POST new consultation
form validation, a consultation (with statut = requested is added to collection Consultations and mail is sent to asker
 *****************************************************************/
router.post('/insert', function(req, res, next) {
    const email = req.body.adminEmail;
    //verify  if email is authorized !
    verif.verify(email, function(data) {
        if (data.success !== false) {
            //if user want to register a consultation
            if (req.body.type === 'register') {

                const newConsult = new consultation({
                    _id: uuid.v1(),//verifier si unique
                    slug: sanitizeHtml(req.body.slug),
                    adminEmail: sanitizeHtml(email),
                    name: sanitizeHtml(req.body.name),
                    adminName: sanitizeHtml(req.body.adminName),
                    adminOrganizationName: sanitizeHtml(req.body.adminOrganizationName),
                    toolname: sanitizeHtml(req.body.toolName)
                    //checkbox: sanitizeHtml(req.body.checkbox)
                });

                ocv.createTempConsultation(newConsult, function (err, existingPersistentConsultation, newTempConsultation) {
                    if (err) {
                        return res.send('ERROR: creating temp consultation FAILED');
                    }

                    // new consultation created
                    if (newTempConsultation) {
                        const URL = newTempConsultation[ocv.options.URLFieldName];
                        //an email is sent to confirm deployment
                        ocv.sendVerificationEmail(email, URL, function (err, info) {
                            if (err) {
			        console.log(err);
                                res.json({
				    success: false,
                                    msg: "Impossible d'envoyer l'email de confirmation",
                                    title: 'Attention !',
                                    class: 'alert-danger',
				    err: err,
				    info: err
				});
                            } else {
                                  res.json({
                                      msg: 'Un email vient de vous être envoyé pour confirmer votre demande.',
                                      class: 'alert-success',
                                      title: 'Bravo ! '
				  });
			    }
                        });
                        // Consultation already exists in temporary collection!
                    } else {
                        res.json({
                            success: false,
                            msg: 'Vous avez déjà une demande de consultation en cours de confirmation. Confirmez-la avant d\'en créer une autre.',
                            title: 'Attention !',
                            class: 'alert-danger'
                        });
                    }
                });
                /* if type != register resend verification button was clicked*/
            } else {
                ocv.resendVerificationEmail(email, function (err, userFound) {
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
        } else {
            //email is not authorized, send message
            return res.status(data.status).json(data);
        }

    });
});




/********************* CONFIRMATION ******************************/
router.get('/confirmation/:URL', function(req, res) {
    const url = req.params.URL;
    //copy document "Consultation" from temporary collection to permanent collection thenn send POST request to Provider API to deploy
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
            //tools.findTool({ name: consult.toolname }, (err, t) => {
            tools.findTool( consult.toolname, (err, t) => {
     	          if (t) {
                    const args = {
                        data: result, // data to be passed to the REST method
                        headers: { "X-Api-Key": t.apiKey, "Content-Type": "application/json" }
                    };
                    //send request to API
                    if (t.apiKey !== undefined) {
                        unirest.post(t.urlApi + '/instances')
                            .headers(args.headers)
                            .send(args.data)
                            .end(function(response) {
                                //declare variable obj that will contain messages returned
                                let obj;
                                const httpstatus = response.statusType;//1,2,3,4 ou 5
                                if (consult.toolname != "cap-collectif" && httpstatus === 2) {//synchrone and asynchrone cases
                                    //update mongo collection consultation with data returnes (url and status)
                                    consultation.findConsultation(args.data.requestIdentifier, function(err, consult) {
                                        //if (err) return response.status(500).send({error: err});
                                        const newstatus = response.body.status;
                                        const newurl = response.body.url;
                                        if (newstatus) consult.status = newstatus;//only for synchrone response
                                        consult.url = newurl;
                                        //update data with url and status (which should be equal to "running"
                                        consult.save();
                                    });
                                    obj = {
                                        success: true,
                                        title: 'confirmation',
                                        msg: 'Bravo votre demande est confirmée. Le déploiement de votre consultation est en cours. Vous recevrez un email dans quelques minutes avec les instructions pour commencer.'
                                    };
                                } else { //il y a une erreur
				    if (consult.toolname == "cap-collectif" || consult.toolname == "assembl") {
				        // ces backends ne fonctionnent pas pour l'instant,
				        // https://github.com/consultation-gouv/deploiement.consultation/issues/19
				        // https://github.com/consultation-gouv/deploiement.consultation/issues/20
					obj = {
					    success: false,
					    title: "Erreur : ce service est temporairement inaccessible chez l'hébergeur.",
					    msg: ""
					};
                                      return res.render('confirmation-problem-backend', obj);
				    } else {
					obj = {
					    success: false,
					    title: 'ERREUR : quelque chose s\'est mal passé.',
					    msg: response.body ? response.body.message : "No body"
					};
				    }
                                }
                                //rendu html avec message correspondant (confirmation ou erreur)
                                res.render('confirmation', obj);
                            });

                    } else { //  traitement cas particulier envoi mail
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
                            let obj;
                            if (error) {
		   		    obj = {
                                        success: false,
                                        title: 'ERREUR : quelque chose s\'est mal passé.',
                                        msg: response.body.message
                                    };

                            } else {
                                    obj = {
                                        success: true,
                                        title: 'confirmation',
                                        msg: 'Bravo votre demande est confirmée. Le déploiement de votre consultation est en cours. Vous recevrez un email dans quelques minutes avec les instructions pour commencer.'
                                    };
			    }
        		    res.render('confirmation', obj);

			    //if (error) {
                            //    return console.log(error);
                            //}
                            //console.log('Message %s sent: %s', info.messageId, info.response);
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
