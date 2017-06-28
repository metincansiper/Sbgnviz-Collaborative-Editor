/*
 *	Model initialization
 *  Event handlers of model updates
 *	Author: Funda Durupinar Babur<f.durupinar@gmail.com>
 */
var app = module.exports = require('derby').createApp('cwc', __filename);
var _ = require('./public/node_modules/underscore');

var bs;



app.loadViews(__dirname + '/views');
//app.loadStyles(__dirname + '/styles');
//app.serverUse(module, 'derby-stylus');


var testMode = true;
var ONE_DAY = 1000 * 60 * 60 * 24;

var ONE_HOUR = 1000 * 60 * 60;

var ONE_MINUTE = 1000 * 60;

var docReady = false;

var useQunit = true;

var factoidHandler;

var socket;
 var jsonMerger = require('./public/collaborative-app/reach-functions/json-merger.js');


var modelManager;
var oneColor = require('onecolor');


app.on('model', function (model) {

    model.fn('biggerTime', function (item) {
        var duration = model.get('_page.durationId');
        var startTime;
        if (duration < 0)
            startTime = 0;
        else
            startTime = new Date - duration;

        return item.date > startTime;
    });

    model.fn('biggerThanCurrentTime', function (item) {

        var clickTime = model.get('_page.clickTime');


        return item.date > clickTime;
    });



});


app.get('/', function (page, model, params) {
    function getId() {
        return model.id();
    }




    function idIsReserved() {
        var ret = model.get('documents.' + docId) != undefined;
        return ret;
    }

    var docId = getId();

    while (idIsReserved()) {
        docId = getId();
    }

    // if( useQunit ){ // use qunit testing doc if we're testing so we don't disrupt real docs
    //     docId = 'qunit';
    // }

    return page.redirect('/' + docId);
});


app.get('/:docId', function (page, model, arg, next) {
    var messagesQuery, room;
    room = arg.docId;





    model.subscribe('documents', function () {
        var docPath = 'documents.' + arg.docId;
        model.ref('_page.doc', ('documents.' + arg.docId));




        model.subscribe(docPath, function (err) {
            if (err) return next(err);

            model.createNull(docPath, { // create the empty new doc if it doesn't already exist
                id: arg.docId
            });

            // //chat related
            model.set('_page.room', room);
            //
            model.set('_page.durations', [{name: 'All', id: -1}, {name: 'One day', id: ONE_DAY}, {
                name: 'One hour',
                id: ONE_HOUR
            }, {name: 'One minute', id: ONE_MINUTE}]);


            // create a reference to the document
            var pysb = model.at((docPath + '.pysb'));
            var cy = model.at((docPath + '.cy'));
            var history = model.at((docPath + '.history'));
            var undoIndex = model.at((docPath + '.undoIndex'));
            var context = model.at((docPath + '.context'));
            var images = model.at((docPath + '.images'));

            var users = model.at((docPath + '.users'));//user lists with names and color codes
            var userIds = model.at((docPath + '.userIds')); //used for keeping a list of subscribed users
            var messages = model.at((docPath + '.messages'));

            pysb.subscribe(function () {
            });
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
                var userId = model.get('_session.userId');


                var userIdsList = userIds.get();


                if (!userIdsList) {
                    userIdsList = [userId];
                    userIds.push(userId);
                }
                else if (userIdsList.indexOf(userId) < 0) //does not exist
                    userIds.push(userId);

                userIdsList = userIds.get();


                users.subscribe(function () {

                    console.log("User is being subscribed");

                    var colorCode = null;
                    var userName = null;
                    if (users.get(userId)) {
                        userName = users.get(userId).name;
                        colorCode = users.get(userId).colorCode;
                    }
                    if (userName == null)
                        userName = 'User ' + userIdsList.length;
                    if (colorCode == null)
                        colorCode = getNewColor();


                    users.set(userId, {name: userName, colorCode: colorCode});




                     //   model.set('_page.newComment', "how does SETDB1 affect ADAM17?"); //TODO: delete later
                   //     model.set('_page.newComment', "How does KRAS activate MAPK3?"); //TODO: delete later
          //          model.set('_page.newComment', "How does MAPK1 affect JUND?"); //TODO: delete later
               //     model.set('_page.newComment', "What genes does MAPK1 phosphorylate?"); //TODO: delete later
               //     model.set('_page.newComment', "How does  ITGAV affect ILK?"); //TODO: delete later
           //        model.set('_page.newComment', "What genes activate ILK?"); //TODO: delete later
            //        model.set('_page.newComment', "How does KRAS activate MAPK3?"); //TODO: delete later


                    return page.render();
                });
            });

        });
    });




});

