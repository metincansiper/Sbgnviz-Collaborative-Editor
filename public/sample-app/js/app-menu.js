    /**
 * Menu class
 * Initializes sbgnContainer, editorActions modelManager, SBGNLayout properties and SBGN Properties,
 * Listens to menu actions
 *
 * **/


var factoidHandler =  require('./factoid-handler.js');
var sbgnFiltering = require('../../src/utilities/sbgn-filtering.js')();
var sbgnElementUtilities = require('../../src/utilities/sbgn-element-utilities.js')();
var expandCollapseUtilities = require('../../src/utilities/expand-collapse-utilities.js')();
var sbgnmlToJson =require('../../src/utilities/sbgnml-to-json-converter.js')();
var cytoscape = require('cytoscape');

var jsonMerger = require('../../src/reach-functions/json-merger.js');
var idxcardjson = require('../../src/reach-functions/idxcardjson-to-json-converter.js');

//Local functions
var setFileContent = function (fileName) {
    var span = document.getElementById('file-name');
    while (span.firstChild) {
        span.removeChild(span.firstChild);
    }
    span.appendChild(document.createTextNode(fileName));
};

var beforePerformLayout = function(){
    cy.nodes().removeData("ports");
    cy.edges().removeData("portsource");
    cy.edges().removeData("porttarget");

    cy.nodes().data("ports", []);
    cy.edges().data("portsource", []);
    cy.edges().data("porttarget", []);

    cy.edges().removeData('weights');
    cy.edges().removeData('distances');

    cy.edges().css('curve-style', 'bezier');
};

var traverseThroughEdges = function(node, edges, npassages, backtosource, visitedNodes) {
    var next;
    var previousVisitedNodesLength;
    edges.forEach(edge => {
        edge.select();
        if (!visitedNodes.map(visitedNodes => visitedNodes.id()).includes(edge.id())) {
            npassages += 1;
            if(npassages > 1)
                visitedNodes.push(node);

            visitedNodes.push(edge);
            
            previousVisitedNodesLength = visitedNodes.length;
            next = edge.target();
            if(backtosource)
                next = edge.source();

            traverseGraph(next, visitedNodes);
            if((visitedNodes.length == previousVisitedNodesLength) && (npassages > 1))
                visitedNodes.pop();
        }
    });

    return npassages;
};

var traverseGraph = function (node, visitedNodes) {
    // break if we visit a node twice
    if (visitedNodes.map(visitedNodes => visitedNodes.id()).includes(node.id())) {
        visitedNodes.push(node);
        return visitedNodes;
    }

    // add visited node to collection
    visitedNodes.push(node);

    // select node
    node.select();

    // only travel through valid edges
    const edgesTo = node.outgoers(function () {
        return this.isEdge();
    });

    const edgesFrom = node.incomers(function () {
        return this.isEdge();
    });

    // travel through edges leaving the node.
    var npassages = traverseThroughEdges(node, edgesTo, 0, 0, visitedNodes);

    // travel through edges entring the node.
    traverseThroughEdges(node, edgesFrom, npassages, 1, visitedNodes);

    return visitedNodes;
};

var cytoscape2rephrase = function(cytoscape) {
    var i;
    var tmp;
    var ids = [];
    var indicelist;
    var rephrase = [];
    var indicestoexplore = [];
    for(i = 0; i < cytoscape.nodes().length; i++) {
        ids.push(cytoscape.nodes()[i].id());
        indicestoexplore.push(i);
    }

    while(indicestoexplore.length > 0) {
        indicelist = {};
        tmp = traverseGraph(cytoscape.nodes()[indicestoexplore[0]], []);
        tmp.forEach(element => {
            if(element.isNode())
                indicelist[ids.indexOf(element.id())] = 1;
        });

        i = 0;
        Object.keys(indicelist).sort(function(a, b){return a-b}).forEach(indice => {
            ids.splice(indice - i, 1);
            indicestoexplore.splice(indice - i, 1);
            i += 1;
        });

        for(i = 0; i < tmp.length; i++)
            rephrase.push(tmp[i]);
    }

    return rephrase;
};

var descString = function(nodearray) {
    var id = "";
    nodearray.forEach(node => {
        id += node.data('sbgnlabel') + node.data('sbgnclass');

        if(node.data('sbgnstatesandinfos') != undefined && node.data('sbgnstatesandinfos').length > 0) {
            node.data('sbgnstatesandinfos').forEach(box => {
                id += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
            });
        }
    });

    return id;
};

var getLonelyNodes = function(rephrase) {
    var i;
    var lonelynodes = [];
    var triplet = new Array(3);

    rephrase.splice(0, 0, rephrase[0]);
    rephrase.splice(rephrase.length - 1, 0, rephrase[rephrase.length - 1]);

    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[0] != undefined && triplet[0].isNode() && triplet[1] != undefined && triplet[1].isNode() && triplet[2].isNode())
            lonelynodes.push(triplet[1]);
    }

    return lonelynodes;
};

var getElementSignatures = function(rephrase) {
    var i;
    var signature;
    var id2signature = {};
    var id2nbsignaturealteration = {};
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isNode()) {
            signature = rephrase[i].data('sbgnlabel') + rephrase[i].data('sbgnclass');
            if(rephrase[i].data('sbgnstatesandinfos') != undefined && rephrase[i].data('sbgnstatesandinfos').length > 0) {
                rephrase[i].data('sbgnstatesandinfos').forEach(box => {
                    signature += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
                });
            }

            if(rephrase[i].data('sbgnclass') == "complex")
                signature += descString(rephrase[i].descendants());

            id2signature[rephrase[i].id()] = signature;
            id2nbsignaturealteration[rephrase[i].id()] = 0;
        }
    }

    for(i = 0; i < rephrase.length; i++) {
        if(id2signature[rephrase[i].data('parent')] && !id2nbsignaturealteration[rephrase[i].id()]) {
            id2signature[rephrase[i].id()] += id2signature[rephrase[i].data('parent')];
            id2nbsignaturealteration[rephrase[i].id()] = 1;
        }
    }

    return id2signature;
};

var rearrangeRephrase = function(rephrase, intermedprioritynodes) {
    var tmp;
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isEdge() && rephrase[i].source().id() != rephrase[i - 1].id()) {
            //Duplicate it !
            rephrase.splice(i - 1, 0, rephrase[i - 1]);
            rephrase.splice(i + 2, 0, rephrase[i + 2]);

            tmp = rephrase[i + 2];
            rephrase[i + 2] = rephrase[i];
            rephrase[i] = tmp;
        }
    }
};

var mergeNodes = function(rephrase, intermedprioritynodes, id2signature) {
    var i;
    var nonredundantnodes = {};
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isNode() && intermedprioritynodes[rephrase[i].data('sbgnclass')] == undefined && id2signature[rephrase[i].id()] in nonredundantnodes)
            rephrase[i] = nonredundantnodes[id2signature[rephrase[i].id()]];
        else if(rephrase[i].isNode() && intermedprioritynodes[rephrase[i].data('sbgnclass')] == undefined)
            nonredundantnodes[id2signature[rephrase[i].id()]] = rephrase[i];
    }
};

var mergeProcessNodes = function(rephrase, intermedprioritynodes, id2signature) {
    var i, j;
    var key;
    var processid;
    var signature;
    var toremove = 0;
    var idsbysignature = {};
    var signaturesbyid = {};
    var tripletsbyprocid = {};
    var triplet = new Array(3);
    var triplet2 = new Array(3);
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            processid = triplet[0].id();
            if(intermedprioritynodes[triplet[2].data('sbgnclass')])
                processid = triplet[2].id();

            if(tripletsbyprocid[processid] == undefined)
                tripletsbyprocid[processid] = [];

            tripletsbyprocid[processid].push([triplet[0], triplet[1], triplet[2]]);
        }
    }

    Object.keys(tripletsbyprocid).forEach(id => {
        tripletsbyprocid[id].forEach(triplet => { 
            signature = "";
            for(i = 0; i < 3; i++)
                signature += id2signature[triplet[i].id()];

            if(signaturesbyid[id] == undefined)
                signaturesbyid[id] = [];

            signaturesbyid[id].push(signature);
        });

        key = signaturesbyid[id].sort().join("");
        if(idsbysignature[key] == undefined)
            idsbysignature[key] = [];

        idsbysignature[key].push(id);
    });

    i = 0;
    Object.keys(idsbysignature).forEach(signature => {
        tripletsbyprocid[idsbysignature[signature][0]].forEach(triplet => {
            for(j = 0; j < 3; j++)
                rephrase[i + j] = triplet[j];

            i = i + 3;
            toremove = rephrase.length - i
        });
    });

    rephrase.splice(i, toremove);
};

var mergeEdges = function(rephrase, id2signature) {
    var i, j;
    var signature;
    var nonredundantedges = {};
    var triplet = new Array(3);
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            signature = "";
            for(j = 0; j < 3; j++)
                signature += id2signature[triplet[j].id()];

            if(nonredundantedges[signature] && triplet[0] == nonredundantedges[signature][0] && triplet[2] == nonredundantedges[signature][2]) {
                for(j = 0; j < 3; j++)
                    rephrase[i - (2 - j)] = nonredundantedges[signature][j];
            } else {
                nonredundantedges[signature] = new Array(3);
                for(j = 0; j < 3; j++)
                    nonredundantedges[signature][j] = triplet[j];
            }
        }
    }
};

