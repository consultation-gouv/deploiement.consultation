# Plateforme de consultation

La plateforme de consultation permet aux administrations françaises de déployer des outils de consultations en ligne.

Ces instructions ont pour objectif de permettre à quiconque de déployer le projet sur tout type d'environnement.

Les APIs ont été conçues à l'aide de Swagger (http://swagger.io/). 

## Architecture

![](img/architecture-ogp-platform.png?raw=true)

### APIs

Spécifications de l'API Editeur et de l'API PLateforme: [api.Specs](https://github.com/consultation-gouv/specs-apis-deploiement)

### technologies et modules utilisés
- nginx
- node.js / Express + module npm spécifique : https://github.com/consultation-gouv/npm.verif.consultation 
- mocha et chai pour les tests
- mongoDB
- semantic UI
- pm2 & monit

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

Il faut créer et peupler manuellement une base de données "db_deploy" contenant une collection "tools" contenant les informations des outils de la plateforme (voir schéma dans /models/tools.js). Pour le développement, le champs apikey des outils peut rester vide.

Les collections consultation et temp_consultation sont créées par l'application.

### Mise à jour les noms de domaine mail autorisés

Pour ajouter des domaines mail dans la liste des domaines autorisés sur le formulaire de la plateforme, il suffit d'ajouter le nom de domaine comme ci dessous à la fin de la ligne du fichier **_domain\_consultation.csv_** présent à la racine du projet.

```
email1.com,email2.com,email3.com,votrenomdedomaine.fr
```

## Déploiement

Le déploiement de l'application est automatisé. Voir les scripts Ansible et le README dans le répertoire [playbook-ansible/v2/](playbook-ansible/v2) 

## tests

```
npm test
```
Propositions de tests : 
- test "end to end" création consultation et confirmation. Nécessite mock API éditeurs (voir [api.spec](https://github.com/consultation-gouv/specs-apis-deploiement)) 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

