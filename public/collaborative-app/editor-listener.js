/**
 * Created by durupina on 2/10/17.
 */

//Listen and respond to cytoscape events triggered by cytoscape-undo-redo.js


module.exports = function(modelManager, userId){

    //A new sample or file is loaded --update model and inform others
   $(document).on("sbgnvizLoadSampleEnd sbgnvizLoadFileEnd",  function(event, file){
       console.log("Loading new sample");
       modelManager.newModel("me"); //do not delete cytoscape, only the model
       modelManager.initModel(cy.nodes(), cy.edges(), appUtilities);

    });




    $(document).on("saveLayout", function (evt) {
         var layoutProperties = appUtilities.currentLayoutProperties;
        modelManager.updateLayoutProperties(layoutProperties, "me");
    });

    $(document).on("saveGeneralProperties", function (evt) {
        var generalProperties = appUtilities.currentGeneralProperties;
        modelManager.updateGeneralProperties(generalProperties, "me");
    });

    $(document).on("saveGridProperties", function (evt) {
        var gridProperties = appUtilities.currentGridProperties;
        modelManager.updateGridProperties(gridProperties, "me");
    });

    $(document).on("newFile", function (evt) {
        cy.remove(cy.elements());
        modelManager.newModel("me"); //do not delete cytoscape, only the model
    });

    cy.on("afterDo afterRedo", function (event, actionName, args, res) {

        console.log(actionName);
        console.log(args);
        console.log(res);


        if (actionName === "changeData" || actionName === "changeFontProperties" ) {

            var modelElList = [];
            var paramList = [];
            args.eles.forEach(function (ele) {
                //var ele = param.ele;

                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                paramList.push(ele.data());

            });
            modelManager.changeModelElementGroupAttribute("data", modelElList, paramList, "me");

        }


        else if (actionName === "changeNodeLabel" ||actionName === "resizeNodes"||
            actionName === "addStateOrInfoBox" || actionName === "setMultimerStatus" || actionName === "setCloneMarkerStatus") {

            var modelElList = [];
            var paramList = []
            args.nodes.forEach(function (ele) {
                //var ele = param.ele;

                modelElList.push({id: ele.id(), isNode: true});
                paramList.push(ele.data());

            });
            modelManager.changeModelElementGroupAttribute("data", modelElList, paramList, "me");

        }
        else if(actionName === "resize"){

            var modelElList = [{id: res.node.id(), isNode: true}];
            var paramList = [res.node.data()];


            modelManager.changeModelElementGroupAttribute("data", modelElList, paramList, "me");
        }

        else if (actionName === "changeBendPoints") {

            var modelElList = [];
            var paramList = []


            modelElList.push({id: args.edge.id(), isNode: false});


            paramList.push({weights: args.edge.scratch('cyedgebendeditingWeights'), distances:args.edge.scratch('cyedgebendeditingDistances')});

            modelManager.changeModelElementGroupAttribute("bendPoints", modelElList, paramList, "me");

        }


        else if (actionName === "hide" || actionName === "show") {
            var modelElList = [];
            var paramList = [];

            args.forEach(function (ele) {
                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                paramList.push(actionName);

            });

            modelManager.changeModelElementGroupAttribute("visibilityStatus", modelElList, paramList, "me");
        }

        else if (actionName === "highlight") {
            var modelElList = [];
            var paramList = [];


            args.forEach(function (ele) {
                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                paramList.push("highlighted");
            });

            modelManager.changeModelElementGroupAttribute("highlightStatus", modelElList, paramList, "me");
        }

        else if(actionName === "removeHighlights"){
            var modelElList = [];
            var paramList = [];


            cy.elements().forEach(function (ele) {
                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                paramList.push("unhighlighted");

            });

            modelManager.changeModelElementGroupAttribute("highlightStatus", modelElList, paramList, "me");

        }
        else if (actionName === "expand" || actionName === "collapse") {

            var modelElList = [];
            var paramList = []
            args.nodes.forEach(function (ele) {
                modelElList.push({id: ele.id(), isNode: true});
                paramList.push(actionName);

            });
            modelManager.changeModelElementGroupAttribute("expandCollapseStatus", modelElList, paramList, "me");
        }


        else if (actionName === "drag" || actionName === "align") {

            var modelElList = [];
            var paramList = []
            args.nodes.forEach(function (ele) {
                //var ele = param.ele;
                modelElList.push({id: ele.id(), isNode: true});
                paramList.push(ele.position());
            });

            modelManager.changeModelElementGroupAttribute("position", modelElList, paramList, "me");
        }

        else if (actionName === "layout") {
            cy.on('layoutstop', function() {

                var modelElList = [];
                var paramList = [];
                args.eles.forEach(function (ele) {
                    if(ele.isNode()){
                        modelElList.push({id: ele.id(), isNode: true});
                        paramList.push(ele.position());
                    }
                });

                modelManager.changeModelElementGroupAttribute("position", modelElList, paramList, "me");
            });
        }


        else if(actionName === "deleteElesSimple" || actionName === "deleteNodesSmart"){


            var nodeList = [];
            var edgeList = [];

            res.forEach(function (el) {
                if(el.isNode())
                    nodeList.push({id:el.id()});
                else
                    edgeList.push({id:el.id()});
            });

            modelManager.deleteModelElementGroup({nodes:nodeList,edges: edgeList}, "me");
        }

        else if (actionName === "addNode") {
            var newNode = args.newNode;
            var id = res.eles.id();
            var param = {x: newNode.x, y: newNode.y, class: newNode.class};
            //Add to the graph first
            modelManager.addModelNode(id, param, "me");
            //assign other node properties-- css and data
            modelManager.initModelNode(res.eles[0], "me");

        }

         else if(actionName === "addEdge"){

            var newEdge = args.newEdge;
            var id = res.eles.id();
             var param = { source: newEdge.source, target:newEdge.target, class: newEdge.class};
             //Add to the graph first
             modelManager.addModelEdge(id, param, "me");
            //assign other edge properties-- css and data
             modelManager.initModelEdge(res.eles[0], "me");

         }

         else if(actionName === "paste"){
             res.forEach(function(el){ //first add nodes
                 if(el.isNode()){
                     var param = {x: el.position("x"), y: el.position("y"), class: el.data("class")};
                     modelManager.addModelNode(el.id(), param, "me");

                     modelManager.initModelNode(el, "me");
                 }
             });

            res.forEach(function(el){ //first add nodes
                if(el.isEdge()){
                    var param = { source: el.data("source"), target:el.data("target"), class: el.data("class")};
                    modelManager.addModelEdge(el.id(), param, "me");
                    modelManager.initModelEdge(el, "me");
                }
            });

        }
        else if(actionName === "changeParent"){
            var modelElList = [];
            var modelNodeList = [];
            var paramListData = [];
            var paramListPosition = [];
            res.movedEles.forEach(function (ele) {
                //var ele = param.ele;

                modelElList.push({id: ele.id(), isNode: ele.isNode()});
                paramListData.push(ele.data());
                paramListPosition.push(ele.position());

            });

            res.movedEles.forEach(function (ele) {
                //var ele = param.ele;

                if(ele.isNode()) {
                    modelNodeList.push({id: ele.id(), isNode: ele.isNode()});
                    paramListPosition.push(ele.position());
                }

            });

            modelManager.changeModelElementGroupAttribute("data", modelElList, paramListData, "me");
            modelManager.changeModelElementGroupAttribute("position", modelNodeList, paramListPosition, "me");


        }
        else if(actionName === "createCompoundForGivenNodes"){
            var paramList = [];
            var modelElList = [];


            //Last element is the compound, skip it and add the children
            for(var i = 0; i < res.newEles.length - 1; i++){
                var ele = res.newEles[i];


                modelElList.push({id: ele.id(), isNode: true});

                paramList.push(ele.data()); //includes parent information

            }
            //
            // res.children().forEach(function (ele) {
            //     //var ele = param.ele;
            //
            //     modelElList.push({id: ele.id(), isNode: true});
            //
            //     paramList.push(ele.data()); //includes parent information
            //
            // });


            var compoundId = res.newEles[0].data("parent");
            var compound = cy.getElementById(compoundId);

            var compoundAtts = {x: compound.position("x"), y: compound.position("y"), class:compound.data("class")};


            modelManager.addModelCompound(compound.id(), compoundAtts, modelElList,paramList, "me" );


            //assign other node properties-- css and data
            modelManager.initModelNode(compound,"me", true); //init with default values  -- no history update


        }

    });




        cy.on("mouseup", "node", function () {
            modelManager.unselectModelNode(this, "me");
        });


        cy.on('select', 'node', function (event) { //Necessary for multiple selections
            console.log(this.id()); //TODO delete later
            modelManager.selectModelNode(this,  userId, "me");

        });

        cy.on('unselect', 'node', function () { //causes sync problems in delete op
            modelManager.unselectModelNode(this, "me");
        });
        cy.on('grab', 'node', function (event) { //Also works as 'select'
            modelManager.selectModelNode(this, userId, "me");
        });

        cy.on('select', 'edge', function (event) {
            console.log(this.id()); //TODO delete later
            modelManager.selectModelEdge(this, userId, "me");

        });

        cy.on('unselect', 'edge', function (event) {
            modelManager.unselectModelEdge(this, "me");
        });


}


