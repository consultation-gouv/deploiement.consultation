FROM ubuntu:16.04

RUN apt-get update -y && apt-get upgrade -y && \
    apt-get install -y curl git 
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash 
RUN apt-get -y install nodejs build-essential
RUN npm install -g bower grunt-cli gulp
RUN npm install -g express
RUN npm install -g allcountjs-cli

# copy app and install deps
# Create app directory
#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app

# Install app dependencies
#COPY package.json /usr/src/app/
#RUN npm install
#RUN npm install allcountjs --save

# Bundle app source
#COPY . /usr/src/app

#EXPOSE 9000
#CMD [ "npm", "start" ]


