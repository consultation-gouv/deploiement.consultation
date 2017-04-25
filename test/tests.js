var parse = require('csv-parse');
var fs = require('fs');

var expect = require('chai').expect;



describe('config & set up tests', function() {


    it('verify if an email is authorized', function(done) {
        var email = 'jean-jacques@abes.fr';
        fs.readFile('./domain_consultation.csv', 'utf8', function (err,data) {
            //replace . (dot) by \. for regex to work
            data = data.replace(/\./g,'\\.');
            parse(data, {delimiter: ","}, function(err, output){
                const re = new RegExp(output[0].join("|"), "i");
                console.log(re);
                console.log(email.match(re));
                expect(email.match(re)).to.not.equal(null);
                done();
            });
        });

    });




});
