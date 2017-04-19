#!/bin/bash

cd /usr/src/app
npm install
npm install nodemon -g
nodemon --debug=56745 bin/www 