var json2cytoscape = function(jsObj) {
    return cytoscape({
        elements: jsObj,
        headless: true,
        styleEnabled: true,
    });
};

function getXMLObject(itemId, loadXMLDoc) {
    switch (itemId) {

        case "0":
            $.ajax({
                url: './sample-app/samples/activated_stat1alpha_induction_of_the_irf1_gene.xml',
                success: loadXMLDoc
            });
            break;
        case "1":
            $.ajax({url: './sample-app/samples/glycolysis.xml', success: loadXMLDoc});
            break;
        case "2":
            $.ajax({url: './sample-app/samples/mapk_cascade.xml', success: loadXMLDoc});
            break;
        case "3":
            $.ajax({url: './sample-app/samples/polyq_proteins_interference.xml', success: loadXMLDoc});
            break;
        case "4":
            $.ajax({url: './sample-app/samples/insulin-like_growth_factor_signaling.xml', success: loadXMLDoc});
            break;
        case "5":
            $.ajax({
                url: './sample-app/samples/atm_mediated_phosphorylation_of_repair_proteins.xml', success: loadXMLDoc
            });
            break;
        case "6":
            $.ajax({
                url: './sample-app/samples/vitamins_b6_activation_to_pyridoxal_phosphate.xml', success: loadXMLDoc
            });
            break;
    }
};

