/**
 * Created by durupina on 5/17/17.
 * This is a Trips module to enable communication between trips and causalityAgent
 * Its role is to receive and decode messages and transfer them to causalityAgent
 */

module.exports = function(socket, model){

    var tripsModule = require('./tripsModule.js');

    var tm = new tripsModule(['-name', 'Causality-NLG-Agent']);

    tm.init(function() {

        tm.register();

        tm.run();

        tm.sendMsg({0: 'tell', content: ['start-conversation']});

        var pattern = {0: 'request', 1: '&key', content: ['CHISE-TO-NL', '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests


            socket.emit('getCausalityNL', text.content[2], function(res) {

                console.log(res);
                var response = {0:'reply', content:{0:'OK', nl: [res]}};

                tm.replyToMsg(text,response);
            });





        });
    });



}

