/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */

module.exports = function(agentId, agentName, socket, model, askHuman){

    var tripsModule = require('./tripsModule.js');
    var tm = new tripsModule(['-name', 'Causality-Interface-Agent']);
    var KQML = require('./KQML/kqml.js');

    var self = this;
    this.modelId;


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

            //TODO: foreach
            for(var i = 0; i < elements.length ;i++){
                indraJson.push(self.makeIndraJson(elements[i]));
            }
            var stringJson = JSON.stringify(indraJson);
            stringJson = '"'+  stringJson.replace(/["]/g, "\\\"") + '"';


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

        tm.sendMsg({0: 'request', content: {0: 'CHOOSE-SENSE', 'ekb-term': termStr}});


        var patternXml = {0: 'reply', 1: '&key', content: ['SUCCESS', '.', '*']};

        tm.addHandler(patternXml, function (textXml) {

            if(textXml.content && textXml.content.length >= 2 && textXml.content[2].length > 0) {


                 var contentObj = KQML.keywordify(textXml.content[2][0]);
                 var termName = trimDoubleQuotes(contentObj.name);

                if (callback) callback(termName);
            }
        });
    }


    tm.init(function(){

        tm.register();

        var textCorrelationRequestFromBA;


        //Listen to the natural language sentences from the translation agent and display them
        var pattern = { 0: 'reply', 1:'&key', content: [ 'success',  '.', '*'], sender: 'CAUSALITY-TRANSLATION-AGENT'};
        tm.addHandler(pattern, function (text) {

            var contentObj = KQML.keywordify(text.content);


            if(contentObj) {

                var msg = {agentName, userId: agentId, room: socket.room, date: +(new Date)};
                contentObj.msg = trimDoubleQuotes(contentObj.msg);
                msg.comment = contentObj.msg ;

                //model.add('documents.' + msg.room + '.messages', msg);

                //Send any response so that bioagents resolve the subgoal
                tm.replyToMsg(textCorrelationRequestFromBA, {0: 'reply', content: {0: 'correlation success',  target:contentObj.target, correlation: contentObj.correlation}});

                console.log(contentObj.target);

            }

        });

        //Listen to queries about the causal relationship between to genes
        //E.g. How does MAPK1 affect JUND?
        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causal-path',  '.', '*']};
        tm.addHandler(pattern, function (text) { //listen to requests

            var contentObj = KQML.keywordify(text.content);


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

                            if (self.modelId) {
                                tm.sendMsg({
                                    0: 'request',
                                    content: {
                                        0: 'EXPAND-MODEL',
                                        format: "indra_json",
                                        description: stringJson,
                                        'model-id': self.modelId
                                    }
                                });
                            }
                            else
                                console.log("Model id not initialized.");


                            //console.log(stringJson);
                            var response = {0: 'reply', content: {0: 'success', paths: stringJson}};
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

            if(contentObj) {
                self.getTermName(contentObj.target, function (target) {

                    var queryToRequestMap = {
                        phosphorylation: "phosphorylates",
                        dephosphorylation: "dephosphorylates",
                        activate: "upregulates-expression",
                        increase: "upregulates-expression",
                        inhibit: "downregulates-expression",
                        decrease: "downregulates-expression"
                    }


                    var requestType = queryToRequestMap[contentObj.type] || "modulates";

                    self.requestCausalityElementsFromAgent(target, requestType, function (response) {
                        tm.replyToMsg(text, response);
                    });
                });
            }
        });


        //Listen to queries asking the sources of a causal relationship
        //E.g. What genes phosphorylate MAPK1?
        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causality-source',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            var contentObj = KQML.keywordify(text.content);
            if(contentObj) {

                self.getTermName(contentObj.source, function (source) {

                    var queryToRequestMap = {
                        phosphorylation: "is-dephoshorylated-by",
                        dephosphorylation: "is-dephoshorylated-by",
                        activate: "expression-is-upregulated-by",
                        increase: "expression-is-upregulated-by",
                        inhibit: "expression-is-downregulated-by",
                        decrease: "expression-is-downregulated-by"
                    }


                    var requestType = queryToRequestMap[contentObj.type] || "modulates";

                    self.requestCausalityElementsFromAgent(source, requestType, function (response) {
                        tm.replyToMsg(text, response);

                    });
                });
            }

        });


        //Listen to requests for correlation queries
        var pattern = { 0: 'request', 1:'&key', content: [ 'dataset-correlated-entity',  '.', '*']};
        tm.addHandler(pattern, function (text) { //listen to requests
            var contentObj = KQML.keywordify(text.content);

            //Correlation request from BA
            textCorrelationRequestFromBA = text;

            self.getTermName(contentObj.source, function (source) {

                //Request this information from the causalityAgent
                socket.emit('findCorrelation', source, function (data) {


                    // We are not allowed to send a request if null, so put a temporary string
                    var pSite1 = data.pSite1 || '-';
                    var pSite2 = data.pSite2 || '-';

                    //enter data separately to keep the order
                    //tm.sendMsg({0:'request', receiver:'CAUSALITY-TRANSLATION-AGENT', content: {0:'TRANSLATE-CORRELATION', id1: data.id1, id2: data.id2, pSite1: pSite1, pSite2: pSite2, correlation: data.correlation}});

                     tm.replyToMsg(text, {0: 'reply', content: {0: 'correlation success',  target:data.id2, correlation: data.correlation}});


                });
            });
        });


        tm.run();

     //   tm.sendMsg({0: 'tell', content: ['start-conversation']});









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

