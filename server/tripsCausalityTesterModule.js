/**
 * Created by durupina on 5/17/17.
 * This is a Trips module built around the higeher-level Causality agent.
 * Its role is listen to responses from causalityAgent and to send messages to trips and organize the algorithm
 */


module.exports = function(socket, model){


    var tripsModule = require('./tripsModule.js');
    var tm = new tripsModule(['-name', 'Causality-Agent']);

    var geneContext = "MAPK3"; //the gene in context for now
    var currCorr;


    tm.init(function(){
        tm.register();

        tm.run();


        var pattern = { 0: 'reply', 1:'&key', content: [ 'success',  '.', '*'], sender: 'CAUSALITY-INTERFACE-AGENT', inReplyTo:'CausalityRequest'};


        //keep track of the current correlation
        tm.addHandler(pattern, function (text) { //listen to success responses from causalityInterface


            var relationship= text.content[2][1];

            console.log(relationship);


        });


        var pattern = { 0: 'reply', 1:'&key', content: [ 'success',  '.', '*'], sender: 'CAUSALITY-INTERFACE-AGENT', inReplyTo:'CorrelationRequest'};


        //keep track of the current correlation
        tm.addHandler(pattern, function (text) { //listen to success responses from causalityInterface

            console.log(text);
            var targetEntity = text.content[2][1];
            var targetSite = text.content[2][3];
            var sourceSite = text.content[2][5];
            var correlation = text.content[2][7];


            currCorr = {pSite1: sourceSite, id2: targetEntity, pSite2: targetSite, correlation: correlation};
            console.log(currCorr);


        });


        //Test messages for now
        tm.sendMsg({0: 'tell', content: ['start-conversation']});



        // tm.sendMsg({0:'request', content: {0:'find-causal-path', sourceId:'MAPK3', sourceSite:'Y204y', targetId:'CTTN', targetSite:'T401tS405s'}});
        //
        // tm.sendMsg({0:'request', content: {0:'find-causal-path', sourceId:'ABC', sourceSite:'Y204y', targetId:'CTTN', targetSite:'T401tS405s'}});
        //
        //
        // tm.sendMsg({0:'request', content: {0:'display-model', sbgn:""}});

  //     tm.sendMsg({0:'request', content: {0:'find-causal-path', sourceId:'MAPK3', sourceSite:'Y204y', targetId:'CTTN', targetSite:'T401tS405s'}, replyWith:'CausalityRequest'});
//       tm.sendMsg({0:'request', content: {0:'dataset-correlated-entity', datasetId:'PNNL1', sourceEntity:geneContext}, replyWith:'CorrelationRequest'});


        //Create a higher-level goal
       //  var goalMsg = {0:'evaluate', receiver:"BA",
       //      content:{0:'adopt', id:"G01", what:"D01", as: 'goal'},
       //      context:[{0:'ONT::RELN', 1:'D01', instanceOf:"ONT::CREATE", agent:"Causality-Agent", affectedResult:"S01"}]};
       //
       // tm.sendMsg(goalMsg);

        //
        //
        //
        // (EVALUATE
        //      :CONTENT (ADOPT :ID G01 :WHAT D01 :AS (GOAL))
        // :CONTEXT (
        //     (ONT::RELN D01 :INSTANCE-OF ONT::CREATE :AGENT A01 :AFFECTED-RESULT S01)
        // (ONT::A A01 :INSTANCE-OF ONT::PERSON :EQUALS ONT::US)
        // (ONT::A S01 :INSTANCE-OF ONT::STAIRS :MOD M01)
        // (ONT::RELN M01 :INSTANCE-OF ONT::ASSOC-WITH :FIGURE S01 :GROUND S02)
        // (ONT::KIND S02 :INSTANCE-OF ONT::STEP :AMOUNT 5)))


    });



}