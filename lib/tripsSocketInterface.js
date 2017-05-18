/**
 * Created by durupina on 5/17/17.
 */

module.exports = function(socket, model){


    var tripsModule = require('./tripsModule.js');

    var tm = new tripsModule("CausalityAgent");

    tm.init(function(){

        tm.name = 'bsb';
        tm.register();


        var msg ={};
        msg.date = +(new Date);
        msg.userName = socket.userName;
        msg.userId = socket.userId;
        msg.room = socket.room;


        var pattern = {0:'tell',  1:'&key', content:['spoken', '.', '*']};
        tm.addHandler(pattern, function (text) {

            if(text && text.content && text.content[0]==='SPOKEN' && text.content[1] === ':WHAT')
                msg.comment = text.content[2];

            model.add('documents.' + msg.room + '.messages', msg);


        });

        var pattern = {0:'tell',  1:'&key', content:['display-model', '.', '*']};
        tm.addHandler(pattern, function () {
        });


        var pattern = {0:'tell',  1:'&key', content:['display-image', '.', '*']};
        tm.addHandler(pattern, function () {
        });






        var pattern = { 0: 'request', 1:'&key', content: [ 'find-causal-path',  '.', '*']};

        tm.addHandler(pattern, function (text) { //listen to requests

            socket.emit('findCausality', {source: {id: text.content[2], pSite: text.content[4]},
                                         target:{ id: text.content[6], pSite:text.content[8]}}, function(relationship){

                console.log(relationship);
                msg.comment = relationship;

                model.add('documents.' + msg.room + '.messages', msg);


            });
            console.log(text);
        });


        tm.run();



        tm.sendMsg({0: 'tell', content: ['start-conversation']});


        tm.sendMsg({0:'request', content: {0:'find-causal-path', sourceId:'MAPK3', sourceSite:'Y204y', targetId:'CTTN', targetSite:'T401tS405s'}});

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