app.proto.updateMessage = function(){

    var e = document.getElementById("test-messages");
    var msg = e.options[e.selectedIndex].text;

    this.model.set('_page.newComment', msg);
}



function getNewColor(){
    var gR = 1.618033988749895; //golden ratio
    var h = Math.floor((Math.random() * gR * 360));//Math.floor((cInd * gR - Math.floor(cInd * gR))*360);
    var cHsl = [h, 70 + Math.random() * 30, 60 + Math.random() * 10];

  //  return ('hsla('+cHsl[0]  +', '+ cHsl[1] + '%, ' + cHsl[2] +'%, 1)');
    var strHsl = 'hsl('+cHsl[0]  +', '+ cHsl[1] + '%, ' + cHsl[2] +'%)';

  return oneColor(strHsl).hex();


}


function triggerContentChange(divId){
    //TODO: triggering here is not good

    $(('#' + divId)).trigger('contentchanged');

}
function playSound() {
    try {
        document.getElementById('notificationAudio').play();
        if (!document)
            throw err;
    }
    catch (err) {
        return err;
    }


}



app.proto.changeDuration = function () {

    return this.model.filter('_page.doc.messages', 'biggerTime').ref('_page.list');

};

/***
 * Human listens to agent socket and performs menu operations requested by the agent
 */
