/**
 * Created by durupina on 11/14/16.
 * Human listens to agent socket and performs menu operations requested by the agent
*/

module.exports =  function(app, modelManager, socket) {


    return   {


        listen: function(){
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

                        if (data.val == "show")
                            $("#show-selected").trigger('click');
                        else
                            $("#hide-selected").trigger('click');
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


    }


}



// if( typeof module !== 'undefined' && module.exports){ // expose as a nodejs module
//     module.exports = new FactoidInput();