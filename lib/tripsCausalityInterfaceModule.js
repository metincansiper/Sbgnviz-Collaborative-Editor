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

            var target = getAttributeFromXML("name=",2,  text.content[2]);
            var source = getAttributeFromXML("name=",2,  text.content[4]);

            var resTarget =  getAttributeFromXML("residue", 1, text.content[2]);
            var resSource =  getAttributeFromXML("residue", 1, text.content[4]);

            var posTarget =  getAttributeFromXML("position", 1, text.content[2]);
            var posSource =  getAttributeFromXML("position", 1, text.content[4]);

            var param = {source: {id: source, pSite: (resSource+posSource+resSource)}, target:{ id: target, pSite:(resTarget+posTarget+resTarget)}};


            console.log(text);
            //Request this information from the causalityAgent
            socket.emit('findCausality', param, function(causality){


                console.log(causality);
                var indraJson;

                if(causality.rel.toUpperCase().indexOf("PHOS")>=0) {


                    indraJson = [{ type: causality.rel,  enz: {name: source, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.resPosSource.res, position: causality.resPosSource.pos}]},
                        sub: { name: target},residue: causality.resPosTarget.res, position:causality.resPosTarget.pos}];
                }
                else{
                    indraJson = [{type: causality.rel, sub: {name: source, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.resPosSource.res, position: causality.resPosSource.pos}]},
                        obj: {name: target}, residue: causality.resPosSource.res, position:causality.resPosSource.pos}];

                }

                var stringJson = JSON.stringify(indraJson);
                stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';

                console.log(stringJson);
                var response = {0:'reply', content:{0:'success', paths: stringJson }};

                tm.replyToMsg(text,response);

            });
        });

        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-target',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var source = getAttributeFromXML("name=",2,  text.content[2]);

            console.log(source);
            // var resSource=  getAttributeFromXML("residue", 1, text.content[4]);
            // var posSource =  getAttributeFromXML("position", 1, text.content[4]);
            var param = {id: source, pSite: ''};
            //Request this information from the causalityAgent
            socket.emit('findCausalityTargets', param, function(targets){



                var indraJson = [];

                //TODO: instead of telling all the targets, just tell one as NLG does not know how to say it
                for(var i = 0; i < targets.length; i++){

                    if(targets[i].rel.toUpperCase().indexOf("PHOS")>=0) {


                        indraJson.push({ type: targets[i].rel,  enz: {name: source, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: targets[i].res, position: targets[i].pos}]},
                            sub: { name: targets[i].id},residue: targets[i].res, position:targets[i].pos});
                    }
                    else{
                        indraJson.push({type: targets[i].rel, sub: {name: source, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: targets[i].res, position: targets[i].pos}]},
                            obj: {name: targets[i].id}, residue: targets[i].res, position:targets[i].pos});

                    }

                }
                var stringJson = JSON.stringify(indraJson);
                stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';

                console.log(stringJson);
                var response = {0:'reply', content:{0:'success', paths: stringJson }};

                tm.replyToMsg(text,response);

            });
        });

        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-source',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var target = getAttributeFromXML("name=",2,  text.content[2]);

            console.log(target);
            // var resSource=  getAttributeFromXML("residue", 1, text.content[4]);
            // var posSource =  getAttributeFromXML("position", 1, text.content[4]);
            var param = {id: target, pSite: ''};
            //Request this information from the causalityAgent
            socket.emit('findCausalityTargets', param, function(sources){



                var indraJson = [];

                //TODO: instead of telling all the targets, just tell one as NLG does not know how to say it
                for(var i = 0; i < sources.length; i++){

                    if(sources[i].rel.toUpperCase().indexOf("PHOS")>=0) {


                        indraJson.push({ type: sources[i].rel,  enz: {name: target, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: sources[i].res, position: sources[i].pos}]},
                            sub: { name: sources[i].id},residue: sources[i].res, position:sources[i].pos});
                    }
                    else{
                        indraJson.push({type: sources[i].rel, sub: {name: target, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: sources[i].res, position: sources[i].pos}]},
                            obj: {name: sources[i].id}, residue: sources[i].res, position:sources[i].pos});

                    }

                }
                var stringJson = JSON.stringify(indraJson);
                stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';

                console.log(stringJson);
                var response = {0:'reply', content:{0:'success', paths: stringJson }};

                tm.replyToMsg(text,response);

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


function getAttributeFromXML(attName, cnt, xml){
    var nameInd;
    //do this twice
    for(var i = 0; i < cnt; i++) {
        nameInd = xml.indexOf(attName);

        xml = xml.slice(nameInd+ attName.length + 2, xml.length );
    }

    var lastInd = xml.indexOf('\\');

    var res = xml.slice(0, lastInd);

    return res;

}