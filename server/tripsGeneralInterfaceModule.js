/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and sbgnviz
 * Its role is to receive and decode messages and transfer them to all the clients
 * It handles general requests such as displaying, message sending and model building
 */

module.exports = function(agentId,  agentName, socket, model, askHuman){


    var tripsModule = require('./tripsModule.js');
    tm = new tripsModule(['-name', 'Sbgnviz-Interface-Agent']);
    var KQML = require('./KQML/kqml.js');

    var self = this;
    this.modelId;

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


                    askHuman(agentId, socket.room, "addImage", imgData, function (val) {

                        tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
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


            //Request this information from the tripsInterface
            socket.emit('displayModel', sbgnModel, function (val) {

            });

        }
    }

    try {
        tm.init(function () {

            tm.register();



            //Listen to spoken sentences
            var pattern = {0: 'tell', 1: '&key', content: ['spoken', '.', '*']};
            tm.addHandler(pattern, function (text) {
                var contentObj = KQML.keywordify(text.content);

                if (contentObj) {

                    var msg = {userName: agentName, userId: agentId, room: socket.room, date: +(new Date)};


                    msg.comment = trimDoubleQuotes(contentObj.what);
                    model.add('documents.' + msg.room + '.messages', msg);
                }

            });


            var pattern = {0: 'tell', 1: '&key', content: ['display-sbgn', '.', '*']};
            tm.addHandler(pattern, function (text) {
                self.displaySbgn(text);
            });


            var pattern = {0: 'request', 1: '&key', content: ['display-sbgn', '.', '*']};
            tm.addHandler(pattern, function (text) {
                self.displaySbgn(text);
            });


            var pattern = {0: 'tell', 1: '&key', content: ['display-image', '.', '*']};
            tm.addHandler(pattern, function (text) {
                self.displayImage(text);
            });

            var pattern = {0: 'request', 1: '&key', content: ['display-image', '.', '*']};
            tm.addHandler(pattern, function (text) {
                self.displayImage(text);
            });


            tm.run();

            tm.sendMsg({0: 'tell', content: ['start-conversation']});


            self.modelId = model.get('documents.' + socket.room + '.pysb.modelId');

            //TODO: We now assume that the system is not reset after sbgnviz is connected-- so it keeps the model-id indefinitely
            //We also need to check modelid does not exist in the system
            //Or each time we get a new model id

            if (!self.modelId) {

                var ekbTerm = '"<ekb>' + '' + '</ekb>"';

                tm.sendMsg({0: 'request', content: {0: 'BUILD-MODEL', description: ekbTerm}});
            }

            //Listen to model id response from MRA
            var pattern = {0: 'reply', 1: '&key', content: ['success', '.', '*'], sender: 'MRA'};

            tm.addHandler(pattern, function (text) { //listen to requests
                var contentObj = KQML.keywordify(text.content);


                if (contentObj.modelId) {

                    self.modelId = contentObj.modelId;
                    model.set('documents.' + socket.room + '.pysb.modelId', self.modelId);
                    model.set('documents.' + socket.room + '.pysb.model', contentObj.model);


                    console.log("New model started: " + self.modelId);

                    //console.log(model.get('documents.' + socket.room + '.pysb.model'));
                }


            });


        });
    }
    catch(e){
        console.log(e + " Trips is disconnected.");
    }

    try {
        //Utterances are sent to trips
        socket.on('relayMessageToTripsRequest', function(data){


            // if(data.userId !== agentId){

                //console.log(data);
                var pattern = {0:'tell', content:{0:'started-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
                tm.sendMsg(pattern);

                pattern = {0:'tell', content:{0:'stopped-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
                tm.sendMsg(pattern);

                pattern = {0:'tell', content:{0:'word', 1: data.text, uttnum: data.uttNum, index: 1, channel: 'Desktop',direction:'input'}};
                tm.sendMsg(pattern);

                pattern = {0:'tell', content:{0:'utterance', mode:'text',  uttnum: data.uttNum, text:data.text, channel: 'Desktop',direction:'input'}};
                tm.sendMsg(pattern);
            // }


        });



    }
    catch(e){
        console.log(e + " Trips disconnected.");
    }
    //TRIPS connection should be closed explicitly
    socket.on('disconnect', function(){
        tm.disconnect();
    });

    return this;
}

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    var strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}
