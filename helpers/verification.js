//sanitize data form
const sanitizeHtml = require('sanitize-html');
//allow verifications and operations on email strings
const validator = require('validator');
const fs = require('fs');
const parse = require('csv-parse');

module.exports = function() {
    return {
        verify : function(data, callback) {
            if (data) {
                const email = validator.normalizeEmail(data);
                const emailValid = validator.isEmail(email);
                fs.readFile('./domain_consultation.csv', 'utf8', function (err,data) {
                    //console.log(data);
                    if (err) {
                        return console.log(err);
                    }
                    //replace . (dot) by \. for regex to work
                    data = data.replace(/\./g,'\\.');
                    parse(data,{delimiter: ","}, function(err, output){
                        if (err) {
                            return console.log(err);
                        }
                        const re = new RegExp(output[0].join("|"), "i");
                        const obj = {};
                        if (!emailValid)  {
                            obj.success = false;
                            obj.status = 500;
                            obj.msg = 'Votre email est mal formé.';
                        }
                        else if (emailValid && !email.match(re) )  {
                            obj.success = false;
                            obj.status = 200;
                            obj.msg  = 'Votre email n\'est pas autorisé pour déployer une consultation.';
                        } else {
                            obj.status= 200;
                            obj.success = true;
                        }
                        callback(obj);
                    });
                });
            }
        }
    }
}