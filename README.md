[![Build Status](https://travis-ci.org/sdelafond/deploiement.consultation.svg?branch=master)](https://travis-ci.org/sdelafond/deploiement.consultation)

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

Il est possible d'utiliser directement le fichier env.docker

```shell
cp env.docker .env
ln -sf ../.env node_api_server/
```

On peut aussi partir du fichier env.template

```shell
cp env.template .env
```

Puis éditer les informations :

```
SENDGRIDUSER=sendgridusername
SENDGRIDPASS=sendgridpassword
SENDGRIDAPIKEY=sendgridapikey
URLPLATFORM=l'url de votre plateforme (http://consultation.local par exemple)
DOMAIN=votre domain, consultation.local par exemple
MONGOUSER= 
MONGOPASSWD=
MONGOHOST=mongo
```

### Commandes

Il faut tout d'abord lancer les services :

```
docker-compose up
```

Ensuite, au 1er lancement, ajouter les outils de consultation par défaut :

```
/usr/bin/mongorestore --gzip --archive=./playbook-ansible/v2/file/consultation-tools.mongodump.gz
```

Le site est ensuite disponible, par défaut sur localhost:80

### Base de données

Il faut créer et peupler manuellement une base de données "db_deploy" contenant une collection "tools" contenant les informations des outils de la plateforme (voir schéma dans /models/tools.js). Pour le développement, le champs apikey des outils peut rester vide.

Les collections consultation et temporary_consultation sont créées par l'application.

### Modifier les noms de domaine mail autorisés sur la plateforme

Pour ajouter des domaines mail dans la liste des domaines autorisés sur le formulaire de la plateforme, il suffit d'ajouter le nom de domaine comme ci dessous à la fin de la ligne du fichier **_domain\_consultation.csv_** présent à la racine du projet, il n'y a pas besoin de redémarrer l'application pour que la modification soit effective. 

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

