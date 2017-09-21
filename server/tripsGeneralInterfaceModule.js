/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 * Its role is to receive and decode messages and transfer them to all the clients
 * It handles general requests such as displaying, message sending and model building
 */

module.exports = function(agentId,  agentName, socket, model, askHuman){


    var tripsModule = require('./tripsModule.js');
    this.tm = new tripsModule(['-name', 'Sbgnviz-Interface-Agent']);
    var KQML = require('./KQML/kqml.js');

    var self = this;
    this.modelId;
    this.socket = socket;




        this.displayImage = function(text){
        var contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            var imageTabMap = {
                'reactionnetwork': {ind: 1, label: 'RXN'},
                'contactmap': {ind: 2, label: 'CM'},
                'influencemap': {ind: 3, label: 'IM'},
                'simulation': {ind: 4, label: 'SIM'}
            }


            var imgPath = trimDoubleQuotes(contentObj.path);
            try {
                var fs = require('fs');
                fs.readFile(imgPath, function (error, fileContent) {
                    if (error) {
                        console.log('exec error: ' + error);
                        return;
                    }




                    var imgContent = 'data:image/png;base64,' + fileContent.toString('base64');

                    var imgData = {
                        img: imgContent,
                        tabIndex: imageTabMap[contentObj.type].ind,
                        tabLabel: imageTabMap[contentObj.type].label,
                        fileName: imgPath
                    }


                    //We are on the server side of the socket, so directly emitting request does not work
                    //we must ask the client to do it for us
                    askHuman(agentId, self.socket.room, "addImage", imgData, function (val) {

                        // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                    });

                });
            }
            catch (error) {
                console.log("Error " + error);
            }


        }
    }

    this.displaySbgn  = function(text) {
        var contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            var sbgnModel = contentObj.graph;

            sbgnModel = trimDoubleQuotes(sbgnModel);

            sbgnModel = sbgnModel.replace(/(\\")/g, '"');
            sbgnModel = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + sbgnModel;

            //We are on the server side of the socket, so directly emitting request does not work
            //we must ask the client to do it for us
            askHuman(agentId, self.socket.room, "mergeSbgn", sbgnModel, function (val) {

                // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
            });


        }
    }


    self.tm.init(function () {


        self.tm.register();



        //Listen to spoken sentences
        var pattern = {0: 'tell', 1: '&key', content: ['spoken', '.', '*']};
        self.tm.addHandler(pattern, function (text) {


            var contentObj = KQML.keywordify(text.content);

            if (contentObj) {

                var msg = {userName: agentName, userId: agentId, room: self.socket.room, date: +(new Date)};

                msg.comment = trimDoubleQuotes(contentObj.what);

                model.add('documents.' + msg.room + '.messages', msg);
            }

        });


        var pattern = {0: 'tell', 1: '&key', content: ['display-sbgn', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displaySbgn(text);

        });


        var pattern = {0: 'request', 1: '&key', content: ['display-sbgn', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displaySbgn(text);
        });


        var pattern = {0: 'tell', 1: '&key', content: ['display-image', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displayImage(text);
        });

        var pattern = {0: 'request', 1: '&key', content: ['display-image', '.', '*']};
        self.tm.addHandler(pattern, function (text) {
            self.displayImage(text);
        });


        self.tm.run();

        self.tm.sendMsg({0: 'tell', content: ['start-conversation']});


        self.modelId = model.get('documents.' + self.socket.room + '.pysb.modelId');

        //TODO: We now assume that the system is not reset after sbgnviz is connected-- so it keeps the model-id indefinitely
        //We also need to check modelid does not exist in the system
        //Or each time we get a new model id

        // if (!self.modelId) {

            var ekbTerm = '"<ekb>' + '' + '</ekb>"';

            self.tm.sendMsg({0: 'request', content: {0: 'BUILD-MODEL', description: ekbTerm}});
        // }

        //Listen to model id response from MRA
        var pattern = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'MRA'};

        self.tm.addHandler(pattern, function (text) { //listen to requests
            var contentObj = KQML.keywordify(text.content);


            if (contentObj.modelId) {

                self.modelId = contentObj.modelId;
                model.set('documents.' + self.socket.room + '.pysb.modelId', self.modelId);
                model.set('documents.' + self.socket.room + '.pysb.model', contentObj.model);


                console.log("New model started: " + self.modelId);

                //console.log(model.get('documents.' + socket.room + '.pysb.model'));
            }


        });


    });



    setTimeout(function() {

        //Let user know
        if (!self.tm.isConnected) {
            var msg = {userName: agentName, userId: agentId, room: self.socket.room, date: +(new Date)};


            msg.comment = "TRIPS connection cannot be established.";

            model.add('documents.' + msg.room + '.messages', msg);

        }
    }, 1000);


    setInterval(function(){
        //Let user know
        if (!self.tm.isConnected) {
            var msg = {userName: agentName, userId: agentId, room: self.socket.room, date: +(new Date)};


            msg.comment = "TRIPS connection cannot be established.";

            model.add('documents.' + msg.room + '.messages', msg);

        }
    }, 2000);



    try {
        //Utterances are sent to trips
        self.socket.on('relayMessageToTripsRequest', function(data){


            // if(data.userId !== agentId){

                //console.log(data);
                var pattern = {0:'tell', content:{0:'started-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
            self.tm.sendMsg(pattern);

                pattern = {0:'tell', content:{0:'stopped-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
            self.tm.sendMsg(pattern);

                pattern = {0:'tell', content:{0:'word', 1: data.text, uttnum: data.uttNum, index: 1, channel: 'Desktop',direction:'input'}};
            self.tm.sendMsg(pattern);

                pattern = {0:'tell', content:{0:'utterance', mode:'text',  uttnum: data.uttNum, text:data.text, channel: 'Desktop',direction:'input'}};
            self.tm.sendMsg(pattern);
            // }


        });



    }
    catch(e){
        console.log(e + " Trips disconnected.");
    }
    //TRIPS connection should be closed explicitly
    self.socket.on('disconnect', function(){
        self.tm.disconnect();
    });

    return this;
}

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    var strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}
