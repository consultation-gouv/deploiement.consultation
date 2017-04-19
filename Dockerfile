FROM ubuntu:16.04

RUN apt-get update -y && apt-get upgrade -y && \
    apt-get install -y curl git 
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash 
RUN apt-get -y install nodejs build-essential
RUN npm install -g bower grunt-cli gulp
RUN npm install -g express
RUN npm install -g allcountjs-cli