module.exports = function(){
    var cyMod =  require('./app-cy.js');

    var editorActions = require('./EditorActionsManager.js');

    var sbgnContainer;

    var sbgnLayout;
    var sbgnProp;
    var pathsBetweenQuery;


     return MenuFunctions = { //global reference for testing


         refreshGlobalUndoRedoButtonsStatus: function(){
          editorActions.refreshGlobalUndoRedoButtonsStatus();
         },

         newFile: function(){
             setFileContent("new_file.sbgnml");

             var jsonObj = {nodes: [], edges: []};

             editorActions.modelManager.newModel( "me");
             cy.remove(cy.elements());
             sbgnContainer = new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions);
             editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);

         },

         mergeJsons:function(jsonGraphs){

             if(jsonGraphs.length == 0 )
                 return;

             editorActions.modelManager.setRollbackPoint(); //before merging everything

             //clear the canvas first
             this.newFile();


             //var labelMap = {}; //keeps label names in association with jsons -- an object of arrays
             var jsonObj = jsonGraphs[0].json;

             var sentenceNodeMap = {};
             var idxCardNodeMap = {};



             jsonGraphs[0].json.nodes.forEach(function(node){ //do for the first graph before any changes
                 console.log(node.data.id);
                 sentenceNodeMap[node.data.id] = [jsonGraphs[0].sentence];
                 idxCardNodeMap[node.data.id] = [jsonGraphs[0].idxCard];
             });




             for(var i = 0; i  < jsonGraphs.length - 1; i++){

                 var mergeResult = jsonMerger.merge(jsonObj, jsonGraphs[i+1].json); //jsonobj's ids remain the same


                 mergeResult.whichJsn.jsn2.forEach(function(nd){



                     if(sentenceNodeMap[nd] !== undefined) {
                         sentenceNodeMap[nd].push(jsonGraphs[i + 1].sentence);
                         idxCardNodeMap[nd].push(jsonGraphs[i + 1].idxCard);
                     }
                     else {
                         sentenceNodeMap[nd] = [jsonGraphs[i + 1].sentence];
                         idxCardNodeMap[nd] = [jsonGraphs[i + 1].idxCard];
                     }


                 });

                 console.log(mergeResult);
                 // mergeResult.whichJsn.jsn2.forEach(function(nd){
                 //     console.log("jsn2" + nd);
                 //
                 //     if(nodeMap[nd] !== undefined)
                 //         nodeMap[nd].push(jsonObj.sentence);
                 //     else
                 //         nodeMap[nd] = [jsonObj.sentence];
                 // });

                 // mergeResult.jsonToMerge.nodes.forEach(function(node){
                 //     var nodeId = node.data.id;
                 //     console.log((i+1) + " " + node.data.id);
                 //     if(nodeMap[nodeId] !== undefined)
                 //        nodeMap[nodeId].push(jsonGraphs[i+1].sentence);
                 //     else
                 //         nodeMap[nodeId] = [jsonGraphs[i+1].sentence];
                 // });



                 jsonObj = mergeResult.wholeJson;

             }

           //  console.log(mergeResult.wholeJson);
          //   console.log(nodeMap);

             //Map

             //get another sbgncontainer and display the new SBGN model.
             editorActions.modelManager.newModel( "me", true);

             sbgnContainer = new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions);
             editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", true);

            //Call merge notification after the layout
             editorActions.performLayoutFunction(true, function(){

                     editorActions.modelManager.mergeJsons();
             }); //don't update history



             return {sentences: sentenceNodeMap, idxCards: idxCardNodeMap};
         },

         mergeJsonWithCurrent: function(jsonGraph){
             var currSbgnml = jsonToSbgnml.createSbgnml(cy.nodes(":visible"), cy.edges(":visible"));
             var currJson = sbgnmlToJson.convert(currSbgnml);

			 this.stateBeforeMerge(jsonGraph, currJson);
             editorActions.modelManager.setRollbackPoint(); //before merging



             var mergeResult = jsonMerger.merge(currJson, jsonGraph); //Merge the two SBGN models.
             var jsonObj = mergeResult.wholeJson;
             var newJsonIds = mergeResult.jsonToMerge;

             //get another sbgncontainer and display the new SBGN model.
             editorActions.modelManager.newModel( "me", true);

             sbgnContainer = new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions);
             editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", true);

             editorActions.modelManager.setSampleInd(-1, "me", true); //to notify other clients

             //select the new graph
             newJsonIds.nodes.forEach(function(node){
                 var cyNode = cy.getElementById(node.data.id)[0];


                 if(cyNode)
                     editorActions.selectNode(cyNode);

             });

             //Call Layout


             beforePerformLayout();

             sbgnLayout.applyLayout(editorActions.modelManager);


             //Call merge notification after the layout
             editorActions.performLayoutFunction(true, function(){


                 editorActions.modelManager.mergeJsons();
             }); //don't update history


         },

         mergeSbgn: function(sbgnGraph){
             var newJson = sbgnmlToJson.convert(sbgnGraph);
             this.mergeJsonWithCurrent(newJson);
         },

         loadFile:function(txtFile){

             editorActions.modelManager.newModel("me");
             var jsonObj = sbgnmlToJson.convert(txtFile);



             //get another sbgncontainer
             sbgnContainer = (new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions));

             editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);
             editorActions.modelManager.setSampleInd(-1, "me"); //to notify other clients

         },
     

         //Agent loads the file
         loadFileInNode: function(txtFile){


            editorActions.modelManager.newModel("me");
            var jsonObj = sbgnmlToJson.convert(txtFile);

            //initialize cytoscape
            cytoscape({
                elements: jsonObj,
                headless: true,
                styleEnabled: true,


                ready: function () {
                    cy = this;
                }
            });



            //no container is necessary

            editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);

            editorActions.modelManager.setSampleInd(-1, "me"); //to notify other clients

         },

         //Methods for agents to interact with cytoscape
         showNodes: function(selectedNodeIds){
            //unselect all others
            cy.nodes().unselect();


            selectedNodeIds.forEach(function(nodeId){
                cy.getElementById( nodeId).select();
            });


            var param = {
                sync: true,
                selectedEles :  cy.$(":selected")
            };


            editorActions.showSelected(param);

        },

        hideNodes: function(selectedNodeIds){
            //unselect all others
            cy.nodes().unselect();


            selectedNodeIds.forEach(function(nodeId){
                cy.getElementById( nodeId).select();
            });


            var param = {
                sync: true,
                selectedEles : cy.$(":selected")
            };

            editorActions.hideSelected(param);

        },

        showAll: function(){
            editorActions.showAll({sync:true});
        },

        highlightNeighbors: function(selectedNodeIds){
            //unselect all others
            cy.nodes().unselect();


            selectedNodeIds.forEach(function(nodeId){
                cy.getElementById( nodeId).select();
            });


            var param = {
                sync: true,
                selectedEles : cy.$(":selected"),
                highlightNeighboursofSelected: true
            };



            editorActions.highlightSelected(param);

        },
        
        highlightProcesses: function(selectedNodeIds){
            //unselect all others
            cy.nodes().unselect();


            selectedNodeIds.forEach(function(nodeId){
                cy.getElementById( nodeId).select();
            });


            var param = {
                sync: true,
                selectedEles : cy.$(":selected"),
                highlightProcessesOfSelected: true
            };



            editorActions.highlightSelected(param);

        },
        
        removeHighlights: function(){
            editorActions.removeHighlights({sync:true});
        },

        addEdge:function(elId, source, target, sbgnclass, syncVal){
            var param ={

                sync: syncVal,
                id:elId,
                source: source,
                target: target,
                sbgnclass: sbgnclass

            };



            var result = editorActions.addEdge(param);

            return result.id();

        },

        addNode:function(elId, x, y, sbgnclass, sbgnlabel, syncVal){
            var param ={
                sync: syncVal,
                id:elId,
                x: x,
                y: y,
                sbgnclass: sbgnclass,
                sbgnlabel: sbgnlabel //for agents

            };

            var result = editorActions.addNode(param);


            return result.id();
        },

         makeCompoundComplex: function(data) {

             if (data) {

                 cy.nodes().unselect();

                 data.selectedNodeIds.forEach(function (nodeId) {

                     cy.getElementById(nodeId).select();
                 });
             }


             var selected = cy.nodes(":selected").filter(function (i, element) {
                 var sbgnclass = element.data("sbgnclass")
                 if (sbgnclass == 'unspecified entity'
                     || sbgnclass == 'simple chemical'
                     || sbgnclass == 'macromolecule'
                     || sbgnclass == 'nucleic acid feature'
                     || sbgnclass == 'complex') {
                     return true;
                 }
                 return false;
             });

             selected = sbgnElementUtilities.getRootsOfGivenNodes(selected);
             if (selected.length == 0 || !sbgnElementUtilities.allHaveTheSameParent(selected)) {
                 return;
             }
             var param = {
                 firstTime: true,
                 compoundType: "complex",
                 nodesToMakeCompound: selected
             };

             cy.elements().unselect();
             return editorActions.createCompoundForSelectedNodes(param);

         },
         makeCompoundCompartment: function(data ){


             if(data){
                 cy.nodes().unselect();

                 data.selectedNodeIds.forEach(function(nodeId){

                     cy.getElementById( nodeId).select();
                 });
             }


             var selected = cy.nodes(":selected");
             selected = sbgnElementUtilities.getRootsOfGivenNodes(selected);
             if (selected.length == 0 || !sbgnElementUtilities.allHaveTheSameParent(selected)) {
                 return;
             }

             var param = {
                 compoundType: "compartment",
                 nodesToMakeCompound: selected
             };
             cy.elements().unselect();
             return editorActions.createCompoundForSelectedNodes(param);

         },


        deleteElement: function(elId, syncVal){
            var el = cy.$(('#' + elId))[0];
            if(el){

                var param ={
                    eles:el,
                    sync: syncVal
                }
                editorActions.deleteSelected(param);

            }
        },

        changePosition: function(elId, pos, syncVal){
            var el = cy.$(('#' + elId))[0];
            var param = {
                ele: el,
                data: pos,
                sync: syncVal
            };


            if(el)
                editorActions.changePosition(param);


        },


       changeMultimerStatus: function(elId, isMultimer){

            var el = cy.$(('#' + elId))[0];
            var param = {
                ele: el,
                id: elId,
                data: isMultimer,
                sync: false
            };

            if(el)
                editorActions.changeIsMultimerStatus(param);

        },

        changeCloneMarkerStatus: function(elId, isCloneMarker){

            var el = cy.$(('#' + elId))[0];
            var param = {
                ele: el,
                id: elId,
                data: isCloneMarker,
                sync: false
            };

            if(el)
                editorActions.changeIsCloneMarkerStatus(param);

        },

        //Changes background-color
        //A separate command for highlighting nodes as we don't want the do/undo stack to be affected
        changeHighlightColor: function(elId, color){
            var el = cy.$(('#' + elId))[0];
            if(el)
                el.css('background-color', color);

            

        },
        //propName and modelDataName can be different: propName: name in cytoscape, modelDataName: name in nodejs model
        //proptype is either data or css
        changeElementProperty: function(elId, propName, modelDataName,propValue, propType, syncVal){
            var el = cy.$(('#' + elId))[0];

            if(el) {

                var param = {
                    ele: el,
                    id: elId,
                    dataType: propName,
                    data: propValue,
                    modelDataName: modelDataName,
                    sync: syncVal
                };

                if (propName == 'parent')//TODO
                    editorActions.changeParent(param);

                else if (propName == 'collapsedChildren') { //TODO???????
                    editorActions.changeCollapsedChildren(param);
                }

                else if (propName == "highlightStatus" || propName == "visibilityStatus")
                    editorActions.changeVisibilityOrHighlightStatus(param); //no do/undo here

                else {
                    var param = {
                        ele: [el],
                        id: elId,
                        dataType: propName,
                        data: propValue,
                        modelDataName: modelDataName,
                        sync: syncVal
                    };


                    if (propType == 'data')
                        editorActions.changeStyleData(param);
                    else if (propType == 'css')
                        editorActions.changeStyleCss(param);
                }
            }

         },

         changeExpandCollapseStatus: function(elId, status, syncVal) {
            var el = cy.$(('#' + elId))[0];

            setTimeout(function() { //wait for the layout to run on the other client's side
                if (status == 'expand') //no need to run incremental layout here -- other client will have run it already
                    editorActions.simpleExpandNode({node: el, sync: syncVal});
                else if (status == 'collapse')
                    editorActions.simpleCollapseNode({node: el, sync: syncVal});

            },0);
        },

         changeBendPoints:function(elId, newBendPointPositions, syncVal){
             var edge = cy.getElementById(elId);



             this.changeElementProperty(elId, 'bendPointPositions', 'bendPointPositions', newBendPointPositions, 'data', syncVal);

             if(newBendPointPositions.length > 0 ){
                 var result = sbgnBendPointUtilities.convertToRelativeBendPositions(edge);

                 if(result.distances.length > 0){
                     edge.data('weights', result.weights);
                     edge.data('distances', result.distances);
                     edge.css('curve-style', 'segments');
                 }

                 if(newBendPointPositions.length == 0){
                     edge.removeData('distances');
                     edge.removeData('weights');
                     edge.css('curve-style', 'bezier');
                 }
             }


             cy.forceRender();

         },



         //highlights the text without changing others
         highlightWords: function(text){
             cy.nodes().unselect();

//             var nodesToSelect = [];
             var words = text.split(/[\s.;-]/m);
             words.forEach(function(word){
                     cy.nodes().forEach(function(node){
                         for(var i = 0; i < words.length; i++){
                             if(node.data("sbgnlabel") && node.data("sbgnlabel").toLowerCase().indexOf(words[i].toLowerCase()) >= 0) {
                                 node.select();
                                 break; //break loop at first word match
                             }

                         }

                             //nodesToSelect.push(node);
                     });
             });



             // var nodesToSelect = cy.nodes().filter(function (i, ele) {
             //     if (ele.data("sbgnlabel") && ele.data("sbgnlabel").toLowerCase().indexOf(text.toLowerCase()) >= 0) {
             //         return true;
             //     }
             //     return false;
             // });


             var param = {
                 firstTime: true,
                 sync: true,
                 selectedEles : cy.$(":selected"),
                 highlightProcessesOfSelected: true
             };

             editorActions.highlightSelected(param);


         },

        updateLayoutProperties: function(lp){

            if(sbgnLayout)
                sbgnLayout.updateLayoutProperties(lp);

        },

        updateSample: function(ind, syncVal){


            if(ind < 0){ //for notifying other users -- this part is called through the model

                var jsonObj = editorActions.modelManager.getJsonFromModel();

                sbgnContainer =  (new cyMod.SBGNContainer('#sbgn-network-container', jsonObj,  editorActions));
                if(syncVal)
                    editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me");

            }
            else{

                
                getXMLObject(ind, function (xmlObject) {

                    var xmlText = new XMLSerializer().serializeToString(xmlObject);

                    var jsonObj = sbgnmlToJson.convert(xmlText);

                    sbgnContainer =  (new cyMod.SBGNContainer('#sbgn-network-container', jsonObj,  editorActions));

                    if(syncVal) {

                        editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me");
                    }

                });
          }


        },

        startInNode: function(modelManager){




            
            editorActions.modelManager = modelManager;

            var jsonObj = modelManager.getJsonFromModel();

            if (jsonObj == null) {//first time loading the graph-- load from the samples

                var ind = modelManager.getSampleInd("me");


                getXMLObject(ind, function (xmlObject) {

                    var xmlText = new XMLSerializer().serializeToString(xmlObject);
                   // var $ = require('jquery');
                    var jsonObj = sbgnmlToJson.convert(xmlText);


                    cytoscape({
                        elements: jsonObj,
                        headless: true,
                        styleEnabled: true,


                        ready: function () {
                            cy = this;
                        }
                    });



                    editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);


                });
      //          }


            }
            else { //load a previously loaded graph

                cytoscape({
                    elements: jsonObj,
                    headless: true,
                    styleEnabled: true,


                    ready: function () {
                        cy = this;
                    }
                });


                editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);
            }

        },

        start: function (modelManager) {


            //
            // //If we get a message om a separate window
            //TODO: find a better way
            window.addEventListener('message', function(event) {
                if(event.data  && event.data.indexOf("<sbgn xmlns") > -1) //check if this is an sbgn file, not some other message
                    self.loadFile(event.data);

            }, false);



            var self = this;

            var socket = io();

            editorActions.modelManager = modelManager;

            sbgnLayout = new SBGNLayout(modelManager);

            var layoutProperties = modelManager.updateLayoutProperties(sbgnLayout.defaultLayoutProperties);

            sbgnLayout.initialize(layoutProperties);


            sbgnProp = new SBGNProperties();
            sbgnProp.initialize();

            pathsBetweenQuery = new PathsBetweenQuery(socket,  editorActions.modelManager.getName());
            pathsBetweenQuery.initialize();



            var jsonObj = modelManager.getJsonFromModel();




            if (jsonObj == null) {//first time loading the graph-- load from the samples

                var ind = modelManager.getSampleInd("me");

                this.updateSample(ind, true);

            }
            else {//load from a previously loaded graph

                sbgnContainer = (new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions));

                editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);
            }


            //Initialize factoid model from the json data
            //var factoidInput = new FactoidInput();
            this.factoidHandler = require('./factoid-handler')(this, modelManager) ;
            this.factoidHandler.initialize();



            document.getElementById("ctx-add-bend-point").addEventListener("contextmenu", function (event) {
                event.preventDefault();
            }, false);

            document.getElementById("ctx-remove-bend-point").addEventListener("contextmenu", function (event) {
                event.preventDefault();
            }, false);



        // //Handle keyboard events
        //  $(document).keydown(function (e) {
        //          e = e || window.event;
        //      if(e.ctrlKey){
        //          var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
        //          if (charCode && String.fromCharCode(charCode) == "v" || String.fromCharCode(charCode) == "V") {
        //              editorActions.cloneSelected("me");
        //
        //          }
        //      }
        //  });

            //Listen to menu actions

            $('.ctx-bend-operation').click(function (e) {
                $('.ctx-bend-operation').css('display', 'none');
            });

            $('#ctx-add-bend-point').click(function (e) {
                var edge = sbgnBendPointUtilities.currentCtxEdge;

                //funda: add current bend point
                var newBendPointPositions = edge.data('bendPointPositions');
                newBendPointPositions.push(sbgnBendPointUtilities.currentCtxPos);



                sbgnBendPointUtilities.addBendPoint();

                self.changeBendPoints(edge.id(), newBendPointPositions, true);


            });

            $('#ctx-remove-bend-point').click(function (e) {
                var edge = sbgnBendPointUtilities.currentCtxEdge;

                sbgnBendPointUtilities.removeBendPoint();


                var bendPointPositions = edge.data('bendPointPositions');


                bendPointPositions.splice(sbgnBendPointUtilities.currentBendIndex,1);



                self.changeBendPoints(edge.id(), bendPointPositions, true);
            });

            $('#samples').click(function (e) {

                var ind = e.target.id;
                
                if(sbgnContainer)
                    editorActions.modelManager.newModel("me");


                self.updateSample(ind, true);

                editorActions.modelManager.setSampleInd(ind, "me"); //let others know

            });

            $('#new-file-icon').click(function () {
                $('#new-file').trigger("click");
            });

            $('#new-file').click(function () {
                self.newFile();
                //editorActions.manager.reset();
                //TODO: why is this here?
                //funda?????   cyMod.handleSBGNInspector(editorActions);
            });

            $('.add-node-menu-item').click(function (e) {
                if (!modeHandler.mode != "add-node-mode") {
                    modeHandler.setAddNodeMode();
                }
                var value = $(this).attr('name');
                modeHandler.selectedNodeType = value;
                modeHandler.setSelectedIndexOfSelector("add-node-mode", value);
                modeHandler.setSelectedMenuItem("add-node-mode", value);
            });

            $('.add-edge-menu-item').click(function (e) {
                if (!modeHandler.mode != "add-edge-mode") {
                    modeHandler.setAddEdgeMode();
                }
                var value = $(this).attr('name');
                modeHandler.selectedEdgeType = value;
                modeHandler.setSelectedIndexOfSelector("add-edge-mode", value);
                modeHandler.setSelectedMenuItem("add-edge-mode", value);
            });

            modeHandler.initialize();

            $('.sbgn-select-node-item').click(function (e) {
                //if (!modeHandler.mode != "add-node-mode") { //funda?
                if (!modeHandler.mode != "add-node-mode") {
                    modeHandler.setAddNodeMode();
                }
                var value = $('img', this).attr('value');
                modeHandler.selectedNodeType = value;
                modeHandler.setSelectedIndexOfSelector("add-node-mode", value);
                modeHandler.setSelectedMenuItem("add-node-mode", value);
            });

            $('.sbgn-select-edge-item').click(function (e) {
                if (!modeHandler.mode != "add-edge-mode") {
                    modeHandler.setAddEdgeMode();
                }
                var value = $('img', this).attr('value');
                modeHandler.selectedEdgeType = value;
                modeHandler.setSelectedIndexOfSelector("add-edge-mode", value);
                modeHandler.setSelectedMenuItem("add-edge-mode", value);
            });

            $('#node-list-set-mode-btn').click(function (e) {
                if (modeHandler.mode != "add-node-mode") {
                    modeHandler.setAddNodeMode();
                }
            });

            $('#edge-list-set-mode-btn').click(function (e) {
                if (modeHandler.mode != "add-edge-mode") {
                    modeHandler.setAddEdgeMode();
                }
            });

            $('#select-icon').click(function (e) {
                modeHandler.setSelectionMode();
            });

            $('#select-edit').click(function (e) {
                modeHandler.setSelectionMode();
            });


            $('#align-horizontal-top').click(function (e) {
                var selectedNodes = sbgnElementUtilities.getRootsOfGivenNodes(cy.nodes(":selected").filter(":visible"));
                if (selectedNodes.length <= 1) {
                    return;
                }
                var nodesData = getNodesData();

                var modelNode = window.firstSelectedNode ? firstSelectedNode : selectedNodes[0];
                var commonTopY = modelNode.position("y") - modelNode.height() / 2;

                for (var i = 0; i < selectedNodes.length; i++) {
                    var node = selectedNodes[i];
                    var oldPosY = node.position('y');
                    var newPosY = commonTopY + node.height() / 2;
                    node.position({
                        y: newPosY
                    });
                    sbgnElementUtilities.propogateReplacementToChildren(node, 0, newPosY - oldPosY);
                }

                editorActions.moveNodesConditionally({sync:true, nodes: selectedNodes});  //enable synchronization
                
            });

            $("#align-horizontal-top-icon").click(function (e) {
                $("#align-horizontal-top").trigger('click');
            });

            $('#align-horizontal-middle').click(function (e) {
                var selectedNodes = sbgnElementUtilities.getRootsOfGivenNodes(cy.nodes(":selected").filter(":visible"));
                if (selectedNodes.length <= 1) {
                    return;
                }
                var nodesData = getNodesData();

                var modelNode = window.firstSelectedNode ? firstSelectedNode : selectedNodes[0];
                var commonMiddleY = modelNode.position("y");

                for (var i = 0; i < selectedNodes.length; i++) {
                    var node = selectedNodes[i];
                    var oldPosY = node.position('y');
                    var newPosY = commonMiddleY;
                    node.position({
                        y: newPosY
                    });
                    sbgnElementUtilities.propogateReplacementToChildren(node, 0, newPosY - oldPosY);
                }

                editorActions.moveNodesConditionally({sync:true, nodes: selectedNodes});  //enable synchronization
                
            });

            $("#align-horizontal-middle-icon").click(function (e) {
                $("#align-horizontal-middle").trigger('click');
            });

            $('#align-horizontal-bottom').click(function (e) {
                var selectedNodes = sbgnElementUtilities.getRootsOfGivenNodes(cy.nodes(":selected").filter(":visible"));
                if (selectedNodes.length <= 1) {
                    return;
                }
                var nodesData = getNodesData();

                var modelNode = window.firstSelectedNode ? firstSelectedNode : selectedNodes[0];
                var commonBottomY = modelNode.position("y") + modelNode.height() / 2;

                for (var i = 0; i < selectedNodes.length; i++) {
                    var node = selectedNodes[i];
                    var oldPosY = node.position('y');
                    var newPosY = commonBottomY - node.height() / 2;
                    node.position({
                        y: newPosY
                    });
                    sbgnElementUtilities.propogateReplacementToChildren(node, 0, newPosY - oldPosY);
                }

                editorActions.moveNodesConditionally({sync:true, nodes: selectedNodes});  //enable synchronization
                
            });

            $("#align-horizontal-bottom-icon").click(function (e) {
                $("#align-horizontal-bottom").trigger('click');
            });

            $('#align-vertical-left').click(function (e) {
                var selectedNodes = sbgnElementUtilities.getRootsOfGivenNodes(cy.nodes(":selected").filter(":visible"));
                if (selectedNodes.length <= 1) {
                    return;
                }
                var nodesData = getNodesData();

                var modelNode = window.firstSelectedNode ? firstSelectedNode : selectedNodes[0];
                var commonLeftX = modelNode.position("x") - modelNode.width() / 2;

                for (var i = 0; i < selectedNodes.length; i++) {
                    var node = selectedNodes[i];
                    var oldPosX = node.position('x');
                    var newPosX = commonLeftX + node.width() / 2;
                    node.position({
                        x: newPosX
                    });
                    sbgnElementUtilities.propogateReplacementToChildren(node, newPosX - oldPosX, 0);
                }

                editorActions.moveNodesConditionally({sync:true, nodes: selectedNodes});  //enable synchronization
                
            });

            $("#align-vertical-left-icon").click(function (e) {
                $("#align-vertical-left").trigger('click');
            });

            $('#align-vertical-center').click(function (e) {
                var selectedNodes = sbgnElementUtilities.getRootsOfGivenNodes(cy.nodes(":selected").filter(":visible"));
                if (selectedNodes.length <= 1) {
                    return;
                }
                var nodesData = getNodesData();

                var modelNode = window.firstSelectedNode ? firstSelectedNode : selectedNodes[0];
                var commonCenterX = modelNode.position("x");

                for (var i = 0; i < selectedNodes.length; i++) {
                    var node = selectedNodes[i];
                    var oldPosX = node.position('x');
                    var newPosX = commonCenterX
                    node.position({
                        x: newPosX
                    });
                    sbgnElementUtilities.propogateReplacementToChildren(node, newPosX - oldPosX, 0);
                }

                editorActions.moveNodesConditionally({sync:true, nodes: selectedNodes});  //enable synchronization
                
            });

            $("#align-vertical-center-icon").click(function (e) {
                $("#align-vertical-center").trigger('click');
            });

            $('#align-vertical-right').click(function (e) {
                var selectedNodes = sbgnElementUtilities.getRootsOfGivenNodes(cy.nodes(":selected").filter(":visible"));
                if (selectedNodes.length <= 1) {
                    return;
                }
                var nodesData = getNodesData();

                var modelNode = window.firstSelectedNode ? firstSelectedNode : selectedNodes[0];
                var commonRightX = modelNode.position("x") + modelNode.width() / 2;

                for (var i = 0; i < selectedNodes.length; i++) {
                    var node = selectedNodes[i];
                    var oldPosX = node.position('x');
                    var newPosX = commonRightX - node.width() / 2;
                    node.position({
                        x: newPosX
                    });
                    sbgnElementUtilities.propogateReplacementToChildren(node, newPosX - oldPosX, 0);
                }

                editorActions.moveNodesConditionally({sync:true, nodes: selectedNodes});  //enable synchronization
                
            });

            $("#align-vertical-right-icon").click(function (e) {
                $("#align-vertical-right").trigger('click');
            });


            $("body").on("change", "#file-input", function (e) {
                if ($("#file-input").val() == "") {
                    return;
                }

                var fileInput = document.getElementById('file-input');
                var file = fileInput.files[0];



                //first clear everything
              //  $('#new-file').trigger("click");
                self.newFile();

                var reader = new FileReader();

                reader.onload = function (e) {

                    if(file.name.indexOf(".owl") > -1) {
                        socket.emit('BioPAXRequest', this.result, "sbgn", function(sbgnData){ //convert to sbgn
                            //socket.on('SBGNResult', function(sbgnData){

                                if(sbgnData.graph!= null){


                                    var jsonObj = sbgnmlToJson.convert(sbgnData.graph);
                                    //get another sbgncontainer
                                    sbgnContainer = (new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions));
                                    editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);
                                    editorActions.modelManager.setSampleInd(-1, "me"); //to notify other clients

                                }
                        });
                    }
                    else {

                        //FIXME this is causing a disconnection from the socket

                        socket.emit('BioPAXRequest', this.result, "biopax"); //convert to biopax

                        self.loadFile(this.result);

                    }
                    // sbgnContainer =  new cyMod.SBGNContainer('#sbgn-network-container', jsonObj ,  editorActions);
                }
                reader.readAsText(file);
                setFileContent(file.name);
                $("#file-input").val("");
            });

            $("#node-legend").click(function (e) {
                e.preventDefault();
                $.fancybox(
                    _.template($("#node-legend-template").html(), {}),
                    {
                        'autoDimensions': false,
                        'width': 420,
                        'height': 393,
                        'transitionIn': 'none',
                        'transitionOut': 'none',
                    });
            });

            $("#node-label-textbox").blur(function () {
                $("#node-label-textbox").hide();
                $("#node-label-textbox").data('node', undefined);
            });

            $("#node-label-textbox").on('change', function () {
                self.changeElementProperty( $(this).data('node').id(), 'sbgnlabel', 'sbgnlabel', $(this).attr('value'), 'data', true);
                $("#node-label-textbox").blur(); //funda added
            });

            $("#edge-legend").click(function (e) {
                e.preventDefault();
                $.fancybox(
                    _.template($("#edge-legend-template").html(), {}),
                    {
                        'autoDimensions': false,
                        'width': 400,
                        'height': 220,
                        'transitionIn': 'none',
                        'transitionOut': 'none',
                    });
            });

            $("#quick-help").click(function (e) {
                e.preventDefault();
                $.fancybox(
                    _.template($("#quick-help-template").html(), {}),
                    {
                        'autoDimensions': false,
                        'width': 420,
                        'height': "auto",
                        'transitionIn': 'none',
                        'transitionOut': 'none'
                    });
            });

            $("#how-to-use").click(function (e) {
                var url = "http://www.cs.bilkent.edu.tr/~ivis/sbgnviz-js/SBGNViz.js-1.x.UG.pdf";
                var win = window.open(url, '_blank');
                win.focus();
            });

            $("#about").click(function (e) {
                e.preventDefault();
                $.fancybox(
                    _.template($("#about-template").html(), {}),
                    {
                        'autoDimensions': false,
                        'width': 300,
                        'height': 320,
                        'transitionIn': 'none',
                        'transitionOut': 'none',
                    });
            });
            $("#hide-selected").click(function (e) {
                var param = {
                    sync: true,
                    selectedEles : cy.$(":selected")
                };

                editorActions.hideSelected(param);
                
            });
            $("#hide-selected-icon").click(function (e) {
                $("#hide-selected").trigger('click');
            });


            $("#show-selected").click(function (e) {
                var param = {
                    sync: true,
                    firstTime: true,
                    selectedEles : cy.$(":selected")
                };
                editorActions.showSelected(param);
                
            });
            $("#show-selected-icon").click(function (e) {
                $("#show-selected").trigger('click');
            });

            $("#show-all").click(function (e) {
                editorActions.showAll({sync:true});
                
            });

            $("#delete-selected-simple").click(function (e) {

                var selectedEles = cy.$(":selected");

                var param = {
                    // firstTime: false,
                    eles: selectedEles,
                    sync:true
                };


                //Funda unselect all nodes otherwise they don't get deleted
                //TODO cy.elements().unselect();

                

               editorActions.removeEles(selectedEles);





            });

            $("#delete-selected-simple-icon").click(function (e) {
                $("#delete-selected-simple").trigger('click');
            });
            $("#delete-selected-smart").click(function (e) {
                //find which elements will be selected

                var allNodes = cy.nodes();
                var selectedNodes = cy.nodes(":selected");
                cy.elements().unselect();
                var nodesToShow = sbgnFiltering.expandRemainingNodes(selectedNodes, allNodes);
                var nodesNotToShow = allNodes.not(nodesToShow);
                var connectedEdges = nodesNotToShow.connectedEdges();
                var selectedEles = connectedEdges.remove();

                selectedEles = selectedEles.union(nodesNotToShow.remove());

                var param = {
                    // firstTime: false,
                    eles: selectedEles,
                    sync: true
                };


                editorActions.deleteSelected(param);
                


            });

            $("#delete-selected-smart-icon").click(function (e) {
                $("#delete-selected-smart").trigger('click');
            });

            $("#neighbors-of-selected").click(function (e) {
                var param = {
                    sync: true,
                    selectedEles : cy.$(":selected"),
                    highlightNeighboursofSelected: true

                };

                editorActions.highlightSelected(param);
                


            });
            $("#highlight-neighbors-of-selected-icon").click(function (e) {
                $("#neighbors-of-selected").trigger('click');
            });

            $("#search-by-label-icon").click(function (e) {
                var text = $("#search-by-label-text-box").val().toLowerCase();
                if (text.length == 0) {
                    return;
                }
                cy.nodes().unselect();

                var nodesToSelect = cy.nodes(":visible").filter(function (i, ele) {
                    if (ele.data("sbgnlabel") && ele.data("sbgnlabel").toLowerCase().indexOf(text.toLowerCase()) >= 0) {
                        return true;
                    }
                    return false;
                });

                if (nodesToSelect.length == 0) {
                    return;
                }

                nodesToSelect.select();
                var param = {
                    firstTime: true,
                    sync: true,
                    selectedEles : cy.$(":selected"),
                    highlightProcessesOfSelected: true
                };

                editorActions.highlightSelected(param);
            });

            $("#search-by-label-text-box").keydown(function (e) {
                if (e.which === 13) {
                    $("#search-by-label-icon").trigger('click');
                }
            });

            $("#highlight-search-menu-item").click(function (e) {
                $("#search-by-label-text-box").focus();
            });

            $("#processes-of-selected").click(function (e) {
                var param = {
                    sync: true,
                    selectedEles : cy.$(":selected"),
                    highlightProcessesOfSelected: true
                };


               editorActions.highlightSelected(param);
                


            });

            $("#remove-highlights").click(function (e) {

                editorActions.removeHighlights({sync:true});
                



            });
            $('#remove-highlights-icon').click(function (e) {
                $('#remove-highlights').trigger("click");
            });
            $("#make-compound-complex").click(function (e) {
                self.makeCompoundComplex();
                // var selected = cy.nodes(":selected").filter(function (i, element) {
                //     var sbgnclass = element.data("sbgnclass")
                //     if (sbgnclass == 'unspecified entity'
                //         || sbgnclass == 'simple chemical'
                //         || sbgnclass == 'macromolecule'
                //         || sbgnclass == 'nucleic acid feature'
                //         || sbgnclass == 'complex') {
                //         return true;
                //     }
                //     return false;
                // });
                //
                // selected = sbgnElementUtilities.getRootsOfGivenNodes(selected);
                // if (selected.length == 0 || !sbgnElementUtilities.allHaveTheSameParent(selected)) {
                //     return;
                // }
                // var param = {
                //     firstTime: true,
                //     compoundType: "complex",
                //     nodesToMakeCompound: selected
                // };
                //
                // cy.elements().unselect();
                // editorActions.createCompoundForSelectedNodes(param);
                
            });

            $("#make-compound-compartment").click(function (e) {
                self.makeCompoundCompartment();
                // var selected = cy.nodes(":selected");
                // selected = sbgnElementUtilities.getRootsOfGivenNodes(selected);
                // if (selected.length == 0 || !sbgnElementUtilities.allHaveTheSameParent(selected)) {
                //     return;
                // }
                //
                // var param = {
                //     compoundType: "compartment",
                //     nodesToMakeCompound: selected
                // };
                // cy.elements().unselect();
                // editorActions.createCompoundForSelectedNodes(param);
                

            });

            $("#layout-properties").click(function (e) {
                var lp = editorActions.modelManager.updateLayoutProperties(sbgnLayout.defaultLayoutProperties);
                sbgnLayout.render(lp);
            });

            $("#layout-properties-icon").click(function (e) {
                $("#layout-properties").trigger('click');
            });

            $("#sbgn-properties").click(function (e) {
                sbgnProp.render();
            });

            $("#query-pathsbetween").click(function (e) {
                pathsBetweenQuery.render();
        
            });

            $("#properties-icon").click(function (e) {
                $("#sbgn-properties").trigger('click');
            });

            $("#collapse-selected").click(function (e) {
                var nodes = cy.nodes(":selected").filter("[expanded-collapsed='expanded']");
                var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(nodes, "collapse");

                if (!thereIs) {
                    return;
                }

                if (window.incrementalLayoutAfterExpandCollapse == null) {
                    window.incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');
                }
                if (incrementalLayoutAfterExpandCollapse)
                    editorActions.collapseGivenNodes({
                        nodes: nodes,
                        sync: true
                    });
                else
                    editorActions.simpleCollapseGivenNodes({nodes:nodes, sync: true});
                
            });
            $("#collapse-complexes").click(function (e) {
                var complexes = cy.nodes("[sbgnclass='complex'][expanded-collapsed='expanded']");
                var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(complexes, "collapse");

                if (!thereIs) {
                    return;
                }

                if (window.incrementalLayoutAfterExpandCollapse == null) {
                    window.incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');
                }
                if (incrementalLayoutAfterExpandCollapse)
                    editorActions.simpleCollapseGivenNodes({
                        nodes: complexes,
                        sync: true
                    });
                else
                    editorActions.simpleCollapseGivenNodes({nodes:complexes, sync: true});
            });
            $("#collapse-selected-icon").click(function (e) {
                if (modeHandler.mode == "selection-mode") {
                    $("#collapse-selected").trigger('click');
                }
            });
            $("#expand-selected").click(function (e) {
                var nodes = cy.nodes(":selected").filter("[expanded-collapsed='collapsed']");
                var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(nodes, "expand");

                if (!thereIs) {
                    return;
                }

                if (window.incrementalLayoutAfterExpandCollapse == null) {
                    window.incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');
                }
                if (incrementalLayoutAfterExpandCollapse)
                    editorActions.expandGivenNodes({
                        nodes: cy.nodes(":selected"),
                        sync: true
                    });
                else
                    editorActions.simpleExpandGivenNodes({nodes:nodes, sync: true});
                
            });


            $("#expand-complexes").click(function (e) {
                var complexes = cy.nodes("[sbgnclass='complex'][expanded-collapsed='collapsed']");
                var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(complexes, "expand");

                if (!thereIs) {
                    return;
                }

                if (window.incrementalLayoutAfterExpandCollapse == null) {
                    window.incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');
                }
                if (incrementalLayoutAfterExpandCollapse)
                    editorActions.expandAllNodes({
                        nodes: complexes,
                        sync: true,
                        selector: "complex-parent"
                    });
                else
                   editorActions.simpleExpandAllNodes({
                        nodes: complexes,
                        sync: true,
                        selector: "complex-parent"
                    });
            });
            $("#expand-selected-icon").click(function (e) {
                if (modeHandler.mode == "selection-mode") {
                    $("#expand-selected").trigger('click');
                }
            });

            $("#collapse-all").click(function (e) {
                var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(cy.nodes(":visible"), "collapse");

                if (!thereIs) {
                    return;
                }

                if (window.incrementalLayoutAfterExpandCollapse == null) {
                    window.incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');
                }
                if (incrementalLayoutAfterExpandCollapse)
                   editorActions.collapseGivenNodes({
                        nodes: cy.nodes(),
                        sync: true
                    });
                else
                   editorActions.simpleCollapseGivenNodes({nodes: cy.nodes(), sync: true});
                
            });

            $("#expand-all").click(function (e) {
                var thereIs = expandCollapseUtilities.thereIsNodeToExpandOrCollapse(cy.nodes(":visible"), "expand");

                if (!thereIs) {
                    return;
                }

                if (window.incrementalLayoutAfterExpandCollapse == null) {
                    window.incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');
                }
                if (incrementalLayoutAfterExpandCollapse)
                    editorActions.expandAllNodes({
                        firstTime: true
                    });
                else
                    editorActions.simpleExpandAllNodes();
                
            });

            $("#perform-layout-icon").click(function (e) {
                if (modeHandler.mode == "selection-mode") {
                    $("#perform-layout").trigger('click');
                }
            });


            $("#perform-layout").click(function (e) {



                beforePerformLayout();

                sbgnLayout.applyLayout(editorActions.modelManager);


                editorActions.performLayoutFunction();

                //       editorActions.manager._do(editorActions.ReturnToPositionsAndSizesCommand({nodesData: nodesData}));


            });


            $("#perform-incremental-layout").click(function (e) {


                beforePerformLayout();

                sbgnLayout.applyIncrementalLayout();

                //funda
                editorActions.performLayoutFunction();
                
            });

            $("#undo-last-action").click(function (e) {
                if(!editorActions.manager.isUndoStackEmpty()){ //funda added this check
                    editorActions.manager.undo();
                    
                }
            });

            $("#redo-last-action").click(function (e) {
                if(!editorActions.manager.isRedoStackEmpty()) { //funda added this check
                    editorActions.manager.redo();
                }
            });

            $("#undo-last-action-global").click(function (e) {
                if(editorActions.modelManager.isUndoPossible()){
                    editorActions.modelManager.undoCommand();

                    var i;
                    var edgejs;
                    var nodejs;
                    var tmp = [];
                    var rephrase2;
                    var idlist = {};
                    var old2newids = {};
                    var rephrase = cytoscape2rephrase(cy);
                    var jsonObj = {"nodes": [], "edges": []};
                    var lonelynodes = getLonelyNodes(rephrase);
                    var id2signature = getElementSignatures(rephrase);
                    var intermedprioritynodes = {'and': 1, 'association': 1, 'dissociation': 1, 'omitted process': 1, 'or': 1, 'process': 1, 'not': 1, 'source and sink': 1, 'uncertain process': 1};
                    
                    rearrangeRephrase(rephrase, intermedprioritynodes);

                    if(lonelynodes.length) {
                        rephrase2 = new Array(rephrase.length);
                        for(i = 0; i < rephrase.length; i++)
                            rephrase2[i] = rephrase[i];
                    }

                    mergeNodes(rephrase, intermedprioritynodes, id2signature);

                    if(lonelynodes.length) {
                        for(i = 0; i < rephrase.length; i++) {
                            idlist[rephrase[i].id()] = 1;
                            old2newids[rephrase2[i].id()] = rephrase[i].id();
                        }

                        for(i = 0; i < lonelynodes.length; i++) {
                            if(lonelynodes[i].id() in idlist)
                                tmp.push(lonelynodes[i]);
                        }
                    }

                    lonelynodes = tmp;

                    mergeProcessNodes(rephrase, intermedprioritynodes, id2signature);
                    mergeEdges(rephrase, id2signature);

                    for(i = 0; i < rephrase.length; i++) {
                        //desc = rephrase[i].descendants();
                        //desc.forEach(child => {
                        //    jsonObj.nodes.push(child.json());
                       //});

                        if(rephrase[i].isNode()) {
                            nodejs = rephrase[i].json();
                            if(nodejs.data.parent)
                                nodejs.data.parent = old2newids[nodejs.data.parent];

                            jsonObj.nodes.push(nodejs);
                        } else {
                            edgejs = rephrase[i].json();
                            edgejs.data.source = rephrase[i - 1].id();
                            edgejs.data.target = rephrase[i + 1].id();

                            jsonObj.edges.push(edgejs);
                        }
                    }

                    for(i = 0; i < lonelynodes.length; i++) {
                        nodejs = lonelynodes[i].json();
                        if(nodejs.data.parent)
                            nodejs.data.parent = old2newids[nodejs.data.parent];

                        jsonObj.nodes.push(nodejs);
                    }

                    sbgnContainer = (new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions));
                    editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);
                    editorActions.modelManager.setSampleInd(-1, "me"); //to notify other clients
                }
            });

            $("#redo-last-action-global").click(function (e) {
                if(editorActions.modelManager.isRedoPossible()) {
                    editorActions.modelManager.redoCommand();
                    
                }
            });

            $("#undo-icon").click(function (e) { //funda changed to global
                $("#undo-last-action-global").trigger('click');
            });

            $("#redo-icon").click(function (e) { //funda changed to global
                $("#redo-last-action-global").trigger('click');
            });

            $("#save-as-png").click(function (evt) {
                var pngContent = cy.png({scale: 3, full: true});

                // see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
                function b64toBlob(b64Data, contentType, sliceSize) {
                    contentType = contentType || '';
                    sliceSize = sliceSize || 512;

                    var byteCharacters = atob(b64Data);
                    var byteArrays = [];

                    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                        var slice = byteCharacters.slice(offset, offset + sliceSize);

                        var byteNumbers = new Array(slice.length);
                        for (var i = 0; i < slice.length; i++) {
                            byteNumbers[i] = slice.charCodeAt(i);
                        }

                        var byteArray = new Uint8Array(byteNumbers);

                        byteArrays.push(byteArray);
                    }

                    var blob = new Blob(byteArrays, {type: contentType});
                    return blob;
                }

                // this is to remove the beginning of the pngContent: data:img/png;base64,
                var b64data = pngContent.substr(pngContent.indexOf(",") + 1);

                saveAs(b64toBlob(b64data, "image/png"), "network.png");

                //window.open(pngContent, "_blank");
            });

            $("#save-as-jpg").click(function (evt) {
                var pngContent = cy.jpg({scale: 3, full: true});

                // see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
                function b64toBlob(b64Data, contentType, sliceSize) {
                    contentType = contentType || '';
                    sliceSize = sliceSize || 512;

                    var byteCharacters = atob(b64Data);
                    var byteArrays = [];

                    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                        var slice = byteCharacters.slice(offset, offset + sliceSize);

                        var byteNumbers = new Array(slice.length);
                        for (var i = 0; i < slice.length; i++) {
                            byteNumbers[i] = slice.charCodeAt(i);
                        }

                        var byteArray = new Uint8Array(byteNumbers);

                        byteArrays.push(byteArray);
                    }

                    var blob = new Blob(byteArrays, {type: contentType});
                    return blob;
                }

                // this is to remove the beginning of the pngContent: data:img/png;base64,
                var b64data = pngContent.substr(pngContent.indexOf(",") + 1);

                saveAs(b64toBlob(b64data, "image/jpg"), "network.jpg");
            });

            $("#load-file").click(function (evt) {
                $("#file-input").trigger('click');
            });

            $("#load-file-icon").click(function (evt) {
                $("#load-file").trigger('click');
            });

            $("#save-as-sbgnml").click(function (evt) {
                var sbgnmlText = jsonToSbgnml.createSbgnml(cy.nodes(":visible"), cy.edges(":visible"));

                var blob = new Blob([sbgnmlText], {
                    type: "text/plain;charset=utf-8;",
                });
                var filename = document.getElementById('file-name').innerHTML;
                saveAs(blob, filename);
            });

            $("#save-icon").click(function (evt) {
                $("#save-as-sbgnml").trigger('click');
            });

            $("#save-command-history").click(function (evt) {
                var cmdTxt = JSON.stringify(editorActions.modelManager.getHistory());

                var blob = new Blob([cmdTxt], {
                    type: "text/plain;charset=utf-8;",
                });
                var filename = document.getElementById('file-name').innerHTML;
                saveAs(blob, filename);
            });


            $("body").on("click", ".biogene-info .expandable", function (evt) {
                var expanderOpts = {
                    slicePoint: 150,
                    expandPrefix: ' ',
                    expandText: ' (...)',
                    userCollapseText: ' (show less)',
                    moreClass: 'expander-read-more',
                    lessClass: 'expander-read-less',
                    detailClass: 'expander-details',
                    expandEffect: 'fadeIn',
                    collapseEffect: 'fadeOut'
                };

                $(".biogene-info .expandable").expander(expanderOpts);
                expanderOpts.slicePoint = 2;
                expanderOpts.widow = 0;
            });

            //TODO: Funda

        $("#send-message").click(function(evt) {
	    var httpRequest;
	    if (window.XMLHttpRequest)
	        httpRequest = new XMLHttpRequest();
	    else
	        httpRequest = new ActiveXObject("Microsoft.XMLHTTP");

	    //Let REACH process the message posted in the chat box.
	    httpRequest.open("POST", "http://agathon.sista.arizona.edu:8080/odinweb/api/text", true);
    	    httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    	    httpRequest.send("text="+document.getElementById("inputs-comment").value+"&output=indexcard");
   	    httpRequest.onreadystatechange = function () { 
    	        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
		    var reachResponse = JSON.parse(httpRequest.responseText);
                    alert(JSON.stringify(reachResponse));
		    var jsonObj = idxcardjson.createJson(reachResponse); //Translate the index card JSON data format into a valid JSON model for SBGNviz.
		    //var currSbgnml = jsonToSbgnml.createSbgnml(cy.nodes(":visible"), cy.edges(":visible"));
		    //var currJson = sbgnmlToJson.convert(currSbgnml);
		    //var jsonObj = jsonMerger.merge(newJson, currJson); //Merge the two SBGN models.

               	    //get another sbgncontainer and display the new SBGN model.
            	    //editorActions.modelManager.deleteAll(cy.nodes(), cy.edges(), "me");
	            sbgnContainer = new cyMod.SBGNContainer('#sbgn-network-container', jsonObj, editorActions);
                    editorActions.modelManager.initModel(jsonObj, cy.nodes(), cy.edges(), "me", false);
                }
            }
        });

        //    $("#end-message").click(function(evt) {

        //        var msg = document.getElementById("inputs-comment").value;
        //        socket.emit("REACHQuery", "fries", msg); //for agent


        //        if(msg.toUpperCase().indexOf("PROCESS READY") > -1) {
        //            var sbgnSelected = jsonToSbgnml.createSbgnml(cy.nodes(":selected"), cy.edges(":selected"));


        //            socket.emit('BioPAXRequest', sbgnSelected, "partialBiopax"); **/

        //        }
        //    });

            $("#node-label-textbox").keydown(function (e) {
                if (e.which === 13) {
                    $("#node-label-textbox").blur();
                }
            });



        }
    }
}

