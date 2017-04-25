var parse = require('csv-parse');
var fs = require('fs');

var expect = require('chai').expect;



describe('config & set up tests', function() {


    it('verify if an email is authorized', function(done) {
        var email = 'jean-jacques@data.gouv.fr';
        fs.readFile('./domain_consultation.csv', 'utf8', function (err,data) {

            parse(data, {delimiter: ","}, function(err, output){
                const re = new RegExp(output[0].join("|"), "i");
                expect(email.match(re)).to.not.equal(null);
                done();
            });
        });

    });




});
