# OGP TOOLBOX PLATFORM

The OGP TOOLBOX PLATFORM allows French Administrations to deploy consultations online, using tools provided by the CIVIC TEC community.

## Getting Started

These instructions will allow anyone to deploy the project on a live system.

The api was designed with Swagger (http://swagger.io/). See : https://framagit.org/etalab/consultation-gouv-fr-deployment-api

The platform contains a custom npm module : https://framagit.org/etalab/ogptoolbox-platform-verification-consultation which is a fork of https://www.npmjs.com/package/email-verification

### Prerequisites


```
- GIT
- Curl
- openssl
- MongoDB - v3.2+
- Node.js - v6+
- PM2
- BIND

```

### Install (for DEBIAN 8)


Install Node JS V6 +

```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y build-essential
```

Install mongodb : 3.2 + :
First import GPG key of mongodb

```
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
```
then

```
echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt update
sudo apt install -y mongodb-org
sudo service mongod start
```
When mongo is working, create database “db_deploy” and a collection “tools” with appropriates providers secret keys  (see the tools mongoose schema is available here /platform/models). The consultation collection will be created by the app when deploying the first consultation.

security mongo :

Mongodb enable authentication

1. Connect to the instance
```
$ mongo --port 27017
```
2. Create the user administrator.
Add a user with the root role. For example, the following creates the user superAdmin on the admin database:
```
$ use admin
$ db.createUser(
  {
    user: "superAdmin",
    pwd: "admin123",
    roles: [ { role: "root", db: "admin" } ]
  })
```
3. Re-start the MongoDB instance with access control
Add the security.authorization setting to the config file
```
: $ sudo vi /etc/mongod.conf
```
It may look like this
```
systemLog:
 destination: file
 path: /usr/local/var/log/mongodb/mongo.log
 logAppend: true
storage:
 dbPath: /usr/local/var/mongodb
net:
 bindIp: 127.0.0.1
security:
 authorization: enabled
```
Restart mongodb
```
: $ sudo service mongod restart
```
5. Connect to database instance with superAdmin access
```
$ mongo --port 27017 -u "superAdmin" -p "admin123" --authenticationDatabase "admin"
```
6. Create user access (readWrite) for specific database
```
$ mongo -- port 27017 -u "superAdmin" -p "admin123" — authenticationDatabase "admin"
$ use db_deploy
$ db.createUser(
  {
   user: "ogptoolbox",
   pwd: "mypass",
   roles: [ "readWrite"]
  })
```
7. Try Connecting to the specific database with limited access
```
$ mongo --port 27017 -u "ogptoolbox" -p "mypass" --authenticationDatabase "db_deploy"
```
8. put credentials in file /mongo/db_connect.js
```
   var mongoose = require('mongoose');
   mongoose.Promise = global.Promise;
   mongoose.connect('mongodb://ogptoolbox:mypass@localhost:27017/db_deploy');    
   module.exports = exports = mongoose; 
```

Note on mongodb on production environnement : 

Data redundancy and high availability does not seem necessary since the use of the platform is internal (French administrations) and the project is still in Beta.  
So this mongo is basically set up. If this application is to be widely used in the future, it could be important to set up mongo such as described here : https://docs.mongodb.com/v3.0/administration/production-checklist/

### SSL
Install Let's Encrypt (certbot) and Dependencies 

```
cd /opt/ && git clone https://github.com/certbot/certbot
cd /opt/certbot/
sudo chmod +x certbot-auto && ./certbot-auto certonly --standalone --email support.consultation@etalab.gouv.fr -d consultation.etalab.gouv.fr  -d api.consultation.etalab.gouv.fr
```

Make sure your DNS configuration is OK otherwise the certbot challenge will fail !

Check if /etc/letsencrypt/live/consultation.etalab.gouv.fr exists

Generate Strong Diffie-Hellman Group to increase security : 
```
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
```

### HTTP SERVER
```
sudo apt install nginx
```

Create a new Nginx configuration snippet in the /etc/nginx/snippets directory.

```
sudo nano /etc/nginx/snippets/ssl-consultation.etalab.gouv.fr.conf
```
and put 
```
ssl_certificate /etc/letsencrypt/live/consultation.etalab.gouv.fr/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/consultation.etalab.gouv.fr/privkey.pem;
```

Create a Configuration Snippet with Strong Encryption Settings
```
sudo nano /etc/nginx/snippets/ssl-params.conf

: ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
ssl_ecdh_curve secp384r1;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
# Disable preloading HSTS for now.  You can use the commented out header line that includes
# the "preload" directive if you understand the implications.
#add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload";
add_header Strict-Transport-Security "max-age=63072000; includeSubdomains";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;

ssl_dhparam /etc/ssl/certs/dhparam.pem;
```

Configure Nginx to Use SSL : 

remove default file configuration /etc/nginx/sites-available/default and /etc/nginx/sites-available/enabled
 
Create 2 files : 

First, /etc/nginx/sites-available/api

```
server {
        listen 80;
        #listen [::]:80 default_server ipv6only=on;
        return 301 https://$host$request_uri;
}


server {
    listen 443;
    server_name api.consultation.etalab.gouv.fr;
    ssl on;
    include /etc/nginx/snippets/ssl-consultation.etalab.gouv.fr.conf;
    include /etc/nginx/snippets/ssl-params.conf;


    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://localhost:8080/;
        proxy_ssl_session_reuse off;
        proxy_set_header Host $http_host;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}

```
and 

/etc/nginx/sites-available/platform

```
server {
        listen 80;
        listen [::]:80 default_server ipv6only=on;
        return 301 https://$host$request_uri;
}


server {
    listen 443;
    server_name consultation.etalab.gouv.fr;
    ssl on;
    include /etc/nginx/snippets/ssl-consultation.etalab.gouv.fr.conf;
    include /etc/nginx/snippets/ssl-params.conf;


    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://localhost:3000/;
        proxy_ssl_session_reuse off;
        proxy_set_header Host $http_host;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
```

Create link in sites-enable : 
```
sudo ln -s /etc/nginx/sites-available/platform /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
```
And don't forget to start the nginx service !

### DNS CONFIGURATION


Install bind : 
```
apt install bind9
cd /etc/bind
```
Configure the DNS SERVER so that it can listen on any IP (internet, itself) :

Modifiez  "/etc/bind/named.conf.options" :


```
vim named.conf.options
```

replace
```
listen-on {127.0.0.1;};
```

by :
```

listen-on {any;};
```
Note : if "listen-on" does not exist add it after line "listen-on-v6".
 
Creation of directe zone (domaine -> IP)

Modify the file "/etc/bind/named.conf.local" to dclare zones to manage on this dns server

```
vim named.conf.local
Code : Bash
zone "consultation.etalab.gouv.fr" {

    type master;
    file "/etc/bind/db.consultation.etalab.gouv.fr";
};
//plateform and api
zone "143.134.91.in-addr.arpa" {
    type master;
    notify no;
    file "/etc/bind/db.91";
};

```

This is the minimum configuration to declare this zone on our dns server.


Now we have to create a file for each declared zone :
```
Code : Bash
vim db.consulation.etalab.gouv.fr
;;
; BIND data file for local loopback interface
;
$TTL    604800
@   IN  SOA ns.consultation.etalab.gouv.fr. webmaster.consultation.etalab.gouv.fr. (
                  9     ; Serial
             604800     ; Refresh
              86400     ; Retry
            2419200     ; Expire
             604800 )   ; Negative Cache TTL
;
@   IN  NS  vps317000.ovh.net.
@   IN  NS  sdns2.ovh.net.
;
@   IN  A   91.134.143.39
;
;MAILs SENT from platform via Sendgrid
//Get configuration on Sendgrid 




;
;API platform
api IN A 91.134.143.39


;PROVIDERS
;here put DNS configuration provided by providers
; minimum :
provider IN A XXX.XXX.XX.XX
```


Careful : after every modification, you should increment the  "Serial".

Reverse search zone  (IP -> domaine)

To add a reverse search zone modify  "/etc/bind/named.conf.local".

```
Code : Bash

vim /etc/bind/named.conf.local


Code : Bash

zone "consultation.etalab.gouv.fr" {
    type master;
    file "/etc/bind/db.consultation.etalab.gouv.fr";
};
//plateform and api
zone "143.134.91.in-addr.arpa" {
    type master;
    notify no;
    file "/etc/bind/db.91";
};

```
Then, create the file of the reverse zone 
```
Code : Bash
vim db.91

Code : Bash
; BIND reverse data file for local loopback interface
;
$TTL    604800
@       IN      SOA     ns.consultation.etalab.gouv.fr. webmaster.consultation.gouv.fr. (
                              2         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
;
@        IN      NS      ns.
39       IN      PTR     ns.consultation.etalab.gouv.fr.
39       IN      PTR     api.consultation.etalab.gouv.fr.
```

Check conf

```
Code : Bash
named-checkconf -z
```
 
reload server 
```
Code : Bash
service bind9 reload
```

### Deploy the NODE APPs

Create a ogptoolbox user : 
```
sudo adduser ogptoolbox
```
and clone this repository in /home/ogptoolbox/
then 
```
cd /home/ogptoolbox/
npm install
cd /home/ogptoolbox/node_api_server
npm install
```
with sudo user : install pm2 globally : 
```
sudo npm install pm2 -g
```
start the two node app : 
```
cd /home/ogptoolbox/platform
create an .env file with following :
SENDGRIDUSER=user
SENDGRIDPASS=pass
URLPLATFORM=https://consultation.etalab.gouv.fr
```
(see section Sendgrid to set up user and pass)
```
pm2 start ecosystem.json
```

### SENDGRID Configuration

create account on sendgrid.com

whitelist the IP of the server 

manage DNS to be able to send mail from your server (https://app.sendgrid.com/settings/whitelabel/domains)

Exemple with dns serveur Bind :

```
mail.consultation.etalab.gouv.fr. IN CNAME u4090883.wl134.sendgrid.net.
s1._domainkey.consultation.etalab.gouv.fr. IN CNAME s1.domainkey.u4090883.wl134.sendgrid.net.
s2._domainkey.consultation.etalab.gouv.fr. IN CNAME s2.domainkey.u4090883.wl134.sendgrid.net.
```

Add credentials to create user and password https://app.sendgrid.com/settings/credentials (caution: Sendgrid does not accept special chars in password or user ( !& etc.)

## tests

Units Tests can be run on npm module ogptoolbox-platform-verification-consultation.


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details



# deploiement.consultation
# deploiement.consultation
# deploiement.consultation
