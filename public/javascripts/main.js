$(document).ready(function () {


    $.fn.api.settings.api = {
        'create consultation' : '/insert'
    };

    const $form = $("#form-deploy");

    const validation =
        {
            fields: {
                slug: {
                    identifier: 'slug',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Please enter your slug'
                        }
                    ]
                },
                name: {
                    identifier: 'name',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Please enter your name'
                        }
                    ]
                },
                checkbox: {
                    identifier: 'checkbox',
                    rules: [
                        {
                            type: 'checked',
                            prompt: 'Vous devez accepter les CGU.'
                        }
                    ]
                }
            }
        };


    $('.submit')
        .api({
            action : 'create consultation',
            serializeForm: true,
            method : 'POST',
            onSuccess: function(response) {
                // valid response and response.success = true
                console.log(response);
            },
            onFailure: function(response) {
                // request failed, or valid response but response.success = false
                console.log(response);
            },
            onError: function(errorMessage) {
                // invalid response
                console.log(errorMessage);
            }
        })
    ;

});

$( "form" ).on( "submit", function( event ) {
    event.preventDefault();
    console.log( $( this ).serialize() );
});
/*
$.ajax({
    type: "POST",
    url: '/insert',
    data: form.serialize(),
    dataType: 'json',
    success: function(data) {
        console.log(data);
        $('.alert')
            .removeClass('hide')
            .removeClass('alert-danger')
            .removeClass('alert-success')
            .addClass(data.class)
            .find('span').text(data.msg)
        ;
        $('.alert')
            .find('strong').text(data.title);
    },
    error: function(err) {
        console.log(err);
    }

});
*/


/*   form.steps({
        labels: {
       cancel: "Cancel",
       current: "current step:",
       pagination: "Pagination",
       finish: "Lancer ma consultation !",
       next: "Suivant",
       previous: "Précédent",
       loading: "Loading ..."
       },
       headerTag: "h3",
       bodyTag: "fieldset",
       transitionEffect: "slideLeft",
       onStepChanging: function (event, currentIndex, newIndex)
       {
           // Allways allow previous action even if the current form is not valid!
           if (currentIndex > newIndex)
           {
               return true;
           }
           // Needed in some cases if the user went back (clean up)
           if (currentIndex < newIndex)
           {
               // To remove error styles
               form.find(".body:eq(" + newIndex + ") label.error").remove();
               form.find(".body:eq(" + newIndex + ") .error").removeClass("error");
           }
           form.validate().settings.ignore = ":disabled,:hidden";
           return form.valid();
       },
       onStepChanged: function (event, currentIndex, priorIndex)
       {
           var slug = $('#slug').val();
           $('#summarySlug').text(slug);
           $('#summaryNomConsultation').text($('#name').val());
           $('#summaryEmail').text($('#adminEmail').val());
           $('#summaryNom').text($('#adminName').val());
           $('#summaryAdmin').text($('#adminOrganizationName').val());
           $('#summaryTel').text($('#adminPhone').val());
           $('#summaryOutil').text($('#toolName').val());
           $('#summaryHebergement').text($('#hosting').val());

       },
       onFinishing: function (event, currentIndex)
       {
           form.validate().settings.ignore = ":disabled";
           return form.valid();
       },
       onFinished: function (event, currentIndex)
       {

       //lancer script de vérification
       $.ajax({
           type: "POST",
           url: '/insert',
           data: form.serialize(),
           dataType: 'json',
           success: function(data) {
           console.log(data);
           $('.alert')
               .removeClass('hide')
               .removeClass('alert-danger')
               .removeClass('alert-success')
               .addClass(data.class)
               .find('span').text(data.msg)
               ;
           $('.alert')
               .find('strong').text(data.title);
           },
           error: function(err) {
           console.log(err);
           }

         });

      }
   }).validate({
       errorPlacement: function errorPlacement(error, element) { element.after(error); },
       rules: {
         slug: {
            minlength: 4,
            maxlength: 15,
            slug: true
         },
         adminEmail: {
            email: true,
            emailgouv: true
         },
         name: {
            minlength: 4,
            maxlength: 70
         },
         adminName: {
            minlength: 4,
            maxlength: 35
         },
         adminOrganizationName: {
            minlength: 4,
            maxlength: 35
         },
         adminPhone: {
            minlength: 8,
            maxlength: 12
         }
       }
   });


//custom messages

$.extend($.validator.messages, {
   required: "Ce champ est requis.",
   remote: "Corrigez ce champ s'il vous plaît.",
   email: "Entrez une adresse email valide.",
   url: "Entrez une url valide.",
   date: "Please enter a valid date.",
   dateISO: "Please enter a valid date (ISO).",
   number: "Please enter a valid number.",
   digits: "Please enter only digits.",
   equalTo: "Please enter the same value again.",
   accept: "Please enter a value with a valid extension.",
   maxlength: jQuery.validator.format("N'entrez pas plus de {0} caractères."),
   minlength: jQuery.validator.format("Entrez au moins {0} caractères."),
   rangelength: jQuery.validator.format("Please enter a value between {0} and {1} characters long."),
   range: jQuery.validator.format("Please enter a value between {0} and {1}."),
   max: jQuery.validator.format("Please enter a value less than or equal to {0}."),
   min: jQuery.validator.format("Please enter a value greater than or equal to {0}."),
   slug: jQuery.validator.format("Entrez des lettre minuscules, chiffres et/ou tiret (-)"),
   emailgouv: jQuery.validator.format("email non autorisé.")
});

$.validator.addMethod("slug", function(value, element) {
   return /^[a-z0-9\-]+$/.test(value);
});

var domainArray = [".(gouv)\.(fr)$", "(octo)\.(com)$"];
$.validator.addMethod("emailgouv", function(value, element) {
   var re = new RegExp(domainArray.join("|"), "i");
   return  (value.match(re) != null);
});

*/