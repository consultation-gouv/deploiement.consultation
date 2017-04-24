
module.exports = function(consultation) {
    return {
        persistentConsultationModel: consultation,
        expirationTime: 1200, // 20 minutes
        verificationURL: process.env.URLPLATFORM + '/confirmation/${URL}',
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
    }
}