app.proto.listenToAgentSocket = function(model){

    var self = this;
    var modelOp;


    //For debugging
    socket.on('message', function (msg){

        console.log(msg.comment);
    });
    socket.on('loadFile', function(txtFile, callback){
        try {

            sbgnviz.loadSBGNMLText(txtFile);
            if(callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }

    });

    socket.on('newFile', function(data, callback){
        try{
            cy.remove(cy.elements());
            modelManager.newModel("me"); //do not delete cytoscape, only the model
            if(callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });

    socket.on('runLayout', function(data, callback){
        try {
            $("#perform-layout").trigger('click');
            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });


    socket.on('addNode', function(data, callback){
        try {
            //does not trigger cy events
            var newNode = chise.elementUtilities.addNode(data.x, data.y, data.class);

            //notifies other clients
            modelManager.addModelNode(newNode.id(), data, "me");
            modelManager.initModelNode(newNode, "me");

            if (callback) callback(newNode.id());
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });



    socket.on('deleteEles', function(data, callback){
        try {
            //unselect all others
            cy.elements().unselect();


            data.elementIds.forEach(function (id) {
                cy.getElementById(id).select();
            });


            if (data.type === "simple")
                $("#delete-selected-simple").trigger('click');
            else { //"smart"
                $("#delete-selected-smart").trigger('click');
            }


            var p1 = new Promise(function (resolve) {
                if(modelOp === "delete"){
                    var undoInd =  model.get('_page.doc.undoIndex');

                    var cmd = model.get('_page.doc.history.' + undoInd);
                    console.log(cmd.opName);
                    resolve("success");
                }
            });
            p1.then(function(){

                if(callback) callback("deleted!!");
            });



        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });

    socket.on('addImage', function(data, callback){
        try {



           // data.img = data.img.replace(/(\%22)/g, '"');


            var status = modelManager.addImage(data);



            if(callback) callback(status);

        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });



    model.on('change', '_page.doc.undoIndex', function(id, cmdInd){

        var cmd = model.get('_page.doc.history.' + id);
            modelOp = cmd.opName;
            //console.log(modelOp);


    });


    socket.on('addEdge', function(data, callback){
        try {
            //does not trigger cy events
            var newEdge = chise.elementUtilities.addEdge(source, target, sbgnclass, id, visibility);

            //notifies other clients
            modelManager.addModelEdge(newNode.id(), data, "me");
            // modelManager.initModelEdge(newEdge, "me");

            if (callback) callback(newEdge.id());
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });


    socket.on('align', function(data, callback){
        try {
            var nodes = cy.collection();
            if(data.nodeIds === '*' || data.nodeIds === 'all')
                nodes = cy.nodes();
            else
                data.nodeIds.forEach(function(nodeId){
                    nodes.add(cy.getElementById(nodeId));
                });

            chise.align(nodes, data.horizontal, data.vertical, cy.getElementById(data.alignTo));

            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }

    });
    socket.on('updateVisibility', function(data, callback){
        try {
            //unselect all others
            cy.elements().unselect();

            if (data.val === "showAll")
                $("#show-all").trigger('click');
            else {
                data.elementIds.forEach(function (id) {
                    cy.getElementById(id).select();
                });

                if (data.val == "hide")
                    $("#hide-selected").trigger('click');
                else
                    $("#show-selected").trigger('click');
            }


            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });

    socket.on('searchByLabel', function(data, callback){
        try {
            //unselect all others
            cy.elements().unselect();

            chise.searchByLabel(data.label);


            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });
    socket.on('updateHighlight', function(data, callback){
        try {
            //unselect all others
            cy.elements().unselect();

            if(data.val === "remove"){
                $("#remove-highlights").trigger('click');
            }
            else{
                data.elementIds.forEach(function (id) {
                    cy.getElementById(id).select();
                });

                if (data.val === "neighbors")
                    $("#highlight-neighbors-of-selected").trigger('click');
                else if (data.val === "processes")
                    $("#highlight-processes-of-selected").trigger('click');
            }

            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });

    socket.on('updateExpandCollapse', function(data, callback){
        try {

            //unselect all others
            cy.elements().unselect();

            data.elementIds.forEach(function (id) {
                cy.getElementById(id).select();
            });

            if (data.val === "collapse")
                $("#collapse-selected").trigger('click');
            else
                $("#expand-selected").trigger('click');

            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });


    socket.on('addCompound', function(data, callback){
        try {
            //unselect all others
            cy.elements().unselect();

            data.elementIds.forEach(function (nodeId) {

                cy.getElementById(nodeId).select();
            });

            if (data.val === "complex")
                $("#add-complex-for-selected").trigger('click');
            else
                $("#add-compartment-for-selected").trigger('click');


            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }

    });

    socket.on('clone', function(data, callback){
        try {
            cy.elements().unselect();

            data.elementIds.forEach(function (nodeId) {
                cy.getElementById(nodeId).select();
            });

            $("#clone-selected").trigger('click');


            if (callback) callback("success");
        }
        catch(e){
            console.log(e);
            if(callback) callback("fail");

        }
    });



    socket.on("mergeSbgn", function(data, callback){
        self.mergeSbgn(data, function(){
            if(callback) callback("success");
        });


    });

    socket.on("mergeJsonWithCurrent", function(data){
        self.mergeJsonWithCurrent(data);
    });



    // socket.on('agentContextQuestion', function(socketId){
    //     setTimeout(function() {
    //         var answer = confirm("Do you agree with the context?");
    //         socket.emit('contextAnswer', {socketId: socketId, value:answer});
    //         //if (callback) callback(answer);
    //     }, 1000); //wait for the human to read
    //
    // });



}

/***
 * Called only once in a browser after first page rendering
 * @param model
 * @returns {*}
 */

app.proto.create = function (model) {
    model.set('_page.showTime', true);

    var self = this;
    docReady = true;

    var isQueryWindow = false;

    socket = io();

    $('#messages').contentchanged = function () {

        $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());

    }


    //change scroll position
    $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());


    var id = model.get('_session.userId');
    var name = model.get('_page.doc.users.' + id +'.name');

    modelManager = require('./public/collaborative-app/modelManager.js')(model, model.get('_page.room') );
    modelManager.setName( model.get('_session.userId'),name);

    factoidHandler = require('./public/collaborative-app/factoid-handler')(this, modelManager) ;
    factoidHandler.initialize();


    //$(window).on('resize', _.debounce(this.dynamicResize, 100));

    var images = model.get('_page.doc.images');
    self.dynamicResize(model.get('_page.doc.images'));

    $(window).on('resize', function(){
        var images = model.get('_page.doc.images');
        self.dynamicResize(images);
    });




    //Notify server about the client connection
    socket.emit("subscribeHuman", { userName:name, room:  model.get('_page.room'), userId: id}, function(){

    }); //subscribe to current doc as a new room

    // //If we get a message on a separate window

    window.addEventListener('message', function(event) {
        if(event.data) { //initialization for a query winddow
            isQueryWindow = true;

            modelManager.newModel("me"); //do not delete cytoscape, only the model

             chise.updateGraph(JSON.parse(event.data));


            setTimeout(function() {

                modelManager.initModel(cy.nodes(), cy.edges(), appUtilities, "me");
            },2000);
        }

    }, false);


    this.listenToAgentSocket(model);



    //Loading cytoscape and clients
    setTimeout(function(){

    if(!isQueryWindow) { //initialization for a regular window
        var isModelEmpty = self.loadCyFromModel();
        console.log("no query");
        //TODO????????????????
        setTimeout(function () {
            if (isModelEmpty)
                modelManager.initModel(cy.nodes(), cy.edges(), appUtilities, "me");



        }, 1000);

    }

        require('./public/collaborative-app/editor-listener.js')(modelManager, id);
        //Listen to these after cy is loaded
        $("#undo-last-action, #undo-icon").click(function (e) {
            if(modelManager.isUndoPossible()){
                modelManager.undoCommand();

            }
        });

        $("#redo-last-action, #redo-icon").click(function (e) {
            if(modelManager.isRedoPossible()){
                modelManager.redoCommand();

            }
        });


    }, 2000);



    this.atBottom = true;



    return model.on('all', '_page.list', (function (_this) {

        return function () {
            if (!_this.atBottom) {
                return;
            }

            document.getElementById("messages").scrollTop= document.getElementById("messages").scrollHeight;

            // $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());

            return _this.container.scrollTop = _this.list.offsetHeight;
        };
    })(this));
};

app.proto.loadCyFromModel = function(){


    var jsonArr = modelManager.getJsonFromModel();


    if (jsonArr!= null) {
        //Updates data fields and sets style fields to default
        chise.updateGraph({
            nodes: jsonArr.nodes,
            edges: jsonArr.edges
        });


        //Update position fields separately
        cy.nodes().forEach(function(node){

            var position = modelManager.getModelNodeAttribute('position',node.id());

            node.position({x:position.x, y: position.y});

        });

        var props;
        //update app utilities as well
        props = modelManager.getLayoutProperties();
        if(props) appUtilities.currentLayoutProperties = props;

        props = modelManager.getGeneralProperties();
        if(props) appUtilities.currentGeneralProperties = props;

        props = modelManager.getGridProperties();
        if(props) appUtilities.currentGridProperties = props;

    }
    return (jsonArr == null);
}

function moveNodeAndChildren(positionDiff, node, notCalcTopMostNodes) {
        var oldX = node.position("x");
        var oldY = node.position("y");
        node.position({
            x: oldX + positionDiff.x,
            y: oldY + positionDiff.y
        });
        var children = node.children();
        children.forEach(function(child){
            moveNodeAndChildren(positionDiff, child, true);
        });
}

app.proto.listenToNodeOperations = function(model){


    model.on('all', '_page.doc.factoid.*', function(id, op, val, prev, passed){

        if(docReady &&  passed.user == null) {
            factoidHandler.setFactoidModel(val);

        }


    });

    //Update inspector

//TODO: Open later
    // model.on('all', '_page.doc.cy.nodes.**', function(id, op, val, prev, passed){
    //     inspectorUtilities.handleSBGNInspector();
    // });

    model.on('all', '_page.doc.cy.nodes.*', function(id, op, val, prev, passed){


        if(docReady &&  passed.user == null) {

            var node  = model.get('_page.doc.cy.nodes.' + id);


            if(!node || !node.id){ //node is deleted
                cy.getElementById(id).remove();
            }

        }



    });




    model.on('all', '_page.doc.cy.nodes.*.addedLater', function(id, op, idName, prev, passed){ //this property must be something that is only changed during insertion


        if(docReady && passed.user == null) {
            var pos = model.get('_page.doc.cy.nodes.'+ id + '.position');
            var sbgnclass = model.get('_page.doc.cy.nodes.'+ id + '.data.class');
            var visibility = model.get('_page.doc.cy.nodes.'+ id + '.visibility');
            var parent = model.get('_page.doc.cy.nodes.'+ id + '.data.parent');

            if(parent == undefined) parent = null;


            var newNode = chise.elementUtilities.addNode(pos.x, pos.y, sbgnclass, id, parent, visibility);

            // modelManager.initModelNode(newNode,"me", true);


            newNode.move({"parent":parent});

        }

    });



    model.on('all', '_page.doc.cy.nodes.*.position', function(id, op, pos,prev, passed){

        if(docReady && passed.user == null) {
            var posDiff = {x: (pos.x - cy.getElementById(id).position("x")), y:(pos.y - cy.getElementById(id).position("y"))} ;
            moveNodeAndChildren(posDiff, cy.getElementById(id)); //children need to be updated manually here

        }
    });
    model.on('all', '_page.doc.cy.nodes.*.highlightColor', function(id, op, val,prev, passed){

        //call it here so that everyone can highlight their own textbox

        factoidHandler.highlightSentenceInText(id, val);

        if(docReady && passed.user == null) {
            if(val == null){
                cy.getElementById(id).css({
                    "overlay-color": null,
                    "overlay-padding": 10,
                    "overlay-opacity": 0
                });

            }
            else
                cy.getElementById(id).css({
                    "overlay-color": val,
                    "overlay-padding": 10,
                    "overlay-opacity": 0.25
                });




            console.log("changed highlightcolor");
        }

    });

    //Called by agents to change bbox
    model.on('all', '_page.doc.cy.nodes.*.data.*.*', function(id, att1,att2, op, val,prev, passed){
        if(docReady && passed.user == null) {

            var newAtt = cy.getElementById(id).data(att1);
            newAtt[att2] = val;
            cy.getElementById(id).data(att1, newAtt);


        }
    });


    //Called by agents to change specific properties of data
    model.on('all', '_page.doc.cy.nodes.*.data.*', function(id, att, op, val,prev, passed){
        if(docReady && passed.user == null) {

            cy.getElementById(id).data(att, val);
            if(att === "parent")
                cy.getElementById(id).move({"parent":val});
        }
    });


    model.on('all', '_page.doc.cy.nodes.*.data', function(id,  op, data,prev, passed){

        console.log("only data");




        if(docReady && passed.user == null) {

            //cy.getElementById(id).data(data); //can't call this if cy element does not have a field called "data"
            cy.getElementById(id)._private.data = data;

            //to update parent
            var newParent = data.parent;
            if(newParent == undefined)
                newParent = null;  //must be null explicitly

            cy.getElementById(id).move({"parent":newParent});
            cy.getElementById(id).updateStyle();


        }
    });



    model.on('all', '_page.doc.cy.nodes.*.expandCollapseStatus', function(id, op, val,prev, passed){



        if(docReady && passed.user == null) {
            var expandCollapse = cy.expandCollapse('get'); //we can't call chise.expand or collapse directly as it causes infinite calls
            if(val === "collapse")
                expandCollapse.collapse(cy.getElementById(id));
            else
                expandCollapse.expand(cy.getElementById(id));

        }

    });


    model.on('all', '_page.doc.cy.nodes.*.highlightStatus', function(id, op, highlightStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && passed.user == null) {
            try{
                var viewUtilities = cy.viewUtilities('get');

                console.log(highlightStatus);
                if(highlightStatus === "highlighted")
                    viewUtilities.highlight(cy.getElementById(id));
                else
                    viewUtilities.unhighlight(cy.getElementById(id));

                //    cy.getElementById(id).updateStyle();
            }
            catch(e){
                console.log(e);
            }

        }
    });

    model.on('all', '_page.doc.cy.nodes.*.visibilityStatus', function(id, op, visibilityStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && passed.user == null) {
            try{
                var viewUtilities = cy.viewUtilities('get');


                if(visibilityStatus === "hide")
                    viewUtilities.hide(cy.getElementById(id));
                else
                    viewUtilities.show(cy.getElementById(id));

            }
            catch(e){
                console.log(e);
            }

        }
    });

}

app.proto.listenToEdgeOperations = function(model){




    //Update inspector
    //TODO: open later
    // model.on('all', '_page.doc.cy.edges.**', function(id, op, val, prev, passed){
    //     inspectorUtilities.handleSBGNInspector();
    // });


    model.on('all', '_page.doc.cy.edges.*.highlightColor', function(id, op, val,prev, passed){

        if(docReady && passed.user == null) {
            if(val == null){

                cy.getElementById(id).css({
                    "overlay-color": null,
                    "overlay-padding": 10,
                    "overlay-opacity": 0
                });

            }
            else {
                cy.getElementById(id).css({
                    "overlay-color": val,
                    "overlay-padding": 10,
                    "overlay-opacity": 0.25
                });
            }


        }
    });

    model.on('all', '_page.doc.cy.edges.*', function(id, op, val, prev, passed){


        if(docReady &&  passed.user == null) {
            var edge  = model.get('_page.doc.cy.edges.' + id); //check

            if(!edge|| !edge.id){ //edge is deleted
                cy.getElementById(id).remove();

            }
        }

    });

    model.on('all', '_page.doc.cy.edges.*.addedLater', function(id,op, idName, prev, passed){//this property must be something that is only changed during insertion


        if(docReady && passed.user == null ){
            var source = model.get('_page.doc.cy.edges.'+ id + '.data.source');
            var target = model.get('_page.doc.cy.edges.'+ id + '.data.target');
            var sbgnclass = model.get('_page.doc.cy.edges.'+ id + '.data.class');
            var visibility = model.get('_page.doc.cy.nodes.'+ id + '.visibility');


            var newEdge = chise.elementUtilities.addEdge(source, target, sbgnclass, id, visibility);




            modelManager.initModelEdge(newEdge,"me", true);

        }

    });
    //Called by agents to change specific properties of data
    model.on('all', '_page.doc.cy.edges.*.data.*', function(id, att, op, val,prev, passed){
        if(docReady && passed.user == null) {
            cy.getElementById(id).data(att, val);
        }
    });

    model.on('all', '_page.doc.cy.edges.*.data', function(id, op, data,prev, passed){

        if(docReady && passed.user == null) {
            //cy.getElementById(id).data(data); //can't call this if cy element does not have a field called "data"
            cy.getElementById(id)._private.data = data;

        }
    });


    model.on('all', '_page.doc.cy.edges.*.bendPoints', function(id, op, bendPoints, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && passed.user == null) {

            try{
                var edge = cy.getElementById(id);
                if(bendPoints.weights && bendPoints.weights.length > 0) {
                    edge.scratch('cyedgebendeditingWeights', bendPoints.weights);
                    edge.scratch('cyedgebendeditingDistances', bendPoints.distances);
                    edge.addClass('edgebendediting-hasbendpoints');
                }
                else{
                    edge.removeScratch('cyedgebendeditingWeights');
                    edge.removeScratch('cyedgebendeditingDistances');
                    edge.removeClass('edgebendediting-hasbendpoints');
                }

                edge.trigger('cyedgebendediting.changeBendPoints');
             //   cy.getElementById(id).updateStyle();

            }
            catch(e){
                console.log(e);
            }

        }
    });

    model.on('all', '_page.doc.cy.edges.*.highlightStatus', function(id, op, highlightStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && passed.user == null) {
            var viewUtilities = cy.viewUtilities('get');
            try{
                if(highlightStatus === "highlighted")
                    viewUtilities.highlight(cy.getElementById(id));
                else
                    viewUtilities.unhighlight(cy.getElementById(id));

            }
            catch(e){
                console.log(e);
            }

        }
    });

    model.on('all', '_page.doc.cy.edges.*.visibilityStatus', function(id, op, visibilityStatus, prev, passed){ //this property must be something that is only changed during insertion
        if(docReady && passed.user == null) {
            var viewUtilities = cy.viewUtilities('get');
            try{
                if(visibilityStatus === "hide")
                    viewUtilities.hide(cy.getElementById(id));
                else
                    viewUtilities.show(cy.getElementById(id));
            }
            catch(e){
                console.log(e);
            }
        }
    });

}


app.proto.init = function (model) {
    var timeSort;

    var self = this;
    this.listenToNodeOperations(model);
    this.listenToEdgeOperations(model);



    //Listen to other model operations


    // model.on('all', '_page.doc.messages.**', function(id, op, val, prev, passed){
    //
    //     // $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());
    //     $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());
    //
    //
    // });



    model.on('all', '_page.doc.factoid.*', function(id, op, val, prev, passed){

        if(docReady &&  passed.user == null) {
            factoidHandler.setFactoidModel(val);
        }


    });



    //Cy updated by other clients
    model.on('change', '_page.doc.cy.initTime', function( val, prev, passed){

        if(docReady &&  passed.user == null) {

            self.loadCyFromModel();

        }
    });

    model.on('all', '_page.doc.cy.layoutProperties', function(op, val) {
        if (docReady){
            for(var att in val){ //assign each attribute separately to keep the functions in currentlayoutproperties
                if(appUtilities.currentLayoutProperties[att])
                    appUtilities.currentLayoutProperties[att] = val[att];
            }

        }

    });

    model.on('all', '_page.doc.cy.generalProperties', function(op, val) {
        if (docReady){
            for(var att in val){ //assign each attribute separately to keep the functions in currentgeneralproperties
                if(appUtilities.currentGeneralProperties[att])
                    appUtilities.currentGeneralProperties[att] = val[att];
            }

        }

    });

    model.on('all', '_page.doc.cy.gridProperties', function(op, val) {
        if (docReady){
            for(var att in val){ //assign each attribute separately to keep the functions in currentgridproperties
                if(appUtilities.currentGridProperties[att])
                    appUtilities.currentGridProperties[att] = val[att];
            }

        }

    });


    //Sometimes works
    model.on('all', '_page.doc.images', function() {
        if (docReady) {
            triggerContentChange('static-image-container');
            triggerContentChange('receivedImages');

        }
    });

    model.on('all', '_page.doc.history', function(){
        if(docReady){
            triggerContentChange('command-history-area');
        }
    });

    model.on('insert', '_page.list', function (index) {


        var com = model.get('_page.list');
        var myId = model.get('_session.userId');


        if(docReady){
            triggerContentChange('messages');


        }

        if (com[com.length - 1].userId != myId) {

            playSound();

        }
    });


    timeSort = function (a, b) {

        return (a != null ? a.date : void 0) - (b != null ? b.date : void 0);
    };



    return model.sort('_page.doc.messages', timeSort).ref('_page.list');
};


app.proto.onScroll = function (element) {
    console.log(element);
    console.log(this);
    var bottom, containerHeight, scrollBottom;
    bottom = this.list.offsetHeight;
    containerHeight = this.container.offsetHeight;
    scrollBottom = this.container.scrollTop + containerHeight;

    return this.atBottom = bottom < containerHeight || scrollBottom > bottom - 10;

};



app.proto.changeColorCode = function(){

    var  user = this.model.at('_page.doc.users.' + this.model.get('_session.userId'));
    user.set('colorCode', getNewColor());

};
app.proto.runUnitTests = function(){

    var room = this.model.get('_page.room');
    require("./public/test/testsAgentAPI.js")(("http://localhost:3000/" + room), modelManager);
    //require("./public/test/testsCausalityAgent.js")(("http://localhost:3000/" + room), modelManager);
    // require("./public/test/testsModelManager.js")();
    require("./public/test/testOptions.js")(); //to print out results




}

app.proto.connectCausalityAgent = function(){

    var CausalityAgent = require("./agent-interaction/CausalityAgent");
    agent = new CausalityAgent("Agent1", "Agent1");
    agent.connectToServer("http://localhost:3000/", function (socket) {
        agent.loadModel(function() {
            agent.init();
            agent.loadChatHistory(function(){
            });
        });
    });
}

app.proto.enterMessage= function(event){

    if (event.keyCode == 13 && !event.shiftKey) {
       this.add(event);

       //  $('#inputs-comment')[0].value = "abc";
       // // $('#inputs-comment')[0].focus();
       //  $('#inputs-comment')[0].setSelectionRange(0,0);

        // prevent default behavior
        event.preventDefault();

    }
}
app.proto.add = function (event, model, filePath) {

    if(model == null)
        model = this.model;

    this.atBottom = true;



        var comment;
        comment = model.del('_page.newComment'); //to clear  the input box
        if (!comment) {
            return;
        }

        var targets  = [];
        var users = model.get('_page.doc.userIds');

        var myId = model.get('_session.userId');
        for(var i = 0; i < users.length; i++){
            var user = users[i];
            if(user == myId ||  document.getElementById(user).checked){
                targets.push({id: user});
            }
        }

        var msgUserId = model.get('_session.userId');
        var msgUserName = model.get('_page.doc.users.' + msgUserId +'.name');

       socket.emit('getDate', function(date){ //get the date from the server

           comment.style = "font-size:large";
            model.add('_page.doc.messages', {
                room: model.get('_page.room'),
                targets: targets,
                userId: msgUserId,
                userName: msgUserName,
                comment: comment,
                date: date
            });


           event.preventDefault();

            //change scroll position
           $('#messages').scrollTop($('#messages')[0].scrollHeight  - $('.message').height());



       });


};

app.proto.clearHistory = function () {
    this.model.set('_page.clickTime', new Date);

    return this.model.filter('_page.doc.messages', 'biggerThanCurrentTime').ref('_page.list');

}

app.proto.dynamicResize = function (images) {
    var win = $(window);

    var windowWidth = win.width();
    var windowHeight = win.height();

    var canvasWidth = 1200;
    var canvasHeight = 680;


    if (windowWidth > canvasWidth)
    {
        $("#canvas-tab-area").width(windowWidth * 0.99 * 0.55);
        $("#sbgn-network-container").width(windowWidth * 0.99 * 0.55);


        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).width(windowWidth * 0.99 * 0.55);
            });
        }
        $("#inspector-tab-area").width(windowWidth * 0.99 * 0.45);

        $("#sbgn-inspector").width(windowWidth * 0.99 * 0.45);
        // var w = $("#sbgn-inspector-and-canvas").width(); //funda
        var w = $("#canvas-tab-area").width();
        $(".nav-menu").width(w);
        $(".navbar").width(w);
        $("#sbgn-toolbar").width(w);
    }
    else{
        if(images) {
            images.forEach(function (img) {
                $("#static-image-container-" + img.tabIndex).width(800);
                $("#static-image-container-" + img.tabIndex).height(680);
            });
        }
    }

    if (windowHeight > canvasHeight)
    {
        $("#canvas-tab-area").height(windowHeight * 0.84);
        $("#sbgn-network-container").height(windowHeight * 0.84);
        if(images) {
            images.forEach(function (img) {

                $("#static-image-container-" + img.tabIndex).height(windowHeight * 0.84);
            });
        }
        $("#inspector-tab-area").height(windowHeight * 0.84);
    }
};

app.proto.uploadFile = function(evt){

    try{
        var room = this.model.get('_page.room');
        var fileStr = this.model.get("_page.newFile").split('\\');
        var filePath = fileStr[fileStr.length-1];

        var file = evt.target.files[0];

        var reader = new FileReader();
        var images = this.model.get('_page.doc.images');
        var imgCnt = 0;
        if(images)
            imgCnt = images.length;
        reader.onload = function(evt){
            modelManager.addImage({ img: evt.target.result,room: room, fileName: filePath, tabIndex:imgCnt, tabLabel:filePath});

        };

        reader.readAsDataURL(file);

        //Add file name as a text message
        this.model.set('_page.newComment',  ("Sent image: "  + filePath) );

        this.app.proto.add(evt,this.model, filePath);


    }
    catch(error){ //clicking cancel when the same file is selected causes error
        console.log(error);

    }
};


app.proto.count = function (value) {
    return Object.keys(value || {}).length;
};



app.proto.formatTime = function (message) {
    var hours, minutes, seconds, period, time;
    time = message && message.date;


    if (!time) {
        return;
    }
    time = new Date(time);
    hours = time.getHours();

    minutes = time.getMinutes();

    seconds = time.getSeconds();

    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    return hours + ':' + minutes + ':' + seconds;
};

app.proto.formatObj = function(obj){

    return JSON.stringify(obj, null, '\t');
};


app.proto.mergeSbgn = function(sbgnText, callback){

    var newJson = sbgnviz.convertSbgnmlTextToJson(sbgnText);
    this.mergeJsonWithCurrent(newJson, callback);
};

//Merge an array of json objects to output a single json object.
app.proto.mergeJsons = function(jsonGraph) {
    var idxCardNodeMap = {};
    var sentenceNodeMap = {};

    var jsonObj = jsonMerger.mergeJsons(jsonGraph, sentenceNodeMap, idxCardNodeMap);

    modelManager.newModel( "me", true);

    chise.updateGraph(jsonObj);

    setTimeout(function(){
        modelManager.initModel(cy.nodes(), cy.edges(), appUtilities, "me");
    },1000); //wait for chise to complete updating graph


    $("#perform-layout").trigger('click');

    //Call merge notification after the layout
    setTimeout(function(){
        modelManager.mergeJsons("me", true);
    }, 1000);

    return {sentences: sentenceNodeMap, idxCards: idxCardNodeMap};
};

//Merge an array of json objects with the json of the current sbgn network
//on display to output a single json object.
app.proto.mergeJsonWithCurrent = function(jsonGraph, callback) {
    var currJson = sbgnviz.createJson();
    modelManager.setRollbackPoint(); //before merging
    var jsonObj = jsonMerger.mergeJsonWithCurrent(jsonGraph, currJson);

    //get another sbgncontainer and display the new SBGN model.
    modelManager.newModel( "me", true);
    //this takes a while so wait before initiating the model
    chise.updateGraph(jsonObj);
    //DEBUG
    // cy.nodes().forEach(function (node){
    //     if(node._private.data == null){
    //         console.log("Data not assigned");
    //         console.log(node);
    //     }
    // });

    setTimeout(function() {
        modelManager.initModel(cy.nodes(), cy.edges(), appUtilities, "me");

        //select the new graph
        jsonGraph.nodes.forEach(function(node){
            cy.getElementById(node.data.id).select();
        });

        //Call Layout
        $("#perform-layout").trigger('click');

        //Call merge notification after the layout
        setTimeout(function(){
            modelManager.mergeJsons("me", true);
            if(callback) callback("success");
        }, 1000);

    }, 2000); //wait for chise to complete updating graph
};