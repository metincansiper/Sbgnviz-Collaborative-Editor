var readline = require('readline');
var stream = require('stream');
var fs = require('fs');

var useBiopax = true;

module.exports.start = function(io, model, cancerDataOrganizer){
    var modelManagerList = [];
    var menuList = [];

    var roomList = [];
    var humanList = [];
    var pnnlArr  = [];

    var request = require('request'); //REST call over http/https

    var responseHeaders = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "content-type, accept",
        "access-control-max-age": 10,
        "Content-Type": "application/json"
    };





    var askHuman = function (userId, room, requestStr, data, callback){

        var roomMate = humanList.find(function(human){
            return(human.userId != userId && human.room == room);
        }); //returns the first match


        if(roomMate!= null) {
            var clientSocket = io.sockets.connected[roomMate.socketId];
            clientSocket.emit(requestStr, data, function(val){

                if(callback) callback(val);
            });

        }
        else
            if(callback) callback("fail");
    };


    var readGeneList = function(callback){
        var filePath = './agent-interaction/CausalPath/causative.sif';
        var instream = fs.createReadStream(filePath);
        var rl = readline.createInterface(instream);

        var i = 0;

        var geneList = [];
        rl.on('line', function (line) {


            var vals = line.split("\t");

            var id1 = vals[0].toUpperCase();
            var id2 = vals[2].toUpperCase();

            geneList[id1] = true;
            geneList[id2] = true;

        });

        rl.on('close', function () {

            if(callback) callback(geneList);
        });
    }


    var readPNNLData = function(geneList, callback){

      //  if(Object.keys(pnnlList).length === 0) { //not already in memory
        if(pnnlArr.length <= 0){
            //READ PNNL Data

            var filePathCorr = './agent-interaction/CausalPath/PNNL-ovarian-correlations.txt';
            var instreamCorr = fs.createReadStream(filePathCorr);
            var rlCorr = readline.createInterface(instreamCorr);

            var i = 0;

            rlCorr.on('line', function (line) {


                var vals = line.split("\t");

                var id1 = vals[0].toUpperCase();
                var id2 = vals[1].toUpperCase();


                if (id1.indexOf('/') < 0 && id2.indexOf('/') < 0) { //exclude incorrect formats
                    var idStr1 = id1.split('-');
                    var geneName1 = idStr1[0];
                    var pSite1 = idStr1[1];

                    var idStr2 = id2.split('-');
                    var geneName2 = idStr2[0];
                    var pSite2 = idStr2[1];


                  //  if(Number(vals[2]) < 0.95 ) {

                    if((geneList && (geneList[geneName1] || geneList[geneName2])) || !geneList){


                        pnnlArr.push({
                            id1: geneName1,
                            id2: geneName2,
                            pSite1: pSite1,
                            pSite2: pSite2,
                            correlation: vals[2],
                            pVal: vals[3]
                        });
                        //
                        // if( pnnlList[geneName1])
                        //     pnnlList[geneName1].push({pSite:pSite1, id2: id2,correlation: vals[2], pVal: vals[3]});
                        // else
                        //     pnnlList[geneName1] = [{pSite:pSite1, id2: id2,correlation: vals[2], pVal: vals[3]}];
                        //
                        // //pnnlList.push({id1: id1, id2: id2, correlation: vals[2], pVal: vals[3]});
                        // // if(pSite1!= null)
                        // // console.log(geneName1 + " " + pnnlList[geneName1]);
                        //
                        //
                        //
                        // if( pnnlList[geneName2])
                        //     pnnlList[geneName2].push({pSite:pSite2, id2: id1,correlation: vals[2], pVal: vals[3]});
                        // else
                        //     pnnlList[geneName2] = [{pSite:pSite2, id2: id1, correlation: vals[2], pVal: vals[3]}];


                        i++;
                        console.log(i);
                    }
                }


            });


            rlCorr.on('close', function () {

                console.log("PNNL data reading into memory complete.");
                if (callback) callback(pnnlArr);


            });
        }
        else{
            if (callback) callback(pnnlArr);
        }


    }
    var listenToAgentRequests = function(socket){
        socket.on('agentActiveRoomsRequest', function( callback){
            callback(roomList);
        });


        socket.on('agentCurrentRoomRequest', function( callback){
            callback(roomList[roomList.length - 1]);
        });


        //Agent requests


        socket.on('agentPNNLRequest', function(data, callback){
            // var READ_DATA = true;
            // if(READ_DATA) {


            readGeneList(function(geneList){
                readPNNLData(geneList, callback);
            });
            console.log("Received request");



        });



        socket.on('agentUndoRequest', function(data, callback){ //from computer agent


            try {
                modelManagerList[data.room].undoCommand();
                //we can wait here until agent request is performed

                if(callback) callback("success");
            }
            catch(e){
                console.log(e);
                if(callback) callback("error");

            }


        });


        socket.on('agentRedoRequest', function(data, callback){ //from computer agent

            modelManagerList[data.room].redoCommand();
            if(callback) callback();
        });



        socket.on('agentChangeNameRequest',function(data, callback){

            modelManagerList[data.room].setName(data.userName);
            if(callback) callback();

        });



        //Agent requests
        socket.on('agentSetLayoutPropertiesRequest', function(data, callback){
            modelManagerList[data.room].updateLayoutProperties(data);
            if(callback) callback();
        });

        socket.on('agentGetLayoutPropertiesRequest', function(data, callback){
            var props = modelManagerList[data.room].getLayoutProperties();
            callback(props);

        });

        socket.on('agentSetGeneralPropertiesRequest', function(data, callback){
            modelManagerList[data.room].updateGeneralProperties(data);
            if(callback) callback();
        });

        socket.on('agentGetGeneralPropertiesRequest', function(data, callback){
            var props = modelManagerList[data.room].getGeneralProperties();
            callback(props);

        });


        socket.on('agentSetGridPropertiesRequest', function(data, callback){
            modelManagerList[data.room].updateGridProperties(data);
            if(callback) callback();
        });

        socket.on('agentGetGridPropertiesRequest', function(data, callback){
            var props = modelManagerList[data.room].getGridProperties();
            callback(props);

        });

        socket.on('agentRunLayoutRequest', function(data, callback){
            askHuman(socket.userId, data.room,  "runLayout", null, function(val){
                if (callback) callback(val);
            });


        });

        socket.on('agentAlignRequest',function(data, callback){

            askHuman(socket.userId, data.room,  "align", data, function(val){
                if (callback) callback(val);
            });

        });


        socket.on('agentMergeGraphRequest', function(data, callback){

            var requestStr;
            if(data.type == "sbgn")
                requestStr = "mergeSbgn";
            else //default is json
                requestStr = "mergeJsonWithCurrent";


            askHuman(socket.userId, data.room,  requestStr, data.graph, function(val){
                if (callback) callback(val);
            });


        });


        //done via sockets as data conversion to json is done in menu-functions
        socket.on('agentLoadFileRequest',  function(data, callback){

            if(data.fileType.indexOf(".owl") > -1){


                request.post({
                    url: "http://localhost:8080/SBGNConverterServlet",
                    headers: responseHeaders,
                    form: {reqType: "sbgn", content: data.param}
                }, function(error, response, body){

                    if (error) {
                        console.log(error);
                    } else  {



                        //console.log(body);
                        console.log(response.statusCode);

                        if(response.statusCode == 200) {
                            askHuman(socket.userId, data.room,  "loadFile", data.content, function(val){
                                if (callback) callback(val);
                            });
                        }

                    }
                });

            }
            else
                askHuman(socket.userId, data.room,  "loadFile", data.content, function(val){
                    if (callback) callback(val);
                });
            if (callback) callback("Error");

        });
        socket.on('agentNewFileRequest',  function(data, callback){
            askHuman(socket.userId, data.room,  "newFile", null, function(val){
                if (callback) callback(val);
            });

        });


        socket.on('agentUpdateHighlightStatusRequest', function(data, callback){

            askHuman(socket.userId, data.room,  "updateHighlight", data, function(val){

                if(callback) callback(val);
            });

        });

        socket.on('agentUpdateVisibilityStatusRequest', function(data, callback){


            askHuman(socket.userId, data.room,  "updateVisibility", data, function(val){

                if(callback) callback(val);
            });


        });

        socket.on('agentUpdateExpandCollapseStatusRequest', function(data, callback){


            askHuman(socket.userId, data.room,  "updateExpandCollapse", data, function(val){

                if(callback) callback(val);
            });


        });


        socket.on('agentAddCompoundRequest', function(data, callback) {


            askHuman(socket.userId, data.room,  "addCompound", data, function(val){

                if(callback) callback(val);
            });

        });

        socket.on('agentCloneRequest', function(data, callback) {


            askHuman(socket.userId, data.room,  "clone", data, function(val){

                if(callback) callback(val);
            });

        });


        socket.on('agentSearchByLabelRequest', function(data, callback) {

            askHuman(socket.userId, data.room,  "searchByLabel", data, function(val){

                if(callback) callback(val);
            });

        });
        socket.on('agentGetNodeRequest',function(data, callback){
            var node = modelManagerList[data.room].getModelNode(data.id);
            callback(node);

        });
        socket.on('agentGetEdgeRequest',function(data, callback){

            var edge = modelManagerList[data.room].getModelEdge(data.id);

            callback(edge);

        });

        socket.on('agentAddNodeRequest',function(data, callback){

            // if(useBiopax) {
            //     var msg;
            //
            //     request.post({
            //         url: "http://localhost:8080/PaxtoolsServlet",
            //         headers: responseHeaders,
            //         form: {reqType: "addNode", content: data.param}
            //     }, function (error, response, body) {
            //
            //
            //         if (error) {
            //             if (callback)
            //                 callback("Node adding error: ");
            //
            //         } else { //only open the window if a proper response is returned
            //
            //             var nodeId = menuList[data.userId].addNode(null, data.param.x, data.param.y, data.param.sbgnclass, data.param.sbgnlabel, true);
            //
            //             console.log(body);
            //             if (response.statusCode == 200) {
            //                 if (callback) callback(nodeId);
            //             }
            //             else{
            //                 if (callback)
            //                     callback("Node adding error: " + response.statusCode);
            //             }
            //
            //
            //
            //         }
            //     });
            // }
            // else{
            //  var nodeId = menuList[data.userId].addNode(null, data.param.x, data.param.y, data.param.sbgnclass, data.param.sbgnlabel, true);

            //Ask a human client to perform this operation as we don't know the node id

            askHuman(socket.userId, data.room, "addNode", data,  function(nodeId){
                if (callback) callback(nodeId);
            });


        });

        socket.on('agentAddEdgeRequest',function(data,  callback){
            //we know the edge id so add directly to the model


            var status = modelManagerList[data.room].addModelEdge(data.id, data, "me");
            if(callback) callback(status);
        });


        socket.on('agentDeleteElesRequest',function(data, callback){

            askHuman(socket.userId, data.room,  "deleteEles", data, function(val){



                if(callback) callback(val);
            });



            // var status = modelManagerList[data.userId].deleteModelNode(data.id);
            // if(callback) callback(status);

        });

        socket.on('agentMoveNodeRequest',function(data, callback){
            var status = modelManagerList[data.room].changeModelNodeAttribute("position", data.id, data.pos);
            if(callback) callback(status);

        });

        socket.on('agentChangeNodeAttributeRequest', function(data, callback){
            var status = modelManagerList[data.room].changeModelNodeAttribute(data.attStr, data.id, data.attVal);
            if(callback) callback(status);

        });
        socket.on('agentChangeEdgeAttributeRequest', function(data, callback){
            var status = modelManagerList[data.room].changeModelEdgeAttribute(data.attStr, data.id, data.attVal);

            if(callback) callback(status);

        });

        //Agent wants the history of operations
        socket.on('agentOperationHistoryRequest', function(data, callback){ //
            // from computer agent
            var docPath = 'documents.' + data.room;

            callback(model.get(docPath + '.history'))


        });

        //Agent wants the history of chat messages
        socket.on('agentChatHistoryRequest', function(data, callback){ //from computer agent


            messagesQuery = model.query('messages', {
                room: data.room
            });

            messagesQuery.fetch( function(err){
                if(err) next(err);


                callback(messagesQuery.get());
            });

        });
        socket.on('agentSendImageRequest', function(data, callback){
            console.log("agent sent an image");

          //  console.log(data);
            var status = modelManagerList[socket.room].addImage(data);
            if(callback) callback(status);

        });


        socket.on('agentCBioPortalQueryRequest', function(queryInfo, callback){

            if(queryInfo.queryType == "cancerTypes") {

                callback(cancerDataOrganizer.cancerStudies);


            }

            else if(queryInfo.queryType == "context") {

                cancerDataOrganizer.getAllMutationCounts(queryInfo.proteinName, function (cancerData) {

                    callback(cancerData);

                });
            }
            else if(queryInfo.queryType == "alterations"){

                cancerDataOrganizer.getMutationCountInContext(queryInfo.proteinName, queryInfo.studyId, function(mutationCount){
                    callback(mutationCount);
                });
            }


        });


        socket.on('agentMessage', function( msg, callback){



            msg.date = +(new Date);

            msg.userName = socket.userName;

            model.add('documents.' + msg.room + '.messages', msg);

            //io.in(socket.room).emit("message", msg);

            if(msg.comment && msg.comment.text){
                if (msg.comment.text.indexOf("The most likely context") > -1) { //if agent told about context
                    io.in(socket.room).emit("agentContextQuestion",msg.userId);
                }
            }

            if(callback) callback("success");

        });

        //Agent wants the model
        socket.on('agentPageDocRequest', function(data, callback){ //from computer agent


            if(modelManagerList[data.room]!=null) {
                var pageDoc = modelManagerList[data.room].getPageDoc();


                callback(pageDoc);
            }

        });



        //For testing purposes only
        socket.on('agentManualDisconnect', function(){
            try {
                //do not delete socket but remove agent from the list of users
                modelManagerList[socket.room].deleteUser(socket.userId);
            }
            catch(e){
                console.log("Disconnect error " + e);
            }

            socket.subscribed = false; //why isn't the socket removed

        });




        /**
         * This stores only species and organs information as cancerTypes require too many genes to be stored and
         * node interactionCnt is already stored as a node attribute
         */
        socket.on('agentContextUpdate', function(data, callback){
            var docPath = 'documents.' + data.room;
            model.set(docPath + '.context', data.param);
        });


    };

    io.sockets.on('connection', function (socket) {

        socket.on('error', function (error) {
            console.log(error);
            //  socket.destroy()
        });

        listenToAgentRequests(socket);

        socket.on('getDate', function(callback){
            callback(+(new Date));
        });


        socket.on('subscribeHuman', function (data,  callback) {
            socket.userId = data.userId;
            socket.room = data.room;
            socket.userName = data.userName;
            socket.subscribed = true;

            socket.join(data.room);

            data.socketId = socket.id;

            roomList.push(data.room);
            humanList.push({room:data.room, userId: data.userId, socketId: data.socketId});



            console.log("human subscribed");

            //
            // readGeneList(function(geneList){
            //     readPNNLData(geneList);
            // });



            model.subscribe('documents', function () {


                var pageDoc = model.at('documents.' + data.room);
                var docPath = 'documents.' + data.room;
                var cy = model.at((docPath + '.cy'));
                var history = model.at((docPath + '.history'));
                var undoIndex = model.at((docPath + '.undoIndex'));
                var context = model.at((docPath + '.context'));
                var images = model.at((docPath + '.images'));

                var users = model.at((docPath + '.users'));//user lists with names and color codes
                var userIds = model.at((docPath + '.userIds')); //used for keeping a list of subscribed users
                var messages = model.at((docPath + '.messages'));



                pageDoc.subscribe(function () {
                    cy.subscribe(function () {
                    });
                    history.subscribe(function () {
                    });
                    undoIndex.subscribe(function () {
                    });
                    context.subscribe(function () {
                    });
                    images.subscribe(function () {
                    });
                    messages.subscribe(function () {
                    });
                    userIds.subscribe(function () {



                    });
                    users.subscribe(function () {

                        modelManagerList[data.room] = require("../public/collaborative-app/modelManager.js")(model, data.room);
                        modelManagerList[data.room].setName(data.userId, data.userName);
                       //
                       //  //Add the user explicitly here
                         modelManagerList[data.room].addUser(data.userId);

                    });
                });


            });






        });






        socket.on('subscribeAgent', function (data, callback) {




            socket.userId = data.userId;
            socket.room = data.room;
            socket.subscribed = true;
            socket.userName = data.userName;

            socket.join(data.room);

            data.socketId = socket.id;


            model.subscribe('pnnl.data', function(){

            });


            model.subscribe('documents', function () {
                var pageDoc = model.at('documents.' + data.room);
                var docPath = 'documents.' + data.room;
                var cy = model.at((docPath + '.cy'));
                var history = model.at((docPath + '.history'));
                var undoIndex = model.at((docPath + '.undoIndex'));
                var context = model.at((docPath + '.context'));
                var images = model.at((docPath + '.images'));


                var users = model.at((docPath + '.users'));//user lists with names and color codes
                var userIds = model.at((docPath + '.userIds')); //used for keeping a list of subscribed users
                var messages = model.at((docPath + '.messages'));



                pageDoc.subscribe(function () {
                    cy.subscribe(function () {
                    });
                    history.subscribe(function () {
                    });
                    undoIndex.subscribe(function () {
                    });
                    context.subscribe(function () {
                    });
                    images.subscribe(function () {
                    });
                    messages.subscribe(function () {
                    });
                    userIds.subscribe(function () {
                        var userIdsList = userIds.get();
                        if (!userIdsList || userIdsList.indexOf(data.userId) < 0)
                            userIds.push(data.userId);
                    });
                    users.subscribe(function () {


                        users.set(data.userId, {name: data.userName, colorCode: data.colorCode});

                        modelManagerList[data.room].setName(data.userId, data.userName);


                   //     modelManagerList[data.userId] = require("../public/collaborative-app/modelManager.js")(model, data.room, data.userId, data.userName);

                    });


                //Notify agents of model changes
                    model.on('insert', (docPath + '.history.**'), function (id, cmdInd) {
                            if (socket.subscribed) { //humans are connected through sockets as well,check userType to prevent notifying twice
                                var cmd = model.get(docPath + '.history.' + cmdInd);
                                //console.log(cmd.opName);
                                io.in(socket.room).emit('operation', cmd);
                            }
                        }
                    );

                    // //To send the message to computer agents
                    model.on('all', (docPath + '.messages.**'), function (id, op, msg) {

                        //it means message is newly inserted
                        if(!id){
                            for(var att in msg){
                                if(msg.hasOwnProperty(att))
                                    msg = msg[att];
                            }
                        }




                        io.in(socket.room).emit('message', msg);

                        if (msg && msg.comment && msg.comment.text) {
                            if (msg.comment.text.indexOf("The most likely context") > -1) { //if agent told about context
                                io.in(socket.room).emit("agentContextQuestion", msg.userId);
                            }

                        }

                    });

                    //Send image file to computer agents
                    model.on('insert', (docPath + '.images.*'), function (op, id, data) {
                        if (socket.subscribed)
                            io.in(socket.room).emit('imageFile', data.img);
                    });
                });
            });



         if(callback) callback();


        });


        socket.on('disconnect', function() {

            try {

                modelManagerList[socket.room].deleteUser(socket.userId);

                //remove from humanlist
                for(var i = humanList.length - 1; i >=0 ; i--){
                    if(humanList[i].userId == socket.userId){
                        console.log(humanList[i].userId);
                        humanList.splice(i,1);
                        break;
                    }
                }

                // //remove from modelManagerList
                // for(var i = modelManagerList.length - 1; i >=0 ; i--){
                //     if(modelManagerList[i].userId == socket.userId){
                //         modelManagerList.splice(i,1);
                //         break;
                //     }
                // }

            }
            catch(e){
                console.log("Disconnect error " + e);
            }

            socket.subscribed = false; //why isn't the socket removed

        });


        socket.on('REACHQuery',  function(outputType, msg, callback){
            var queryParams = "text=" + msg + "&output=" + outputType; //fries";


            request({
                url: 'http://agathon.sista.arizona.edu:8080/odinweb/api/text', //URL to hit
                // qs: {from: 'blog example', time: +new Date()}, //Query string data
                method: 'POST',
                headers: responseHeaders,
                form: queryParams

            }, function (error, response, body) {

                if (error) {

                    console.log(error);
                } else {


                    if(response.statusCode == 200) {
                        if(callback) callback(body);
                        io.in(socket.room).emit("REACHResult", body);

                    }


                }
            });
        });

        socket.on('BioGeneQuery', function (queryParams, callback) {


            request({
                url: 'http://cbio.mskcc.org/biogene/retrieve.do', //URL to hit
                // qs: {from: 'blog example', time: +new Date()}, //Query string data
                method: 'POST',
                headers: responseHeaders,
                form: queryParams

            }, function (error, response, body) {

                if (error) {

                    console.log(error);
                } else {

                    callback(body);
                    //socket.emit("BioGeneResult",body);



                }
            });


        });


        socket.on('PCQuery', function(queryData, callback){


            var req = request(queryData.url , function (error, response, body) {
                console.log(queryData.url);

                if (error) {
                    console.log(error);
                } else  { //only open the window if a proper response is returned

                    //     console.log(body);
                    console.log(response.statusCode);
                    if(response.statusCode == 200) {
                        if(callback)
                            callback(body);
                        else
                            socket.emit("PCQueryResult", {graph:body, type:queryData.type});
                    }
                    else{
                        if(callback)
                            callback();
                        socket.emit("PCQueryResult", "error");
                    }

                }
                //    req.end();
            });

            // req.end();
        });

        socket.on('MergePCQuery', function(queryData, callback){


            var req = request(queryData.url , function (error, response, body) {


                if (error) {
                    console.log(error);
                } else  { //only open the window if a proper response is returned

                    if(response.statusCode == 200) {
                        askHuman(socket.userId, socket.room,  "mergeSbgn", body, function(val){
                            if (callback) callback(val);
                        });

                    }
                    else{
                        if(callback)
                            callback("fail");

                    }

                }
                //    req.end();
            });

            // req.end();
        });



        socket.on('BioPAXRequest', function(fileContent, reqType, callback){


            if(useBiopax) {


                //  request('http://localhost:8080/SBGNConverterServlet' , function (error, response, body) {

                request.post({
                    url: "http://localhost:8080/PaxtoolsServlet",
                    headers: responseHeaders,
                    form: {reqType: reqType, content: fileContent}
                }, function (error, response, body) {


                    if (error) {
                        console.log(error);
                    } else { //only open the window if a proper response is returned

                        if (response.statusCode == 200) {

                            if(reqType == "partialBiopax"){
                                io.in(socket.room).emit("processToIntegrate", body);

                            }
                            if(callback)
                                callback({graph:body});



                        }
                        else
                            socket.emit("Paxtools Server Error", "error");


                    }
                });

            }
        });

    });

}