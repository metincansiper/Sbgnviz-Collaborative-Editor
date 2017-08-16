FROM node:boron

#Create app directory
RUN mkdir -p /usr/src/sbgnviz
WORKDIR /usr/src/sbgnviz

#install dependencies
COPY package.json /usr/src/sbgnviz
RUN npm install


#BUNDLE app source
COPY . /usr/src/sbgnviz

EXPOSE 3000

CMD [ "npm", "start"]
