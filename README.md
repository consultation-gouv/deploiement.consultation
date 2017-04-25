# Plateforme de consultation

La plateforme de consultation permet aux administrations françaises de déployer des outils de consultations en ligne.

Ces instructions ont pour objectif de permettre à quiconque de déployer le projet sur tout type d'environnement.

Les APIs ont été conçues à l'aide de Swagger (http://swagger.io/). 

## Architecture

![](img/architecture-ogp-platform.png?raw=true)

Spécifications de l'API Editeur et de l'API PLateforme: [api.Specs](https://github.com/consultation-gouv/specs-apis-deploiement)


## Développement

### Dépendances

- Docker (version > 1.10)
- docker-compose (version > 1.6)
- un compte Sendgrid avec une api key définie. Voir https://sendgrid.com/docs/Classroom/Send/How_Emails_Are_Sent/api_keys.html

### Variables d'environnement

Renommer le fichier env.template en .env

```shell
mv env.template .env
```

Editer les informations :

```
SENDGRIDUSER=apikey
SENDGRIDPASS=<votre apiKey>
URLPLATFORM=l'url de votre plateforme (http://consultation.local par exemple)
MONGOUSER= 
MONGOPASSWD=
MONGOHOST=mongo
```

### Commandes

- docker-compose up. Il suffit de se rendre sur l'URL indiquée à l'exécution de la commande.

### Base de données

Il faut créer une base de données "db_deploy" contenant une base avec une collection "tools" contenant les informations des outils de la plateforme (voir schéma dans /models/tools.js).

## Déploiement

Le déploiement de l'application est automatisé. Voir les scripts Ansible et le README dans le répertoire [playbook-ansible/v2/](playbook-ansible/v2) 

## tests

```
npm test
```
to do : 
- test "end to end" création consultation et confirmation. Nécessite mock API éditeurs (voir [api.spec](https://github.com/consultation-gouv/specs-apis-deploiement)) 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

