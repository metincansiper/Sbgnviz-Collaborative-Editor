/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */

module.exports = function(socket, model, askHuman){

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


        var patternXml = {0: 'reply', 1: '&key', content: ['OK', '.', '*']};

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

        //bob also listens to them
        //Listen to spoken sentences
        var pattern = {0:'tell',  1:'&key', content:['spoken', '.', '*']};
        tm.addHandler(pattern, function (text) {
            var contentObj = KQML.keywordify(text.content);

            if(contentObj) {
                var msg = {userName: socket.userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                msg.comment = trimDoubleQuotes(contentObj.what);
                model.add('documents.' + msg.room + '.messages', msg);
            }

        });


        //Listen to the natural language sentences from the translation agent and display them
        var pattern = { 0: 'reply', 1:'&key', content: [ 'success',  '.', '*'], sender: 'CAUSALITY-TRANSLATION-AGENT'};
        tm.addHandler(pattern, function (text) {

            var contentObj = KQML.keywordify(text.content);


            if(contentObj) {

                var msg = {userName: socket. userName, userId: socket.userId, room: socket.room, date: +(new Date)};
                contentObj.msg = trimDoubleQuotes(contentObj.msg);
                msg.comment = contentObj.msg + " Do you have any causal explanation for this?" ;

                model.add('documents.' + msg.room + '.messages', msg);

                //Send any response so that bioagents resolve the subgoal
                tm.replyToMsg(textCorrelationRequestFromBA, {0: 'reply', content: {0: 'correlation success'}});

            }

        });


        var pattern = {0:'request',  1:'&key', content:['display-sbgn', '.', '*']};
        tm.addHandler(pattern, function (text) {

            var contentObj = KQML.keywordify(text.content);
            if(contentObj) {

                var sbgnModel = contentObj.graph;

                sbgnModel = trimDoubleQuotes(sbgnModel);

                sbgnModel = sbgnModel.replace(/(\\")/g, '"');
                sbgnModel = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + sbgnModel;


                askHuman(socket.userId, socket.room, "mergeSbgn", sbgnModel, function (val) {

                    tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                });

            }

        });


        var pattern = {0:'request',  1:'&key', content:['display-image', '.', '*']};
        tm.addHandler(pattern, function (text) {

            //console.log(text.content);
            var contentObj = KQML.keywordify(text.content);
            if(contentObj) {

                contentObj.img = trimDoubleQuotes(contentObj.img);

                var imgData = {
                    img: contentObj.img,
                    tabIndex: contentObj.tabIndex,
                    tabLabel: contentObj.tabLabel,
                    fileName: contentObj.fileName
                }
                askHuman(socket.userId, socket.room, "addImage", imgData, function (val) {

                    tm.replyToMsg(text, {0: 'reply', content: {0: 'success'}});
                });

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

                            if(self.modelId){
                                tm.sendMsg( {0:'request',  content:{0: 'EXPAND-MODEL',  format:"indra_json", description: stringJson, 'model-id': self.modelId}});
                            }
                            else
                                console.log("Model id not initialized.")


                            //console.log(stringJson);
                            var response = {0: 'reply', content: {0: 'success', paths: stringJson}};
                            tm.replyToMsg(text, response);
                        }
                    });

                    //self.proposeGoal(text, contentObj.goal, contentObj.what);


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
                    tm.sendMsg({0:'request', receiver:'CAUSALITY-TRANSLATION-AGENT', content: {0:'TRANSLATE-CORRELATION', id1: data.id1, id2: data.id2, pSite1: pSite1, pSite2: pSite2, correlation: data.correlation}});


                });
            });
        });


        tm.run();

       tm.sendMsg({0: 'tell', content: ['start-conversation']});



       self.modelId  = model.get('documents.' + socket.room + '.pysb.modelId');
       if(!self.modelId) {

           var ekbTerm = '"<ekb>' + '' + '</ekb>"';


           tm.sendMsg({0: 'request', content: {0: 'BUILD-MODEL', description: ekbTerm}});
       }

        //Listen to model id response
        var pattern = { 0: 'reply', 1:'&key', content: [ 'success',  '.', '*'], sender: 'MRA'};

        tm.addHandler(pattern, function (text) { //listen to requests
            var contentObj = KQML.keywordify(text.content);


            if(contentObj.modelId) {
                self.modelId = contentObj.modelId;
                model.set('documents.' + socket.room + '.pysb.modelId', self.modelId);
            }


        });


        //self.proposeGoal();



    });

    //Utterances are sent to trips
    socket.on('relayMessageToTripsRequest', function(data){

        //BsB relays everything to trips anyway

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




/***
 * Agent initiates a new goal
 */
this.proposeGoal = function(text, goalId, what){

    // tm.sendMsg({0:'TELL', content: {0:'SET-SYSTEM-GOAL', id:'NIL', what:'NIL', context:'NIL'}});
    //
    // tm.sendMsg({0:'REQUEST', content: {0:'PROPOSE', content: {0:'what', id:'G1', as:{0:'goal'}},
    //     context: {
    //         0: {0: 'ONT::RELN', 1: 'A1', 'instance-of': 'ONT::CREATE', agent: 'A0', 'affected-result': 'A2'},
    //         1: {0:'ONT::THE',   1: 'A0', 'instance-of': 'ONT::PERSON', equals: 'ONT::US'},
    //         2: {0:'ONT::A',   1: 'A2', 'instance-of': 'ONT::REPRESENTATION'}
    //     }
    // }});

    // tm.sendMsg({0:'TELL', content: {0:'SET-SYSTEM-GOAL', id:'NIL', what:'NIL', context:'NIL'}});


    // tm.sendMsg({0:'REQUEST', content: {0:'PROPOSE', content: {0:'ask-wh', id:'C00021', what:'ONT::V44001' , query:'ONT::V44002', as:{0:'query-in-context', goal:'NIL'}},
    //     context: {
    //          0: {0: 'ONT::A', 1: 'ONT::V44001', 'instance-of': 'ONT::STATUS'},
    //         1: {0: 'ONT::EVENT', 1: 'ONT::V44002', 'instance-of': 'ONT::MODULATE', force:'ONT::TRUE', agent: 'ONT::V44003', "affected-result": 'ONT::V44004'},
    //         2: {0:'ONT::TERM',   1: 'ONT::V44003', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::KRAS'},
    //         3: {0:'ONT::TERM',   1: 'ONT::V44004', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::MAPK-3'}
    //     }
    // }});


    // tm.sendMsg({0:'REQUEST', content:{0: 'GENERATE',  content: {0:'ONT::PROPOSE', content: {0:'ADOPT', id:'SPG::C00001', what:'ONT::V44001' , as:{0:'goal'}},
    //     context:{
    //         0: {0: 'ONT::RELN', 1: 'ONT::V44001', 'instance-of': 'ONT::CREATE',  "affected-result": 'ONT::V44003'},
    //         1: {0:'ONT::TERM',   1: 'ONT::V44002', 'instance-of': 'ONT::PERSON', equals:'ONT::USER', 'refers-to':'ONT::USER'},
    //         2: {0:'ONT::A',   1: 'ONT::V44003',  "instance-of": 'ONT::REPRESENTATION'}
    //
    // }}}});


    // tm.sendMsg({0:'REQUEST', content: {
    //     0: 'PROPOSE',
    //     content: {
    //         0: 'ASK-WH',
    //         id: 'C00123',
    //         what: 'ONT::V44001',
    //         query: 'ONT::V44008',
    //         as: {0: 'QUERY-IN-CONTEXT', goal: goalId}
    //     },
    //     context: {
    //         0: {0: 'ONT::A', 1: 'ONT::V44001', 'instance-of': 'ONT::STATUS', suchthat: 'ONT::V44008'},
    //         //1:{0: 'ONT::RELN', 1:'ONT::V44008'},
    //         1: {
    //             0: 'ONT::RELN',
    //             1: 'ONT::V44008',
    //             'instance-of': 'ONT::MODULATE',
    //             agent: 'ONT::V44003',
    //             affected: 'ONT::V44004'
    //         },
    //         2: {0: 'ONT::TERM', 1: 'ONT::V44003', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::KRAS'},
    //         3: {0: 'ONT::TERM', 1: 'ONT::V44004', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::MAPK-3'}
    //     }
    // }});

    // //BA successfully creates goal here
    // var whatId = 'w1'; //''ONT::V44012';
    // var id = 'SPG::C00045';
    // var queryId = 'ONT::V44008';
    // var agentId = 'ONT::V44003';
    // var affectedId = 'ONT::V44004';
    //
    // tm.sendMsg({0:'REQUEST', content:{0: 'EVALUATE',
    //     content: {
    //         0: 'ADOPT',
    //         id: id ,
    //         what: whatId,
    //         as: {0: 'SUBGOAL', of: goalId}
    //     },
    //     context: {
    //         0: {0: 'ONT::RELN', 1: whatId, 'instance-of': 'ONT::CREATE', 'affected-result': affectedId},
    //         1: {
    //             0: 'ONT::A',
    //             1: affectedId,
    //             'instance-of': 'ONT::BUILD-MODEL'
    //         }
    //     }
    // }});

    // tm.sendMsg({0:'REQUEST', content:{0: 'GENERATE', content: {
    //         0: 'ONT::PROPOSE',
    //         content: {
    //             0: 'ADOPT',
    //             id: id ,
    //             what: whatId,
    //             as: {0: 'SUBGOAL', of: goalId}
    //         },
    //         context: {
    //             0: {0: 'ONT::RELN', 1: whatId, 'instance-of': 'ONT::CREATE', 'affected-result': affectedId},
    //             1: {
    //                 0: 'ONT::A',
    //                 1: affectedId,
    //                 'instance-of': 'ONT::BUILD-MODEL'
    //             }
    //         }},
    // context: {
    //     0: {0: 'ONT::RELN', 1: whatId, 'instance-of': 'ONT::CREATE', 'affected-result': affectedId},
    //     1: {
    //         0: 'ONT::A',
    //         1: affectedId,
    //         'instance-of': 'ONT::BUILD-MODEL'
    //     }}}});


    //TODO in generate.lisp
    // var whatId = 'ONT::V44012';
    // var id = 'SPG::C00045';
    // var queryId = 'ONT::V44008';
    // var agentId = 'ONT::V44003';
    // var affectedId = 'ONT::V44004';
    //
    // tm.sendMsg({0:'REQUEST', content:{0: 'GENERATE',  content: {
    //     0: 'ONT::PROPOSE',
    //     content: {
    //         0: 'ASK-WH',
    //         id: id ,
    //         what: whatId,
    //         query: queryId,
    //         as: {0: 'QUERY-IN-CONTEXT', goal: goalId}
    //     },
    //     context: {
    //         0: {0: 'ONT::A', 1: whatId, 'instance-of': 'ONT::STATUS'},
    //         1: {
    //             0: 'ONT::EVENT',
    //                 1: queryId,
    //                 'instance-of': 'ONT::MODULATE',
    //                 agent: agentId,
    //                 affected: affectedId,
    //         },
    //         2: {0: 'ONT::TERM', 1: agentId, 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::KRAS'},
    //         3: {0: 'ONT::TERM', 1: affectedId, 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::MAPK-3'}
    //     }
    // },  context: {
    //
    //     0: {0: 'ONT::A', 1: whatId, 'instance-of': 'ONT::STATUS'},
    //     1: {
    //         0: 'ONT::EVENT',
    //         1: queryId,
    //         'instance-of': 'ONT::MODULATE',
    //         agent: agentId,
    //         affected: affectedId,
    //     },
    //     2: {0: 'ONT::TERM', 1: agentId, 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::KRAS'},
    //     3: {0: 'ONT::TERM', 1: affectedId, 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::MAPK-3'},
    //     4:{ query: 'How does X affect Y ???'}
    // }}});

    // tm.replyToMsg(text, {0:'REPLY', content:{
    //     0: 'PROPOSE',
    //     content: {
    //         0: 'ASK-WH',
    //         id: 'SPG::C00045',
    //         what: what,
    //         query: 'ONT::V44008',
    //         as: {0: 'QUERY-IN-CONTEXT', goal: goalId}
    //     },
    //     context: {
    //        0: {0: 'ONT::A', 1: 'ONT::V44001', 'instance-of': 'ONT::STATUS', suchthat: 'ONT::V44008'},
    //         //1:{0: 'ONT::RELN', 1:'ONT::V44008'},
    //         1: {
    //             0: 'ONT::RELN',
    //             1: 'ONT::V44008',
    //             'instance-of': 'ONT::MODULATE',
    //             agent: 'ONT::V44003',
    //             affected: 'ONT::V44004'
    //         },
    //         2: {0: 'ONT::TERM', 1: 'ONT::V44003', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::KRAS'},
    //         3: {0: 'ONT::TERM', 1: 'ONT::V44004', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::MAPK-3'}
    //     }
    // }});



    // tm.sendMsg({0:'REQUEST', content:{0: 'GENERATE',  content: {
    //     0: 'ONT::PROPOSE',
    //     content: {
    //         0: 'ASK-WH',
    //         id: 'SPG::C00001',
    //         what: 'ONT::V44001',
    //         query: 'ONT::V44002',
    //         as: {0: 'QUERY-IN-CONTEXT', goal: 'SPG::C00005'}
    //     },
    //     context: {
    //         0: {0: 'ONT::A', 1: 'ONT::V44002', 'instance-of': 'ONT::BUILD', 'affected-result': 'st1'},
    //         1: {0: 'ONT::A', 1: 'st1', 'instance-of': 'ONT::STAIRS', size: 'ONT:V44001'},
    //
    //     }
    // }}});

    // tm.sendMsg({0:'REQUEST', content:{0: 'GENERATE',  content: {
    //     0: 'ONT::REQUEST',
    //     content: {
    //         0: 'ONT::PROPOSE-GOAL',
    //         agent: 'ONT::USER',
    //
    //     }
    //
    // }}});


    // tm.sendMsg({0:'PROPOSE', content: {0:'ask-wh', id:'C00001', what:'ONT::V44001' , query:'ONT::V44002', as:{0:'query-in-context', goal:'C00005'}},
    //     context: {
    //         0: {0: 'ONT::A', 1: 'ONT::V44001', 'instance-of': 'ONT::STATUS'},
    //         1: {0: 'ONT::EVENT', 1: 'ONT::V44002', 'instance-of': 'ONT::MODULATE', force:'ONT::TRUE', agent: 'ONT::V44003', "affected-result": 'ONT::V44004'},
    //         2: {0:'ONT::TERM',   1: 'ONT::V44003', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::KRAS'},
    //         3: {0:'ONT::TERM',   1: 'ONT::V44004', 'instance-of': 'ONT::GENE-PROTEIN', name: 'W::MAPK-3'}
    //     }
    // });

    //

    // tm.sendMsg({0:'TELL', content: {0:'SET-SYSTEM-GOAL',  id:'G1', what:'A1' ,
    //     context: {
    //         0: {0: 'ONT::EVENT', 1: 'A1', 'instance-of': 'ONT::MODULATE', force:'ONT::TRUE', agent: 'A0', affected: 'A2'},
    //         1: {0:'ONT::TERM',   1: 'A0', 'instance-of': 'ONT::GENE-PROTEIN', name: 'KRAS', suchthat: 'A1'},
    //         2: {0:'ONT::TERM',   1: 'A2', 'instance-of': 'ONT::GENE-PROTEIN', name: 'MAPK3'}
    //     }
    // }});
    //
    // tm.sendMsg({0:'TELL', content: {0:'SET-SYSTEM-GOAL',  id: 'C00005' , what:'V44001',
    //     context: {
    //         0: {0: 'ONT::RELN', 1: 'V44001', 'instance-of': 'ONT::CREATE', "affected-result": 'A2'},
    //         1: {0:'ONT::A',   1: 'A2',  "instance-of": 'ONT::BUILD-MODEL'}
    //     }
    //  }});

    // tm.sendMsg({0:'PROPOSE', content: {0:'ADOPT',  id: 'C00005' , what:'V44001', as:{0:'goal'}},
    //         context: {
    //             0: {0: 'ONT::RELN', 1: 'V44001', 'instance-of': 'ONT::CREATE', agent: "A0", "affected-result": 'A2'},
    //             1: {0:'ONT::A',   1: 'A2',  "instance-of": 'ONT::BUILD-MODEL'}
    //         }
    //     });


}
