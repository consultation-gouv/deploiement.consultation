#!/bin/bash

cd /usr/src/app
npm install
npm start
npm install nodemon@1.19.4 -g
nodemon --debug=56745 bin/www 


