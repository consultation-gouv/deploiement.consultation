$(document).ready(function () {
    //endpoint definition
    $.fn.api.settings.api = {
        'create consultation' : '/insert',
        'verify email' : '/verify'
    };
    //success / error definitions
    $.fn.api.settings.successTest = function(response) {
          if(response && response.success) {
                  return response.success;
                }
          return false;
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
                            prompt: 'Vous devez entrer une url (slug) pour votre consultation.',
                        },
                        {
                            type   : 'length[5]',
                            prompt : 'Le slug doit faire au minimum 5 caractères.'
                        },
                        {
                            type   : 'maxLength[30]',
                            prompt : 'Le slug doit faire au maximum 30 caractères.'
                        },
                        {
                            type   : 'regExp[/^[a-z0-9\-]+$/]',
                            prompt : 'Le slug ne doit pas contenir de caractères spéciaux.'
                        }
                    ]
                },
                name: {
                    identifier: 'name',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Entrez le nom de votre consultation.'
                        },
                        {
                            type   : 'maxLength[30]',
                            prompt : 'Le nom de votre consulation doit faire au maximum 30 caractères.'
                        }
                    ]
                },
                email: {
                    identifier: 'adminEmail',
                    rules: [
						{
							type: 'empty',
							prompt: 'Entrez votre email.'
						},
                        {
                            type: 'email',
                            prompt: 'Entrez un email valide.'
                        }
                    ]
                },
                organisation: {
                    identifier: 'adminOrganizationName',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Vous devez entrer le nom de votre organisation.'
                        },
                        {
                            type   : 'maxLength[40]',
                            prompt : 'Le nom de votre organisation doit faire 40 caractères maximum.'
                        }
                    ]
                },
                name: {
                    identifier: 'adminName',
                    rules: [
                        {
                            type: 'empty',
                            prompt: 'Vous devez entrer votre prénom et nom.'
                        },
                        {
                            type   : 'maxLength[60]',
                            prompt : 'Votre prénom et nom ne doivent pas excéder 60 caractères.'
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

    $("#adminEmail")
        .api({
            action : 'verify email',
            on: 'blur',
            method: 'POST',
            serializeForm: true,
            onSuccess: function(response) {
                // valid response and response.success = true
                $(this).parent('div').removeClass('error');
                $('form').removeClass('error');
            },
            onFailure: function(error) {
                // valid response and response.success = false
                $(this).parent('div').addClass('error');
                $('form').addClass('error');
                $('form .ui.message.error').text(error.msg);
            },
            onError: function(errorMessage) {
                // invalid response
                console.log(errorMessage);
            }
        });
             

    //instanciate semantic ui form object
    $form
        .form(validation)
        .api({
            action : 'create consultation',
            serializeForm: true,
            method : 'POST',
            onSuccess: function(response) {
                // valid response and response.success = true
                $('form .ui.submit').addClass('disabled');
                $('form .ui.message.success').removeClass('hidden').text(response.msg);
            },
            onFailure: function(error) {
                // request failed, or valid response but response.success = false
                $('form .ui.message.error').removeClass('hidden').text(error.msg);
            },
            onError: function(errorMessage) {
                // invalid response
                console.log(errorMessage);
            }
        });
});
