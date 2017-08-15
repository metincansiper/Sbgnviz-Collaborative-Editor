FROM node:boron

#Create app directory
RUN mkdir -p /usr/src/Sbgnviz-Collaborative-Editor
WORKDIR /usr/src/Sbgnviz-Collaborative-Editor

#install dependencies
COPY package.json /usr/src/Sbgnviz-Collaborative-Editor
RUN npm install


#BUNDLE app source
COPY . /usr/src/Sbgnviz-Collaborative-Editor

EXPOSE 3000

CMD [ "npm", "start"]
