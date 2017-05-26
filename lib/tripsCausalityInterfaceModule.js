/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */

module.exports = function(socket, model){

    var tripsModule = require('./tripsModule.js');

    var tm = new tripsModule(['-name', 'Causality-Interface-Agent']);

    tm.init(function(){

        // tm.name = 'bsb';
        tm.register();


        //Listen to spoken sentences
        var pattern = {0:'tell',  1:'&key', content:['spoken', '.', '*']};
        tm.addHandler(pattern, function (text) {

            if(text && text.content && text.content[0]==='SPOKEN' && text.content[1] === ':WHAT') {

                var msg = {userName: socket. userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                msg.comment = text.content[2];
                model.add('documents.' + msg.room + '.messages', msg);
            }

        });

        var pattern = {0:'tell',  1:'&key', content:['display-model', '.', '*']};
        tm.addHandler(pattern, function (text) {

            var sbgnModel = text.content[1];
            socket.emit('displayModel', sbgnModel, function () {
            });
        });


        //
        //Receives requests and handles them
        //

        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causal-path',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var target = getGeneNameFromXML(text.content[2]);
            var source = getGeneNameFromXML(text.content[4]);

            var param = {source: {id: source, pSite: ''}, target:{ id: target, pSite:''}};



             console.log(text);
            // console.log(gene1  + ' ' + gene2);

           // console.log(parser.toJson(text.content[2]));
            //Request this information from the causalityAgent
            socket.emit('findCausality', param, function(relationship){

                // var msg = {userName: socket.userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                // msg.comment = relationship;
                // model.add('documents.' + msg.room + '.messages', msg);


                //var strResponse = ''' + source +'\t'+ target + ' \t' + relationship + ''' ;



                 //var indraJson =  '''+'[{modification:{enz:MAPK1}}]' + ''' ;
              //  var indraJson = [{sub: {name:source}}];  //'''+ JSON.stringify([{'modification':{'enz': source}}]) + ''';

                //var indraJson = [{'\\"residue\\"': '\\"T\\"', '\\"sub\\"': { '\\"name\\"': '\\"BRAF\\"'},  '\\"position\\"': '\\"202\\"', '\\"enz\\"': { '\\"name\\"': '\\"BRAF\\"'}, '\\"type\\"': '\\"Phosphorylation\\"', '\\"id\\"': '\\"8285c177-0e3f-473c-a327-2745f52be9e4\\"'}];


                var indraJson = [{
                        'type': 'Activation',
                        'subj': {
                            'name': 'cytochrome_P450',
                            'db_refs': {
                                'text': 'cytochrome P450',
                                'pf': 'PF00067'
                            }
                        },
                        'obj': {
                            'name': 'metabolism',
                            'db_refs': {
                                'go': 'GO:0008152',
                                'text': 'metabolism'
                            }
                        },
                        'obj_activity': 'activity',
                        'evidence': [
                            {
                                'source_api': 'reach',
                                'pmid': '27550238',
                                'text': 'Both drugs undergo extensive hepatic metabolism mediated predominantly by cytochrome P450 family enzymes.',
                                'annotations': {
                                    'found_by': 'Positive_activation_syntax_2_verb'
                                }

                            }

                        ],
                        'id': '42cb7064-a275-4416-a043-a1a6e1e6fb0c'
                    }];

                var stringJson = JSON.stringify(indraJson);
                stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';

                var response = {0:'reply', content:{0:'success', paths: stringJson }};

                tm.replyToMsg(text,response);
                //tm.sendMsg(response);

            });
        });


        var pattern = { 0: 'request', 1:'&key', content: [ 'dataset-correlated-entity',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests


            var param = {datasetId: text.content[2], sourceEntity:text.content[4]};

            //Request this information from the causalityAgent
            socket.emit('findCorrelation', param, function(data){

                var msg = {userName: socket.userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                msg.comment = param.sourceEntity + ' '+ data.pSite1 + ' ' + data.id2 + ' ' + data.pSite2 + ' ' + data.correlation;
                model.add('documents.' + msg.room + '.messages', msg);



                var response = {0:'reply', content:{0:'success', content: {targetEntity: data.id2, targetSite:data.pSite2, sourceSite:data.pSite1, correlation:data.correlation}}};//, inReplyTo:'CorrelationRequest'}};

                tm.replyToMsg(text,response);
               // tm.sendMsg(response);

            });
        });


        tm.run();

        tm.sendMsg({0: 'tell', content: ['start-conversation']});
    });

    socket.on('relayMessageToTripsRequest', function(data){


        var pattern = {0:'tell', content:{0:'started-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
        tm.sendMsg(pattern);

        pattern = {0:'tell', content:{0:'stopped-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
        tm.sendMsg(pattern);

        pattern = {0:'tell', content:{0:'word', 1: data.text, uttnum: data.uttNum, index: 1, channel: 'Desktop',direction:'input'}};
        tm.sendMsg(pattern);

        pattern = {0:'tell', content:{0:'utterance', mode:'text',  uttnum: data.uttNum, text:data.text, channel: 'Desktop',direction:'input'}};
        tm.sendMsg(pattern);

    });

}

function getGeneNameFromXML(xml){

    var nameInd;
    //do this twice
    for(var i = 0; i < 2; i++) {
        nameInd = xml.indexOf('name=');

        xml = xml.slice(nameInd + 7, xml.length );
    }

    var lastInd = xml.indexOf('\\');

    var res = xml.slice(0, lastInd);

    return res;

}