/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */

module.exports = function(socket, model){

    var tripsModule = require('./tripsModule.js');

    var tm = new tripsModule(['-name', 'Causality-Interface-Agent']);


    var self = this;

    this.makeIndraJson = function(causality){
        var indraJson;

        if(causality.rel.toUpperCase().indexOf("PHOSPHORYLATES")>=0) {
            indraJson = { type: 'Phosphorylation',  enz: {name: causality.id1, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res1, position: causality.pos1}]},
                sub: {name: causality.id2},residue: causality.res2, position:causality.pos2};
        }
        else if(causality.rel.toUpperCase().indexOf("IS-PHOSPHORYLATED-BY")>=0) {//phosphorylation but with different source and targets
            indraJson = { type: 'Phosphorylation',  enz: {name: causality.id2, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res2, position: causality.pos2}]},
                sub: { name: causality.id1},residue: causality.res1, position:causality.pos1};
        }
        else if(causality.rel.toUpperCase().indexOf("DEPHOSPHORYLATES")>=0) {
            indraJson = { type: 'Dephosphorylation',  enz: {name: causality.id1, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res1, position: causality.pos1}]},
                sub: {name: causality.id2},residue: causality.res2, position:causality.pos2};
        }
        else if(causality.rel.toUpperCase().indexOf("IS-DEPHOSPHORYLATED-BY")>=0) {//phosphorylation but with different source and targets
            indraJson = { type: 'Dephosphorylation',  enz: {name: causality.id2, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res2, position: causality.pos2}]},
                sub: { name: causality.id1},residue: causality.res1, position:causality.pos1};
        }

        //TODO: no pSite information can be displayed for now
        else if(causality.rel.toUpperCase().indexOf("UPREGULATES-EXPRESSION")>=0) {
            indraJson = { type: 'IncreaseAmount',  subj: {name: causality.id1},
                obj: {name: causality.id2},residue: causality.res2, position:causality.pos2};
        }
        else if(causality.rel.toUpperCase().indexOf("EXPRESSION-IS-UPREGULATED-BY")>=0) {//phosphorylation but with different source and targets
            indraJson = { type: 'IncreaseAmount',  subj: {name: causality.id2},
                obj: { name: causality.id1},residue: causality.res1, position:causality.pos1};
        }
        else if(causality.rel.toUpperCase().indexOf("DOWNREGULATES-EXPRESSION")>=0) {
            indraJson = { type: 'DecreaseAmount',  subj: {name: causality.id1},
                obj: {name: causality.id2},residue: causality.res2, position:causality.pos2};
        }
        else if(causality.rel.toUpperCase().indexOf("EXPRESSION-IS-DOWNREGULATED-BY")>=0) {//phosphorylation but with different source and targets
            indraJson = { type: 'DecreaseAmount',  subj: {name: causality.id2},
                obj: { name: causality.id1},residue: causality.res1, position:causality.pos1};
        }

        return indraJson;

    }

    this.requestCausalityElementsFromAgent = function(id, rel, callback){

        var param = {id: id, pSite: '', rel:rel};


        //Request this information from the causalityAgent
        socket.emit("findCausalityTargets", param, function(elements){
            var indraJson = [];

            for(var i = 0; i < elements.length ;i++){
                indraJson.push(self.makeIndraJson(elements[i]));

            }
            var stringJson = JSON.stringify(indraJson);
            stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';

            console.log(stringJson);


            if(indraJson.length > 0)
                 response = {0:'reply', content:{0:'success', paths: stringJson }};
            else
                 response = {0:'reply', content:{0:'failure', 1:'NO_PATH_FOUND'}};



            if(callback) callback(response);


        });

    }


    this.getAttributeFromXML = function(attName, cnt, xml){
        var nameInd;
        var res = "";
        //do this twice
        for(var i = 0; i < cnt; i++) {
            nameInd = xml.indexOf(attName);
            if(nameInd >= 0)
                xml = xml.slice(nameInd+ attName.length + 2, xml.length );
        }
        if(nameInd >=0) {
            var lastInd = xml.indexOf('\\');

            res = xml.slice(0, lastInd);
        }

        return res;

    }


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

            var target = self.getAttributeFromXML("name=",2,  text.content[2]);
            var source = self.getAttributeFromXML("name=",2,  text.content[4]);

            var resTarget =  self.getAttributeFromXML("residue", 1, text.content[2]);
            var resSource =  self.getAttributeFromXML("residue", 1, text.content[4]);

            var posTarget =  self.getAttributeFromXML("position", 1, text.content[2]);
            var posSource =  self.getAttributeFromXML("position", 1, text.content[4]);

            var param = {source: {id: source, pSite: (resSource+posSource+resSource)}, target:{ id: target, pSite:(resTarget+posTarget+resTarget)}};


            console.log(text);
            //Request this information from the causalityAgent
            socket.emit('findCausality', param, function(causality){


                console.log(causality);
                var indraJson;

                if(!causality || !causality.rel)
                    tm.replyToMsg(text,{0:'reply', content:{0:'failure', 1:'NO_PATH_FOUND'}});
                else {


                    indraJson = [self.makeIndraJson(causality)];
                    var stringJson = JSON.stringify(indraJson);
                    stringJson = '"' + stringJson.replace(/["]/g, "\\\"") + '"';

                    console.log(stringJson);
                    var response = {0: 'reply', content: {0: 'success', paths: stringJson}};

                    tm.replyToMsg(text, response);
                }
            });
        });

        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-target',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var source = self.getAttributeFromXML("name=",2,  text.content[2]);

            var queryType = text.content[4];

            console.log("target");
            console.log(source);
            console.log(text);

            var queryType = text.content[4];

            var requestType = "modulates";

            if(queryType) {
                if (queryType.indexOf("dephosphorylation") > 0)
                    requestType = "dephosphorylates";
                else if (queryType.indexOf("phosphorylation") > 0)
                    requestType = "phosphorylates";
                else if (queryType.indexOf("activate") > 0 || queryType.indexOf("increase") > 0)
                    requestType = "upregulates-expression";
                else if (queryType.indexOf("inhibit") > 0 || queryType.indexOf("decrease") > 0)
                    requestType = "downregulates-expression";
            }


            self.requestCausalityElementsFromAgent(source, requestType, function(response){
                // if(response.content[0]==="success")
                    tm.replyToMsg(text,response);
            });

        });

        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-source',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests


            var target = self.getAttributeFromXML("name=",2,  text.content[2]);

            console.log("source");
            console.log(target);
            console.log(text);

            var queryType = text.content[4];

            var requestType = "modulates";

            if(queryType) {
                console.log(queryType);
                if (queryType.indexOf("dephosphorylation") > 0)
                    requestType = "is-dephoshorylated-by";
                else if (queryType.indexOf("phosphorylation") > 0)
                    requestType = "is-phosphorylated-by";
                else if (queryType.indexOf("activate") > 0 || queryType.indexOf("increase") > 0)
                    requestType = "expression-is-upregulated-by";
                else if (queryType.indexOf("inhibit") > 0 || queryType.indexOf("decrease") > 0)
                    requestType = "expression-is-downregulated-by";

                console.log(queryType);
                console.log(requestType);
            }
            self.requestCausalityElementsFromAgent(target, requestType, function(response){
                // if(response.content[0]==="success")
                    tm.replyToMsg(text, response);
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