function PathsBetweenQuery(socket, userName){

    return{
        el: '#query-pathsbetween-table',

        defaultQueryParameters: {
            geneSymbols: "MDM2 RB1",
            lengthLimit: 1
            //    shortestK: 0,
            //    enableShortestKAlteration: false,
            //    ignoreS2SandT2TTargets: false
        },
        currentQueryParameters: null,
        initialize: function () {
            var self = this;
            self.copyProperties();

        },
        copyProperties: function () {
            this.currentQueryParameters = _.clone(this.defaultQueryParameters);
        },
        render: function () {
            var self = this;
          //  self.template = _.template($("#query-pathsbetween-template").html(), self.currentQueryParameters);
           // $(self.el).html(self.template);



            self.template = _.template($("#query-pathsbetween-template").html()); //funda
            self.template(self.currentQueryParameters);
            $(self.el).html(self.template(self.currentQueryParameters)); //funda




            $("#query-pathsbetween-enable-shortest-k-alteration").change(function (e) {
                if (document.getElementById("query-pathsbetween-enable-shortest-k-alteration").checked) {
                    $("#query-pathsbetween-shortest-k").prop("disabled", false);
                }
                else {
                    $("#query-pathsbetween-shortest-k").prop("disabled", true);
                }
            });

            $(self.el).dialog({width: 'auto'});

            $("#save-query-pathsbetween").die("click").live("click", function (evt) {

                self.currentQueryParameters.geneSymbols = document.getElementById("query-pathsbetween-gene-symbols").value;
                self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-pathsbetween-length-limit").value);

                var pc2URL = "http://www.pathwaycommons.org/pc2/";
                var format = "graph?format=SBGN";
                // var format = "graph?format=BIOPAX";
                var kind = "&kind=PATHSBETWEEN";
                var limit = "&limit=" + self.currentQueryParameters.lengthLimit;
                var sources = "";

                var geneSymbolsArray = self.currentQueryParameters.geneSymbols.replace("\n", " ").replace("\t", " ").split(" ");
                for (var i = 0; i < geneSymbolsArray.length; i++) {
                    var currentGeneSymbol = geneSymbolsArray[i];
                    if (currentGeneSymbol.length == 0 || currentGeneSymbol == ' ' || currentGeneSymbol == '\n' || currentGeneSymbol == '\t') {
                        continue;
                    }

                    sources = sources + "&source=" + currentGeneSymbol;

                }


                pc2URL = pc2URL + format + kind + limit + sources;



                socket.emit('PCQuery',  {url: pc2URL, type:"sbgn"}, function(sbgnData){

                    if(sbgnData!=null) {

                        var w = window.open(("query_" + userName), "width = 1600, height = 1200, left = " + window.left + " right = " + window.right, function(){
                            w.postMessage(sbgnData, "*");

                        });

                        //
                        // //because window opening takes a while
                        // // // //FIXME: find a more elegant solution
                        // setTimeout(function () {
                        //     w.postMessage(sbgnData, "*");
                        // }, 1000);

                    }
                    else
                         alert("No results found!");

                });


                $(self.el).dialog('close');
            });

            $("#cancel-query-pathsbetween").die("click").live("click", function (evt) {
                $(self.el).dialog('close');
            });


        }

    }
}

