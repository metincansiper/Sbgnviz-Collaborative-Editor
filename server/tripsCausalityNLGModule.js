/**
 * Created by durupina on 5/17/17.
 * This is a Trips module built around the higher-level Causality agent.
 * Its role is to listen to responses from causalityAgent and convert them into English sentences
 */


module.exports = function(){


    var tripsModule = require('./tripsModule.js');
    var tm = new tripsModule(['-name', 'Causality-Translation-Agent']);
    var KQML = require('./KQML/kqml.js');

    /***
     * Corrects PC psite information
     * @param pSite
     * @param letter: S,T,Y
     * @returns {*}
     */
    function editPSite(pSite, letter) {

        if (pSite && pSite.length > 0) {
            if (pSite[0] === letter && pSite[pSite.length - 1] === letter)
                pSite = pSite.slice(0, pSite.length - 1);
        }
        return pSite;
    }


    /***
     * Converts correlation data into NL sentence
     * @param data
     * @returns {string|*}
     */
    function toCorrelationDetailString(data){


        var pMsg1 = "";
        var pMsg2 = "";
        var agentMsg;

        data.pSite1= editPSite(data.pSite1, "S");
       data.pSite2=editPSite(data.pSite2, "S");


       data.pSite1= editPSite(data.pSite1, "T");
       data.pSite2=editPSite(data.pSite2, "T");


       data.pSite1= editPSite(data.pSite1, "Y");
       data.pSite2= editPSite(data.pSite2, "Y");


        if(data.pSite1 !== '-')
            pMsg1 = data.pSite1 + " phosphorylation of " +data.id1;
        else
            pMsg1 =  data.id1 + " total protein";

        if(data.pSite2  !== '-')
            pMsg2 =  "with " +data.pSite2 + " phosphorylation of " +data.id2;
        else
            pMsg2 =  "with " +data.id2 + " total protein";




        var corrVal = parseFloat(data.correlation).toFixed(3);

        agentMsg =  pMsg1 + " has a correlation " +  pMsg2 + " with a value of " +  corrVal + ". ";

        return agentMsg;

    }



    tm.init(function(){
        tm.register();


        var pattern = { 0: 'request', 1:'&key', content: [ 'TRANSLATE-CORRELATION',  '.', '*']};


        //keep track of the current correlation
        tm.addHandler(pattern, function (text) {
            var contentObj = KQML.keywordify(text.content);


            var data = {id1:contentObj.id1, id2: contentObj.id2, pSite1: contentObj.pSite1, pSite2: contentObj.pSite2, correlation: contentObj.correlation};

            var msg =  '"'+toCorrelationDetailString(data)+ '"';

            var response = {0: 'reply', content: {0: 'success', msg: msg, target:contentObj.id2 }, sender:tm.name};

            tm.replyToMsg(text, response);


        });

        tm.run();
        // tm.sendMsg({0: 'tell', content: ['start-conversation']});


    });


}

