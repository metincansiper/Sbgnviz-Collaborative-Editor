/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 * Its role is to receive and decode messages and transfer them to all the clients
 * It handles general requests such as displaying, message sending and model building
 */

var KQML = require('./KQML/kqml.js');
var TripsInterfaceModule = require('./TripsInterfaceModule.js');


class TripsGeneralInterfaceModule extends TripsInterfaceModule {


    constructor(agentId, agentName, socket, model, askHuman){


        super('Sbgnviz-Interface-Agent', agentId, agentName, socket, model);

        var self = this;

        setTimeout(function(){

            self.tm.sendMsg({0: 'tell', content: ['start-conversation']});
            self.updateListeners();


        }, 2000);

    }

    /***
     * When socket changes, update the listeners on that socket
     */
    updateListeners(){
        var self = this;
        self.socket.on('relayMessageToTripsRequest', function (data) {

            // if(data.userId !== agentId){

            //console.log(data);
            var pattern = {0: 'tell', content: {0: 'started-speaking', mode: 'text', uttnum: data.uttNum, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

            var pattern = {0: 'tell', content: {0: 'stopped-speaking', mode: 'text', uttnum: data.uttNum, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

            pattern = {0: 'tell', content: {0: 'word', 1: data.text, uttnum: data.uttNum, index: 1, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

            pattern = {0: 'tell', content: {0: 'utterance', mode: 'text', uttnum: data.uttNum, text: data.text, channel: 'Desktop', direction: 'input'}};
            self.tm.sendMsg(pattern);

        });

    }

    setHandlers() {
        var self = this;


        //Listen to spoken sentences
        var pattern = {0: 'tell', 1: '&key', content: ['spoken', '.', '*']};
        self.tm.addHandler(pattern, function (text) {


            var contentObj = KQML.keywordify(text.content);

            if (contentObj) {

                var msg = {userName: self.agentName, userId: self.agentId, room: self.room, date: +(new Date)};

                msg.comment = trimDoubleQuotes(contentObj.what);

                self.model.add('documents.' + msg.room + '.messages', msg);

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


        //
        // //Listen to model id response from MRA
        var pattern = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'MRA'};

        self.tm.addHandler(pattern, function (text) { //listen to requests
            var contentObj = KQML.keywordify(text.content);


            if (contentObj.modelId) {

                self.modelId = contentObj.modelId;
                self.model.set('documents.' + self.room + '.pysb.modelId', self.modelId);
                self.model.set('documents.' + self.room + '.pysb.model', contentObj.model);


                console.log("New model started: " + self.modelId);

                //console.log(self.model.get('documents.' + socket.room + '.pysb.model'));
            }


        });


    }

    displayImage(text, askHuman) {

        var self = this;
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


                    //The socket connection is between the interface and the agent, so we cannot directly emit messages
                    //we must ask the client with the browser to do it for us
                    askHuman(agentId, self.room, "addImage", imgData, function (val) {


                        // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                    });

                });
            }
            catch (error) {
                console.log("Error " + error);
            }


        }
    }

    displaySbgn(text, askHuman) {
        var self = this;
        var contentObj = KQML.keywordify(text.content);
        if (contentObj) {

            var sbgnModel = contentObj.graph;

            sbgnModel = trimDoubleQuotes(sbgnModel);

            sbgnModel = sbgnModel.replace(/(\\")/g, '"');
            sbgnModel = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + sbgnModel;


            //The socket connection is between the interface and the agent, so we cannot directly emit messages
            //we must ask the client with the browser to do it for us
            askHuman(self.agentId, self.room, "mergeSbgn", sbgnModel, function (val) {

                // self.tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
            });


        }


    }

}


module.exports = TripsGeneralInterfaceModule;

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    var strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}