function SBGNLayout(modelManager){


    return{

        defaultLayoutProperties: {
            name: 'cose-bilkent',
            nodeRepulsion: 4500,
            nodeOverlap: 10,
            idealEdgeLength: 50,
            edgeElasticity: 0.45,
            nestingFactor: 0.1,
            gravity: 0.4,
            numIter: 2500,
            tile: true,//funda: true gives error
            animate: true,
            randomize: true,
            tilingPaddingVertical: function () {
                return expandCollapseUtilities.calculatePaddings(parseInt(sbgnStyleRules['tiling-padding-vertical'], 10)); //funda changed name
            },
            tilingPaddingHorizontal: function () {
                return expandCollapseUtilities.calculatePaddings(parseInt(sbgnStyleRules['tiling-padding-horizontal'], 10));//funda changed name
            }

        },

        el: '#sbgn-layout-table',
        currentLayoutProperties: null,


        initialize: function(lp) {
            var self = this;

            self.currentLayoutProperties = lp;


            self.copyProperties();

            var templateProperties = _.clone(self.currentLayoutProperties);
            templateProperties.tilingPaddingVertical = sbgnStyleRules['tiling-padding-vertical'];
            templateProperties.tilingPaddingHorizontal = sbgnStyleRules['tiling-padding-horizontal'];


           // self.template = _.template($("#layout-settings-template").html()); //funda: using lodash
          //  self.template(templateProperties);


        },
        copyProperties: function () {
            this.currentLayoutProperties = _.clone(this.defaultLayoutProperties);
        },
        applyLayout: function () {
            var options = this.currentLayoutProperties;
            options.fit = options.randomize;

            cy.elements().filter(':visible').layout(options);

        },

        applyIncrementalLayout: function () {
            var options = _.clone(this.currentLayoutProperties);
            options.randomize = false;
            options.animate = false;
            options.fit = false;
            cy.elements().filter(':visible').layout(options);
        },
        updateLayoutProperties: function(layoutProps){

            this.currentLayoutProperties = _.clone(layoutProps);

        },
        render: function (lp) {

            var self = this;

            var templateProperties = _.clone(self.currentLayoutProperties);
            templateProperties.tilingPaddingVertical = sbgnStyleRules['tiling-padding-vertical'];
            templateProperties.tilingPaddingHorizontal = sbgnStyleRules['tiling-padding-horizontal'];


            self.template = _.template($("#layout-settings-template").html()); //funda

            $(self.el).html(self.template(templateProperties)); //funda


            $(self.el).dialog();


            $("#node-repulsion")[0].value = lp.nodeRepulsion.toString();
            $("#node-overlap")[0].value = lp.nodeOverlap.toString();
            $("#ideal-edge-length")[0].value = lp.idealEdgeLength.toString();
            $("#edge-elasticity")[0].value = lp.edgeElasticity.toString();
            $("#nesting-factor")[0].value = lp.nestingFactor.toString();
            $("#gravity")[0].value = lp.gravity.toString();
            $("#num-iter")[0].value = lp.numIter.toString();
            $("#tile")[0].checked = lp.tile;
            $("#animate")[0].checked = lp.animate;


            $("#save-layout").die("click").live("click", function (evt) {


                self.currentLayoutProperties.nodeRepulsion = Number(document.getElementById("node-repulsion").value);
                self.currentLayoutProperties.nodeOverlap = Number(document.getElementById("node-overlap").value);
                self.currentLayoutProperties.idealEdgeLength = Number(document.getElementById("ideal-edge-length").value);
                self.currentLayoutProperties.edgeElasticity = Number(document.getElementById("edge-elasticity").value);
                self.currentLayoutProperties.nestingFactor = Number(document.getElementById("nesting-factor").value);
                self.currentLayoutProperties.gravity = Number(document.getElementById("gravity").value);
                self.currentLayoutProperties.numIter = Number(document.getElementById("num-iter").value);
                self.currentLayoutProperties.tile = document.getElementById("tile").checked;
                self.currentLayoutProperties.animate = document.getElementById("animate").checked;
                self.currentLayoutProperties.randomize = !document.getElementById("incremental").checked;

                sbgnStyleRules['tiling-padding-vertical'] = Number(document.getElementById("tiling-padding-vertical").value);
                sbgnStyleRules['tiling-padding-horizontal'] = Number(document.getElementById("tiling-padding-horizontal").value);

                modelManager.setLayoutProperties(self.currentLayoutProperties);




                $(self.el).dialog('close');
            });

            $("#default-layout").die("click").live("click", function (evt) {
                self.copyProperties();

                sbgnStyleRules['tiling-padding-vertical'] = defaultSbgnStyleRules['tiling-padding-vertical'];
                sbgnStyleRules['tiling-padding-horizontal'] = defaultSbgnStyleRules['tiling-padding-horizontal'];

                var templateProperties = _.clone(self.currentLayoutProperties);
                templateProperties.tilingPaddingVertical = sbgnStyleRules['tiling-padding-vertical'];
                templateProperties.tilingPaddingHorizontal = sbgnStyleRules['tiling-padding-horizontal'];

                self.template = _.template($("#layout-settings-template").html(), templateProperties);
                $(self.el).html(self.template);
            });


            return this;
        }

    }};

