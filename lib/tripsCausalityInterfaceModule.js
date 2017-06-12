/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */

module.exports = function(socket, model){

    var tripsModule = require('./tripsModule.js');
    var tm = new tripsModule(['-name', 'Causality-Interface-Agent']);
    var KQML = require('./KQML/kqml.js');

    var self = this;

    const indraRelationMap ={
        "PHOSPHORYLATES": "Phosphorylation",
        "IS-PHOSPHORYLATED-BY": "Phosphorylation",
        "IS-DEPHOSPHORYLATED-BY": "Dephosphorylation",
        "UPREGULATES-EXPRESSION": "IncreaseAmount",
        "EXPRESSION-IS-UPREGULATED-BY":"IncreaseAmount",
        "DOWNREGULATES-EXPRESSION": "DecreaseAmount",
        "EXPRESSION-IS-DOWNREGULATED-BY":"DecreaseAmount"
    }

    /***
     * Converts the causal relationship information into JSON format so that INDRA can translate it into NL
     * @param causality : specific causal relationship with two genes
     * @returns {*}
     */
    this.makeIndraJson = function(causality){
        var indraJson;
        causality.rel = causality.rel.toUpperCase();

        //INDRA requires site info to be null if empty
        if(causality.pos1 === "") causality.pos1 = null;
        if(causality.res1 === "") causality.res1 = null;
        if(causality.pos2 === "") causality.pos2 = null;
        if(causality.res2 === "") causality.res2 = null;


        var relType = indraRelationMap[causality.rel];

        if(causality.rel.indexOf("PHOSPHO")>=0) {
            if(causality.rel.indexOf("IS") >= 0) //passive
                indraJson = { type: relType,  enz: {name: causality.id2, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res2, position: causality.pos2}]},
                    sub: { name: causality.id1},residue: causality.res1, position:causality.pos1};
            else
                indraJson = { type: relType,  enz: {name: causality.id1, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res1, position: causality.pos1}]},
                    sub: {name: causality.id2},residue: causality.res2, position:causality.pos2};
        }
        else {
            if(causality.rel.indexOf("IS") >= 0)//passive
                indraJson = { type: relType,  subj: {name: causality.id2, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res2, position: causality.pos2}]},
                    obj: { name: causality.id1},residue: causality.res1, position:causality.pos1};
            else
                indraJson = { type: relType,  subj: {name: causality.id1, mods: [{ mod_type: 'phosphorylation', is_modified: true, residue: causality.res1, position: causality.pos1}]},
                    obj: {name: causality.id2},residue: causality.res2, position:causality.pos2};
        }


        return indraJson;

    }

    /***
     * Sends queries to CausalityAgent.js
      * @param id: Name of the gene to query
     * @param rel: Specific causal relationship
     * @param callback : Called when CausalityAgent returns an answer
     */
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

           // console.log(stringJson);


            if(indraJson.length > 0)
                 response = {0:'reply', content:{0:'success', paths: stringJson }};
            else
                 response = {0:'reply', content:{0:'failure', 1:'NO_PATH_FOUND'}};


            if(callback) callback(response);

        });

    }


    /***
     * Gets the standardized name of the gene from an EKB XML string
     * by sending a request to sense prioritization agent
     * @param termStr : EKB XML string
     * @param callback : Called when sense prioritization agent returns an answer
     */
    this.getTermName = function(termStr, callback) {
        var xmlTerm = trimDoubleQuotes(termStr);

        var ekbTerm = '"<ekb>' + xmlTerm + '</ekb>"';

        tm.sendMsg({0: 'request', content: {0: 'CHOOSE-SENSE', 'ekb-term': ekbTerm}});


        //console.log(ekbTerm);
        var patternXml = {0: 'reply', 1: '&key', content: ['OK', '.', '*']};


        tm.addHandler(patternXml, function (textXml) {

            var contentObj = KQML.keywordify(textXml.content[2][0]);

            var termName = trimDoubleQuotes(contentObj.name);

            if (callback) callback(termName);
        });
    }

    tm.init(function(){

        tm.register();

        var textCorrelationRequestFromBA;

        //Listen to spoken sentences
        var pattern = {0:'tell',  1:'&key', content:['spoken', '.', '*']};
        tm.addHandler(pattern, function (text) {

            if(text && text.content && text.content[0]==='SPOKEN' && text.content[1] === ':WHAT') {

                var msg = {userName: socket. userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                msg.comment = text.content[2];
                model.add('documents.' + msg.room + '.messages', msg);
            }

        });


        //Listen to the natural language sentences from the translation agent and display them
        var pattern = { 0: 'reply', 1:'&key', content: [ 'success',  '.', '*'], sender: 'CAUSALITY-TRANSLATION-AGENT'};
        tm.addHandler(pattern, function (text) {

            var contentObj = KQML.keywordify(text.content);
            //console.log(contentObj);

            if(contentObj) {

                var msg = {userName: socket. userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                msg.comment = contentObj.msg + " .Do you have any causal explanation for this?" ;

                model.add('documents.' + msg.room + '.messages', msg);

                //Send any response so that bioagents resolve the subgoal
                tm.replyToMsg(textCorrelationRequestFromBA, {0: 'reply', content: {0: 'correlation success'}});

            }

        });


        var pattern = {0:'tell',  1:'&key', content:['display-model', '.', '*']};
        tm.addHandler(pattern, function (text) {

            var sbgnModel = text.content[1];
            socket.emit('displayModel', sbgnModel, function () {
            });
        });


        var pattern = {0:'request',  1:'&key', content:['update-causality-model', '.', '*']};
        tm.addHandler(pattern, function (text) {

            console.log("updating causality model");
            console.log(text);

            //Send any response so that bioagents resolve the subgoal
            tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});


            // var sbgnModel = text.content[1];
            // socket.emit('displayModel', sbgnModel, function () {
            // });
        });

        //Listen to queries about the causal relationship between to genes
        //E.g. How does MAPK1 affect JUND?
        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causal-path',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var contentObj = KQML.keywordify(text.content);

            console.log("causal-path query");
            console.log(text.content);

            self.getTermName(contentObj.source, function (source) {
                self.getTermName(contentObj.target, function (target) {

                    var resSource = '';
                    var posSource = '';
                    var resTarget = '';
                    var posTarget = '';


                    var param = {
                        source: {id: source, pSite: (resSource + posSource + resSource)},
                        target: {id: target, pSite: (resTarget + posTarget + resTarget)}
                    };




                    //Request this information from the causalityAgent
                    socket.emit('findCausality', param, function (causality) {
                        var indraJson;


                        if (!causality || !causality.rel)
                            tm.replyToMsg(text, {0: 'reply', content: {0: 'failure', 1: 'NO_PATH_FOUND'}});
                        else {


                            indraJson = [self.makeIndraJson(causality)];
                            var stringJson = JSON.stringify(indraJson);
                            stringJson = '"' + stringJson.replace(/["]/g, "\\\"") + '"';

                            //console.log(stringJson);
                            var response = {0: 'reply', content: {0: 'success', paths: stringJson}};


                            console.log("Responding to find-causal-path");
                            console.log(response);

                            tm.replyToMsg(text, response);
                        }
                    });


            });
            });

        });

        //Listen to queries asking the targets of a causal relationship
        //E.g. What genes does MAPK1 phosphorylate?
        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-target',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var contentObj = KQML.keywordify(text.content);



            self.getTermName(contentObj.target, function (source) {

                var queryToRequestMap = {
                    phosphorylation: "phosphorylates",
                    dephosphorylation: "dephosphorylates",
                    activate: "upregulates-expression",
                    increase: "upregulates-expression",
                    inhibit: "downregulates-expression",
                    decrease: "downregulates-expression"
                }


                var  requestType = queryToRequestMap[contentObj.type] || "modulates";

                self.requestCausalityElementsFromAgent(source, requestType, function (response) {
                    tm.replyToMsg(text, response);
                });
            });
        });


        //Listen to queries asking the sources of a causal relationship
        //E.g. What genes phosphorylate MAPK1?
        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-source',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var contentObj = KQML.keywordify(text.content);



            var queryType = contentObj.type;

            self.getTermName(contentObj.source, function (target) {

                var queryToRequestMap = {
                    phosphorylation: "is-dephoshorylated-by",
                    dephosphorylation: "is-dephoshorylated-by",
                    activate: "expression-is-upregulated-by",
                    increase: "expression-is-upregulated-by",
                    inhibit: "expression-is-downregulated-by",
                    decrease: "expression-is-downregulated-by"
                }


                var  requestType = queryToRequestMap[contentObj.type] || "modulates";


                self.requestCausalityElementsFromAgent(target, requestType, function (response) {
                    tm.replyToMsg(text, response);



                });
            });

        });


        //Listen to requests for correlation queries

        var pattern = { 0: 'request', 1:'&key', content: [ 'dataset-correlated-entity',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests


            var contentObj = KQML.keywordify(text.content);

            console.log("correlation requested");
            console.log(contentObj);

            //Correlation request from BA
            textCorrelationRequestFromBA = text;

            self.getTermName(contentObj.source, function (source) {


                //Request this information from the causalityAgent
                socket.emit('findCorrelation', source, function (data) {


                    console.log(data);

                    // We are not allowed to send a request if null, so put a temporary string
                    var pSite1 = data.pSite1 || '-';
                    var pSite2 = data.pSite2 || '-';

                    //enter data separately to keep the order
                    tm.sendMsg({0:'request', content: {0:'TRANSLATE-CORRELATION', id1: data.id1, id2: data.id2, pSite1: pSite1, pSite2: pSite2, correlation: data.correlation}});



                });
            });
        });


        tm.run();

        tm.sendMsg({0: 'tell', content: ['start-conversation']});


        var ekbTerm = '"<ekb>' + '' + '</ekb>"';


        tm.sendMsg( {0:'request',  content:{0: 'BUILD-MODEL',  description: ekbTerm}});



    });

    //Utterances are sent to trips
    socket.on('relayMessageToTripsRequest', function(data){


        //console.log(data);
        var pattern = {0:'tell', content:{0:'started-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
        tm.sendMsg(pattern);

        pattern = {0:'tell', content:{0:'stopped-speaking', mode:'text', uttnum: data.uttNum, channel: 'Desktop', direction:'input'}};
        tm.sendMsg(pattern);

        pattern = {0:'tell', content:{0:'word', 1: data.text, uttnum: data.uttNum, index: 1, channel: 'Desktop',direction:'input'}};
        tm.sendMsg(pattern);

        pattern = {0:'tell', content:{0:'utterance', mode:'text',  uttnum: data.uttNum, text:data.text, channel: 'Desktop',direction:'input'}};
        tm.sendMsg(pattern);

    });


    //TRIPS connection should be closed explicitly
    socket.on('disconnect', function(){
        tm.disconnect();
    })

}

function trimDoubleQuotes(str){
    if(str[0]!== '"' || str[str.length-1]!== '"')
        return str;

    var strTrimmed = str.slice(1, str.length -1);

    return strTrimmed;

}