function SBGNProperties(){

    return {
        el: '#sbgn-properties-table',
        defaultSBGNProperties: {
            compoundPadding: parseInt(sbgnStyleRules['compound-padding'], 10),
            dynamicLabelSize: sbgnStyleRules['dynamic-label-size'],
            fitLabelsToNodes: (sbgnStyleRules['fit-labels-to-nodes'] == 'true'),
            incrementalLayoutAfterExpandCollapse: (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true')
        },
        currentSBGNProperties: null,
        initialize: function () {
            var self = this;
            self.copyProperties();
     //       self.template = _.template($("#sbgn-properties-template").html());
     //       self.template(self.currentSBGNProperties);
        },
        copyProperties: function () {
            this.currentSBGNProperties = _.clone(this.defaultSBGNProperties);
        },
        render: function () {
            var self = this;
            self.template = _.template($("#sbgn-properties-template").html());
            $(self.el).html(self.template( self.currentSBGNProperties));

            $(self.el).dialog();

            $("#save-sbgn").die("click").live("click", function (evt) {

                var param = {};
                param.previousSBGNProperties = _.clone(self.currentSBGNProperties);

                self.currentSBGNProperties.compoundPadding = Number(document.getElementById("compound-padding").value);
                self.currentSBGNProperties.dynamicLabelSize = $('select[name="dynamic-label-size"] option:selected').val();
                self.currentSBGNProperties.fitLabelsToNodes = document.getElementById("fit-labels-to-nodes").checked;
                self.currentSBGNProperties.incrementalLayoutAfterExpandCollapse =
                    document.getElementById("incremental-layout-after-expand-collapse").checked;

                //Refresh paddings if needed
                if (sbgnStyleRules['compound-padding'] != self.currentSBGNProperties.compoundPadding) {
                    sbgnStyleRules['compound-padding'] = self.currentSBGNProperties.compoundPadding;
                    expandCollapseUtilities.refreshPaddings();
                }
                //Refresh label size if needed
                if (sbgnStyleRules['dynamic-label-size'] != self.currentSBGNProperties.dynamicLabelSize) {
                    sbgnStyleRules['dynamic-label-size'] = '' + self.currentSBGNProperties.dynamicLabelSize;
                    cy.nodes().removeClass('changeLabelTextSize');
                    cy.nodes().addClass('changeLabelTextSize');
                }
                //Refresh truncations if needed
                if (sbgnStyleRules['fit-labels-to-nodes'] != self.currentSBGNProperties.fitLabelsToNodes) {
                    sbgnStyleRules['fit-labels-to-nodes'] = '' + self.currentSBGNProperties.fitLabelsToNodes;
                    cy.nodes().removeClass('changeContent');
                    cy.nodes().addClass('changeContent');
                }

                sbgnStyleRules['incremental-layout-after-expand-collapse'] =
                    '' + self.currentSBGNProperties.incrementalLayoutAfterExpandCollapse;

                $(self.el).dialog('close');
            });

            $("#default-sbgn").die("click").live("click", function (evt) {
                self.copyProperties();
                self.template = _.template($("#sbgn-properties-template").html(), self.currentSBGNProperties);
                $(self.el).html(self.template);
            });

            return this;
        }
    }}
