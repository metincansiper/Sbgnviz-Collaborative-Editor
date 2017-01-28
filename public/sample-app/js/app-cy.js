
module.exports.SBGNContainer = function( el,  cytoscapeJsGraph, editorActions) {

    var addRemoveUtilities = require('../../src/utilities/add-remove-utilities.js');
    var expandCollapseUtilities = require('../../src/utilities/expand-collapse-utilities.js')();
    var bioGeneView = require('./biogene-info.js');

    var nodeLabelChanged = false;
    var prevNode;

    var self = this;



    //notifications
    // var notyModel = {layout: "bottomLeft", timeout: 8000, text: "Right click on a gene to see its details!"};
    //
    // noty(notyModel);


    var container = $(el);
    var positionMap = {};


    //add position information to data for preset layout and initialize derbyjs model
    for (var i = 0; i < cytoscapeJsGraph.nodes.length; i++) {
        var id = cytoscapeJsGraph.nodes[i].data.id;
        var xPos = cytoscapeJsGraph.nodes[i].data.sbgnbbox.x;
        var yPos = cytoscapeJsGraph.nodes[i].data.sbgnbbox.y;
        positionMap[id] = {'x': xPos, 'y': yPos};
    }




    var cyOptions = {
        elements: cytoscapeJsGraph,
        style: sbgnStyleSheet,
        layout: {
            name: 'preset',
            positions: positionMap
        },
        showOverlay: false,
        minZoom: 0.125,
        maxZoom: 16,
        boxSelectionEnabled: true,
        motionBlur: true,
        wheelSensitivity: 0.1,

        ready: function () {

            var socket = io();
            window.cy = this;

            var edges = cy.edges();
            var nodes = cy.nodes();

            for (var i = 0; i < edges.length; i++) {
                var edge = edges[i];
                var result = sbgnBendPointUtilities.convertToRelativeBendPositions(edge);

                if(result.distances.length > 0){
                    edge.data('weights', result.weights);
                    edge.data('distances', result.distances);
                }
            }

            expandCollapseUtilities.refreshPaddings();

            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];


                node.data("borderColor", node.css('border-color'));
                node.addClass('changeBorderColor');

                node.data("backgroundOpacity", node.css('background-opacity'));
                node.addClass('changeBackgroundOpacity');
            }

            for (var i = 0; i < edges.length; i++) {
                var edge = edges[i];
                edge.data("lineColor", edge.css('line-color'));
                edge.addClass('changeLineColor');
            }

            cy.one('layoutstop', function(){

                cy.nodes().forEach(function(node){
                    var stateAndInfos = node._private.data.sbgnstatesandinfos;
                    if(stateAndInfos)
                        relocateStateAndInfos(stateAndInfos);

                });

            });

            cy.nodes('[sbgnclass="complex"],[sbgnclass="compartment"],[sbgnclass="submap"]').data('expanded-collapsed', 'expanded');


            var paramResize;
            cy.noderesize({
                handleColor: '#000000', // the colour of the handle and the line drawn from it
                hoverDelay: 1, // time spend over a target node before it is considered a target selection
                enabled: true, // whether to start the plugin in the enabled state
                minNodeWidth: 30,
                minNodeHeight: 30,
                triangleSize: 20,
                lines: 3,
                padding: 5,
                start: function (sourceNode) {

                    // fired when noderesize interaction starts (drag on handle)
                    paramResize = {
                        ele: sourceNode,
                        initialWidth: sourceNode.width(),//keep this for undo operations
                        initialHeight: sourceNode.height(),
                        width: sourceNode.width(),
                        height: sourceNode.height(),
                        sync: true //synchronize with other users
                    }


                },
                complete: function (sourceNode, targetNodes, addedEntities) {
                    // fired when noderesize is done and entities are added


                },
                stop: function (sourceNode) {
                    paramResize.width = sourceNode.width();
                    paramResize.height = sourceNode.height();

                    editorActions.resizeNode(paramResize);




                }
            });

            //For adding edges interactively
            cy.edgehandles({
               // preview: true,
                complete: function (sourceNode, targetNodes, addedEntities) {
                    // fired when edgehandles is done and entities are added
                    var param = {};
                    var source = sourceNode.id();
                    var target = targetNodes[0].id();
                    var sourceClass = sourceNode.data('sbgnclass');
                    var targetClass = targetNodes[0].data('sbgnclass');
                    var sbgnclass = modeHandler.elementsHTMLNameToName[modeHandler.selectedEdgeType];
                    if (sbgnclass == 'consumption' || sbgnclass == 'modulation'
                        || sbgnclass == 'stimulation' || sbgnclass == 'catalysis'
                        || sbgnclass == 'inhibition' || sbgnclass == 'necessary stimulation') {
                        if (!isEPNClass(sourceClass) || !isPNClass(targetClass) || !isLogicalOperator(sourceClass) || !isLogicalOperator(targetClass)) { //funda
                            if (isPNClass(sourceClass) && (isEPNClass(targetClass) || isLogicalOperator(targetClass))) {
                                //If just the direction is not valid reverse the direction
                                var temp = source;
                                source = target;
                                target = temp;
                            }
                            else {
                                return;
                            }
                        }
                    }
                    else if (sbgnclass == 'production') {
                        if (!isPNClass(sourceClass) || !isEPNClass(targetClass)|| !isLogicalOperator(sourceClass) || !isLogicalOperator(targetClass)) {
                            if (isEPNClass(sourceClass) && isPNClass(targetClass) || isLogicalOperator(sourceClass)) {
                                //If just the direction is not valid reverse the direction
                                var temp = source;
                                source = target;
                                target = temp;
                            }
                            else {
                                return;
                            }
                        }
                    }
                    /*else if (sbgnclass == 'logic arc') { //FUNDA
                        if (!isEPNClass(sourceClass) || !isLogicalOperator(targetClass)) {
                            if (isLogicalOperator(sourceClass) && isEPNClass(targetClass)) {
                                //if (isLogicalOperator(sourceClass) || isEPNClass(sourceClass) ) {
                                //If just the direction is not valid reverse the direction
                                var temp = source;
                                source = target;
                                target = temp;
                            }
                            else {
                                return;
                            }
                        }

                    }*/
                    else if (sbgnclass == 'equivalence arc') {
                        if (!(isEPNClass(sourceClass) && convenientToEquivalence(targetClass))
                            && !(isEPNClass(targetClass) && convenientToEquivalence(sourceClass))) {
                            return;
                        }
                    }

                    param = {
                        source: source,
                        target: target,
                        sbgnclass: sbgnclass,
                        sync:true
                    };
                    editorActions.addEdge(param);
                    modeHandler.setSelectionMode();
                    var edge = cy.edges()[cy.edges().length -1].select();



                }
            });



            try { //Todo FUNDA : gives error????
               cy.edgehandles('drawoff');
            }
            catch(err){
               console.log(err);
            }

            expandCollapseUtilities.initCollapsedNodes();

            var panProps = ({
                fitPadding: 10,
            });
      //funda     container.cytoscapePanzoom(panProps);



        var lastMouseDownNodeInfo = null;
            cy.on("mousedown", "node", function () {
                

                var self = this;
                if (modeHandler.mode == 'selection-mode' && window.ctrlKeyDown) {

                    enableDragAndDropMode();
                    window.nodeToDragAndDrop = self;
                }
                else {
                    lastMouseDownNodeInfo = {};
                    lastMouseDownNodeInfo.lastMouseDownPosition = {
                        x: this.position("x"),
                        y: this.position("y")
                    };
                    lastMouseDownNodeInfo.node = this;
                }

            });

            cy.on("mouseup", function (event) {
                var self = event.cyTarget;
                if (window.dragAndDropModeEnabled) {
                    var nodesData = getNodesData();
                    nodesData.firstTime = true;
                    var newParent;
                    if (self != cy) {
                        newParent = self;
                    }
                    var node = window.nodeToDragAndDrop;

                    if (newParent && self.data("sbgnclass") != "complex" && self.data("sbgnclass") != "compartment") {
                        return;
                    }

                    if (newParent && self.data("sbgnclass") == "complex" && !isEPNClass(node.data("sbgnclass"))) {
                        return;
                    }

           //funda         disableDragAndDropMode();
                    if (node.parent()[0] == newParent || node._private.data.parent == node.id()) {
                        return;
                    }
                    var param = {
                        newParent: newParent,
                        ele: node,
                        id: node.id(),
                        nodesData: nodesData,
                        posX: event.cyPosition.x,
                        posY: event.cyPosition.y,
                        sync: true,
                    };
                   editorActions.changeParent(param);
                }
            });

            //cy.on("mouseup", "node", function () {
            cy.on("mouseup", "node", function () {
                if (window.dragAndDropModeEnabled) {
                    return;
                }

                if (lastMouseDownNodeInfo == null) {
                    return;
                }


                var node = lastMouseDownNodeInfo.node;
                var lastMouseDownPosition = lastMouseDownNodeInfo.lastMouseDownPosition;
                var mouseUpPosition = {
                    x: node.position("x"),
                    y: node.position("y")
                };
                if (mouseUpPosition.x != lastMouseDownPosition.x ||
                    mouseUpPosition.y != lastMouseDownPosition.y) {
                    var positionDiff = {
                        x: mouseUpPosition.x - lastMouseDownPosition.x,
                        y: mouseUpPosition.y - lastMouseDownPosition.y
                    };

                    var nodes;
                    if (node.selected()) {
                        nodes = cy.nodes(":visible").filter(":selected");
                    }
                    else {
                        nodes = [];
                        nodes.push(node);
                    }

                    var param = {
                        positionDiff: positionDiff,
                        nodes: nodes,
                       // move: false,
                        sync: true
                    };


                    editorActions.moveNodesConditionally(param);





                    lastMouseDownNodeInfo = null;


                   editorActions.unselectNode(this);


                }
            });



            cy.on('select', 'node', function(event) { //Necessary for multiple selections
                editorActions.selectNode(this);

            });
            cy.on('unselect', 'node', function() { //causes sync problems in delete op

                editorActions.unselectNode(this);

            });
            cy.on('grab', 'node', function(event) { //Also works as 'select'


                editorActions.selectNode(this);
            });

            cy.on('select', 'edge', function(event) {
                editorActions.selectEdge(this);

            });

            cy.on('unselect', 'edge', function(event) {
                editorActions.unselectEdge(this);
            });


            cy.on('mouseover', 'node', function (event) {
                var node = this;
                if (modeHandler.mode != "selection-mode") {
                    node.mouseover = false;
                }
                else if (!node.mouseover) {
                    node.mouseover = true;
                    //make preset layout to redraw the nodes
                    cy.forceRender();
                }

                $(".qtip").remove();

                if (event.originalEvent.shiftKey)
                    return;

                node.qtipTimeOutFcn = setTimeout(function () {
                    nodeQtipFunction(node);
                }, 1000);
            });

            cy.on('mouseout', 'node', function (event) {

                if (this.qtipTimeOutFcn != null) {
                    clearTimeout(this.qtipTimeOutFcn);
                    this.qtipTimeOutFcn = null;
                }
                this.mouseover = false;           //make preset layout to redraw the nodes
                cy.forceRender();
            });



            cy.on('cxttap', 'node', function (event) { //funda not working on Chrome!!!!!
                var node = this;
                $(".qtip").remove();

                var geneClass = node._private.data.sbgnclass;
                if (geneClass != 'macromolecule' && geneClass != 'nucleic acid feature' &&
                    geneClass != 'unspecified entity')
                    return;


                socket.emit('BioGeneQuery',  {
                    query: node._private.data.sbgnlabel, //gene name
                    org: "human",
                    format: "json"
                });
                editorActions.modelManager.updateHistory({opName:"query", opTarget:"element", elType: "node", elId:node.id(), param: node._private.data.sbgnlabel});

                var queryResult = "";
                var p1 = new Promise(function (resolve, reject) {
                    socket.on("BioGeneResult", function (val) {
                        queryResult = JSON.parse(val);
                        resolve("success");

                    });
                });

                cy.$(('#' + node.id())).qtip({
                    content: {
                        text: function (event, api) {

                            p1.then(function (content) {
                               if (queryResult.count > 0) {
                                   var info = (new bioGeneView(queryResult.geneInfo[0])).render();
                                    var html = $('#biogene-container').html();
                                    api.set('content.text', html);
                               }
                                else {
                                    api.set('content.text', "No additional information available &#013; for the selected node!");
                                }

                            }), function (xhr, status, error) {
                                api.set('content.text', "Error retrieving data: " + error);
                            };
                            api.set('content.title', node._private.data.sbgnlabel);

                            return _.template($("#loading-small-template").html());

                        }
                    },
                    show: {
                        ready: true
                    },
                    position: {
                        my: 'top center',
                        at: 'bottom right',
                        adjust: {
                            cyViewport: true
                        },
                        effect: false
                    },
                    style: {
                        classes: 'qtip-bootstrap',
                        tip: {
                            width: 16,
                            height: 8
                        }
                    }
                });
            });

            var cancelSelection;
            var selectAgain;
            cy.on('select', 'node', function (event) {


                if (cancelSelection) {
                    this.unselect();
                    cancelSelection = null;
                    selectAgain.select();
                    selectAgain = null;
                }
            });

            cy.on('select', function (event) {
                module.exports.handleSBGNInspector(editorActions);
            });

            cy.on('unselect', function (event) {
                module.exports.handleSBGNInspector(editorActions);
            });


            cy.on('tap', function (event) {
                $("#node-label-textbox").blur();
                $('.ctx-bend-operation').css('display', 'none');

                //label change synchronization is done in menu-functions
                if(nodeLabelChanged){

                    nodeLabelChanged = false;
                }

              //??  cy.nodes(":selected").length;
                if (modeHandler.mode == "add-node-mode") {
                    var cyPosX = event.cyPosition.x;
                    var cyPosY = event.cyPosition.y;
                    var sbgnclass = modeHandler.elementsHTMLNameToName[modeHandler.selectedNodeType];
                    var param = {
                        sync: true,
                        x: cyPosX,
                        y: cyPosY,
                        sbgnclass: sbgnclass
                    };


                   editorActions.addNode(param);
                    modeHandler.setSelectionMode();

                    //node.select();




                }
            });

            var tappedBefore = null;


            cy.on('doubleTap', 'node', function (event) {

                if (modeHandler.mode == 'selection-mode') {

                    var node = this;
                    var containerPos = $(cy.container()).position();
                    var left = containerPos.left + this.renderedPosition().x;
                    left -= $("#node-label-textbox").width() / 2;
                    left = left.toString() + 'px';
                    var top = containerPos.top + this.renderedPosition().y;
                    top -= $("#node-label-textbox").height() / 2;
                    top = top.toString() + 'px';

                    $("#node-label-textbox").css('left', left);
                    $("#node-label-textbox").css('top', top);
                    $("#node-label-textbox").show();
                    var sbgnlabel = this._private.data.sbgnlabel || "";

                    $("#node-label-textbox").attr('value', sbgnlabel);
                    $("#node-label-textbox").data('node', this);
                    $("#node-label-textbox").focus();


                    nodeLabelChanged = true;
                    node.data('sbgnlabel', sbgnlabel);


                    prevNode = node;

                }


            });

            cy.on('tap', 'node', function (event) {

                var node = this;



                var tappedNow = event.cyTarget;
                setTimeout(function () {
                    tappedBefore = null;
                }, 300);
                if (tappedBefore === tappedNow) {
                    tappedNow.trigger('doubleTap');
                    tappedBefore = null;
                } else {
                    tappedBefore = tappedNow;
                }

                //Handle expand-collapse box
                var cyPosX = event.cyPosition.x;
                var cyPosY = event.cyPosition.y;



                if (modeHandler.mode == "selection-mode"
                    && cyPosX >= node._private.data.expandcollapseStartX
                    && cyPosX <= node._private.data.expandcollapseEndX
                    && cyPosY >= node._private.data.expandcollapseStartY
                    && cyPosY <= node._private.data.expandcollapseEndY) {


                    selectAgain = cy.filter(":selected");
                    cancelSelection = true;
                    var expandedOrcollapsed = this.data('expanded-collapsed');

                    var incrementalLayoutAfterExpandCollapse =
                        (sbgnStyleRules['incremental-layout-after-expand-collapse'] == 'true');

                    if (expandedOrcollapsed == 'expanded') {
                        if (incrementalLayoutAfterExpandCollapse)
                            editorActions.collapseNode({node:this, sync: true}); //funda

                        else
                            editorActions.simpleCollapseNode({node:this, sync: true});


                    }
                    else {
                        if (incrementalLayoutAfterExpandCollapse)
                            editorActions.expandNode({node:this, sync: true}); //funda
                        else
                            editorActions.simpleExpandNode({node:this, sync: true});


                    }
                }

                $(".qtip").remove();

                if (event.originalEvent.shiftKey)
                    return;

                if (node.qtipTimeOutFcn != null) {
                    clearTimeout(node.qtipTimeOutFcn);
                    node.qtipTimeOutFcn = null;
                }

                 nodeQtipFunction(node); //shows the full label

            });


            cy.on('cxttap', 'edge', function (event) {
                var edge = this;
                var containerPos = $(cy.container()).position();

                var left = containerPos.left + event.cyRenderedPosition.x;
                left = left.toString() + 'px';

                var top = containerPos.top +  event.cyRenderedPosition.y;
                top = top.toString() + 'px';


                $('.ctx-bend-operation').css('display', 'none');

                var selectedBendIndex = cytoscape.sbgn.getContainingBendShapeIndex(event.cyPosition.x, event.cyPosition.y, edge);
                if(selectedBendIndex == -1){
                    $('#ctx-add-bend-point').css('display', 'block');
                    sbgnBendPointUtilities.currentCtxPos = event.cyPosition;
                    ctxMenu = document.getElementById("ctx-add-bend-point");
                }
                else {
                    $('#ctx-remove-bend-point').css('display', 'block');
                    sbgnBendPointUtilities.currentBendIndex = selectedBendIndex;
                    ctxMenu = document.getElementById("ctx-remove-bend-point");
                }

                ctxMenu.style.display = "block";
                ctxMenu.style.left = left;
                ctxMenu.style.top = top;



                sbgnBendPointUtilities.currentCtxEdge = edge;
            });
            var movedBendIndex;
            var movedBendEdge;
            var moveBendParam;

            cy.on('tapstart', 'edge', function (event) {
                var edge = this;
                movedBendEdge = edge;

                moveBendParam = {
                    edge: edge,
                    weights: edge.data('weights')?[].concat(edge.data('weights')):edge.data('weights'),
                    distances: edge.data('distances')?[].concat(edge.data('distances')):edge.data('distances')
                };

                var cyPosX = event.cyPosition.x;
                var cyPosY = event.cyPosition.y;

                if(edge._private.selected){
                    var index = cytoscape.sbgn.getContainingBendShapeIndex(cyPosX, cyPosY, edge);
                    if(index != -1){
                        movedBendIndex = index;
                        cy.panningEnabled(false);
                        cy.boxSelectionEnabled(false);
                    }
                }
            });

            cy.on('tapdrag', function (event) {
                var edge = movedBendEdge;

                if(movedBendEdge === undefined || movedBendIndex === undefined){
                    return;
                }

                var weights = edge.data('weights');
                var distances = edge.data('distances');

                var relativeBendPosition = sbgnBendPointUtilities.convertToRelativeBendPosition(edge, event.cyPosition);
                weights[movedBendIndex] = relativeBendPosition.weight;
                distances[movedBendIndex] = relativeBendPosition.distance;

                edge.data('weights', weights);
                edge.data('distances', distances);


                //notify others
                //update bendpoint positions
                var bendPointPositions = edge.data('bendPointPositions');
                bendPointPositions[movedBendIndex] = event.cyPosition;

                editorActions.changeStyleData({dataType:'bendPointPositions', data: bendPointPositions, sync:true, modelDataName:'bendPointPositions', ele:edge});
            });

            cy.on('tapend', 'edge', function (event) {
                var edge = movedBendEdge;

                if(moveBendParam !== undefined && edge.data('weights')
                    && edge.data('weights').toString() != moveBendParam.weights.toString()){
                    editorActions.changeBendPoints(moveBendParam);



                }

                movedBendIndex = undefined;
                movedBendEdge = undefined;
                moveBendParam = undefined;

                cy.panningEnabled(true);
                cy.boxSelectionEnabled(true);
            });



        }
    };


    container.html("");
    container.cy(cyOptions);

    return this;
};



module.exports.handleSBGNInspector = function (editorActions) {


    var selectedEles = cy.elements(":selected");
    if(selectedEles.length == 0){
        $("#sbgn-inspector").html("");
        return;
    }
    var width = $("#sbgn-inspector").width() * 0.45;

    var allNodes = allAreNode(selectedEles);
    var allEdges = allAreEdge(selectedEles);

    if (allNodes || allEdges) {
        var sbgnlabel = getCommonLabel(selectedEles);
        if (sbgnlabel == null) {
            sbgnlabel = "";
        }

        var classInfo = getCommonSBGNClass(selectedEles);
        if (classInfo == 'and' || classInfo == 'or' || classInfo == 'not') {
            classInfo = classInfo.toUpperCase();
        }
        else {
            classInfo = classInfo.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
            classInfo = classInfo.replace(' Of ', ' of ');
            classInfo = classInfo.replace(' And ', ' and ');
            classInfo = classInfo.replace(' Or ', ' or ');
            classInfo = classInfo.replace(' Not ', ' not ');
        }

        var title = classInfo == "" ? "Properties" : classInfo + " Properties";

        var buttonwidth = width;
        if (buttonwidth > 50) {
            buttonwidth = 50;
        }

        var html = "<div style='text-align: center; color: black; font-weight: bold; margin-bottom: 5px;'>" + title + "</div><table cellpadding='0' cellspacing='0'>";
        var type;
        var fillStateAndInfos;
        var multimerCheck;
        var clonedCheck;
        var commonIsMultimer;
        var commonIsCloned;
        var commonStateAndInfos;
        var commonSBGNCardinality;


        if (allNodes) {
            type = "node";

            var borderColor = getCommonBorderColor(selectedEles);
            borderColor = borderColor ? borderColor : '#FFFFFF';

            var backgroundColor = getCommonFillColor(selectedEles);
            backgroundColor = backgroundColor ? backgroundColor : '#FFFFFF';

            var borderWidth = getCommonBorderWidth(selectedEles);

            var backgroundOpacity = getCommonBackgroundOpacity(selectedEles);
            backgroundOpacity = backgroundOpacity ? backgroundOpacity : 0.5;

            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Label</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-label' class='inspector-input-box' type='text' style='width: " + width / 1.25 + "px;' value='" + sbgnlabel
                + "'/>" + "</td></tr>";
            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Border Color</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-border-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + borderColor
                + "'/>" + "</td></tr>";
            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-fill-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + backgroundColor
                + "'/>" + "</td></tr>";
            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Border Width</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-border-width' class='inspector-input-box' type='number' step='0.01' min='0' style='width: " + buttonwidth + "px;'";

            if (borderWidth) {
                html += " value='" + parseFloat(borderWidth) + "'";
            }

            html += "/>" + "</td></tr>";

            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Fill Opacity</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-background-opacity' class='inspector-input-box' type='range' step='0.01' min='0' max='1' style='width: " + buttonwidth + "px;' value='" + parseFloat(backgroundOpacity)
                + "'/>" + "</td></tr>";

            commonStateAndInfos = getCommonStateAndInfos(selectedEles);

            if (commonStateAndInfos) {
                if (allCanHaveStateVariable(selectedEles)) {
                    fillStateAndInfos = true;

                    html += "<tr><td colspan='2'><hr style='padding: 0px; margin-top: 5px; margin-bottom: 5px;' width='" + $("#sbgn-inspector").width() + "'></td></tr>";
                    html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>State Variables</font>" + "</td>"
                        + "<td id='inspector-state-variables' style='padding-left: 5px; width: '" + width + "'></td></tr>";
                }

                if (allCanHaveUnitOfInformation(selectedEles)) {
                    fillStateAndInfos = true;

                    html += "<tr><td colspan='2'><hr style='padding: 0px; margin-top: 5px; margin-bottom: 5px;' width='" + $("#sbgn-inspector").width() + "'></td></tr>";
                    html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Units of Information</font>" + "</td>"
                        + "<td id='inspector-unit-of-informations' style='padding-left: 5px; width: '" + width + "'></td></tr>";
                }
            }

            commonIsMultimer = getCommonIsMultimer(selectedEles);
            commonIsCloned = getCommonIsCloned(selectedEles);
//      multimerCheck = ( commonIsMultimer !== null ) && allCanBeMultimer(selectedEles);
//      clonedCheck = ( commonIsCloned !== null ) && allCanBeCloned(selectedEles);
            multimerCheck = allCanBeMultimer(selectedEles);
            clonedCheck = allCanBeCloned(selectedEles);

            multimerCheck = multimerCheck ? multimerCheck : false;
            clonedCheck = clonedCheck ? clonedCheck : false;

            if (multimerCheck || clonedCheck) {
                html += "<tr><td colspan='2'><hr style='padding: 0px; margin-top: 5px; margin-bottom: 5px;' width='" + $("#sbgn-inspector").width() + "'></td></tr>";
            }

            if (multimerCheck) {
                html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Multimer</font>" + "</td>"
                    + "<td style='padding-left: 5px; width: '" + width + "'><input type='checkbox' id='inspector-is-multimer'></td></tr>";
            }

            if (clonedCheck) {
                html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Cloned</font>" + "</td>"
                    + "<td style='padding-left: 5px; width: '" + width + "'><input type='checkbox' id='inspector-is-clone-marker'></td></tr>";
            }
        }
        else {
            type = "edge";

            var commonLineColor = getCommonLineColor(selectedEles);
            commonLineColor = commonLineColor ? commonLineColor : '#FFFFFF';

            var commonLineWidth = getCommonLineWidth(selectedEles);

            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-line-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + commonLineColor
                + "'/>" + "</td></tr>";

            html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Width</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-width' class='inspector-input-box' type='number' step='0.01' min='0' style='width: " + buttonwidth + "px;'";

            if (commonLineWidth) {
                html += " value='" + parseFloat(commonLineWidth) + "'";
            }

            html += "/>" + "</td></tr>";

            if (allCanHaveSBGNCardinality(selectedEles)) {
                var cardinality = getCommonSBGNCardinality(selectedEles);
                commonSBGNCardinality = cardinality;

                if (cardinality <= 0) {
                    cardinality = undefined;
                }
                html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font size='2'>Cardinality</font>" + "</td><td style='padding-left: 5px;'>"
                    + "<input id='inspector-cardinality' class='inspector-input-box' type='number' min='0' step='1' style='width: " + buttonwidth + "px;' value='" + cardinality
                    + "'/>" + "</td></tr>";
            }

        }
        html += "</table>";

        if (selectedEles.length == 1) {
            html += "<div style='text-align: center; margin-top: 5px;'><button style='align: center;' id='inspector-set-as-default-button'"
                + ">Set as Default</button></div>";
        }


        //FUNDA: for debugging
        html += "<p><hr><div style='text-align: left; margin-top: 5px; margin-left:10px;'> Id: "+ selectedEles[0].id() +"</p>";

        html += "<hr style='padding: 0px; margin-top: 5px; margin-bottom: 5px;' width='" + $("#sbgn-inspector").width() + "'>";


        $("#sbgn-inspector").html(html);

        if (type == "node") {

            if (fillStateAndInfos) {
                module.exports.fillInspectorStateAndInfos(selectedEles, width, commonStateAndInfos, editorActions);
                //module.exports.fillInspectorStateAndInfos(selectedEles, commonStateAndInfos, width);
            }

            if (multimerCheck && commonIsMultimer) {
                $('#inspector-is-multimer').attr('checked', true);
            }

            if (clonedCheck && commonIsCloned) {
                $('#inspector-is-clone-marker').attr('checked', true);
            }
            // if (canHaveCloneMarker(selected.data('sbgnclass')) || canHaveStateVariable(selected.data('sbgnclass'))) {
            //     module.exports.fillInspectorStateAndInfos(selected, width, editorActions);
            // }
            //
            // if (canBeMultimer(selected.data('sbgnclass'))) {
            //     if (selected.data('sbgnclass').endsWith(' multimer')) {
            //         $('#inspector-is-multimer').attr('checked', true);
            //     }
            // }
            //
            // if (canBeCloned(selected.data('sbgnclass'))) {
            //     if (selected.data('sbgnclonemarker')) {
            //         $('#inspector-is-clone-marker').attr('checked', true);
            //     }
            // }

            $('#inspector-set-as-default-button').on('click', function () {
                var multimer;
                var selected = selectedEles[0];
                var sbgnclass = selected.data('sbgnclass');
                if (sbgnclass.endsWith(' multimer')) {
                    sbgnclass = sbgnclass.replace(' multimer', '');
                    multimer = true;
                }
                if (addRemoveUtilities.defaultsMap[sbgnclass] == null) {
                    addRemoveUtilities.defaultsMap[sbgnclass] = {};
                }
                var defaults = addRemoveUtilities.defaultsMap[sbgnclass];
                defaults.width = selected.width();
                defaults.height = selected.height();
                defaults.sbgnclonemarker = selected._private.data.sbgnclonemarker;
                defaults.multimer = multimer;
                defaults['border-width'] = selected.css('border-width');
                defaults['border-color'] = selected.data('borderColor');
                defaults['background-color'] = selected.css('background-color');
                defaults['font-size'] = selected.css('font-size');
                defaults['background-opacity'] = selected.css('background-opacity');
            });

            $('#inspector-is-multimer').on('click', function () {

             //   selectedEles.forEach(function(selected){

                    var param = {
                        data: $('#inspector-is-multimer').attr('checked') == 'checked',
                        ele: selectedEles,
                        sync: true
                    };

                    editorActions.changeIsMultimerStatus(param);

              //  });
            });

            $('#inspector-is-clone-marker').on('click', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        data: $('#inspector-is-clone-marker').attr('checked') == 'checked',
                        ele: selectedEles,
                        sync: true
                    };
                    editorActions.changeIsCloneMarkerStatus(param);
               // });

            });

            $("#inspector-border-color").on('change', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-border-color").attr("value"),
                        dataType: "borderColor",
                        modelDataName: 'borderColor',
                        sync: true
                    };
                    editorActions.changeStyleData(param);
              //  });


            });

            $("#inspector-label").on('change', function () {

                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-label").attr('value'),
                        dataType: 'sbgnlabel',
                        modelDataName: 'sbgnlabel',
                        sync: true
                    };
                    editorActions.changeStyleData(param);
               // });

            });

            $("#inspector-background-opacity").on('change', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-background-opacity").attr("value"),
                        dataType: "backgroundOpacity",
                        modelDataName: 'backgroundOpacity',
                        sync: true
                    };
                    editorActions.changeStyleData(param);
                //});

            });

            $("#inspector-fill-color").on('change', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-fill-color").attr("value"),
                        dataType: "background-color",
                        modelDataName: 'backgroundColor',
                        sync: true
                    };

                    editorActions.changeStyleCss(param);
//                });

            });

            $("#inspector-border-width").bind('change').on('change', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-border-width").attr("value"),
                        dataType: "border-width",
                        modelDataName: 'borderWidth',
                        sync: true
                    };
                    editorActions.changeStyleCss(param);
               // });
            });
        }
        else {
            $('#inspector-set-as-default-button').on('click', function () {
                var selected = selectedEles[0];
                if (addRemoveUtilities.defaultsMap[selected.data('sbgnclass')] == null) {
                    addRemoveUtilities.defaultsMap[selected.data('sbgnclass')] = {};
                }
                var defaults = addRemoveUtilities.defaultsMap[selected.data('sbgnclass')];
                defaults['line-color'] = selected.data('lineColor');
                defaults['width'] = selected.css('width');
            });

            $("#inspector-line-color").on('change', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-line-color").attr("value"),
                        dataType: "lineColor",
                        modelDataName: 'lineColor',
                        sync: true
                    };
                    editorActions.changeStyleData(param);
               // });


            });
            $("#inspector-cardinality").bind('change').on('change', function () {

              //  selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-cardinality").attr("value"),
                        dataType: "sbgncardinality",
                        modelDataName: 'sbgncardinality',
                        sync: true
                    };
                    editorActions.changeStyleData(param);
               // });

            });


            $("#inspector-width").bind('change').on('change', function () {
                //selectedEles.forEach(function(selected) {
                    var param = {
                        ele: selectedEles,
                        data: $("#inspector-width").attr("value"),
                        dataType: "width",
                        modelDataName: 'width',
                        sync: true
                    };
                    editorActions.changeStyleCss(param);

                });
            //});
        }
    }

};
module.exports.fillInspectorStateAndInfos = function (ele, width, stateAndInfos, editorActions) {
    //first empty the state variables and infos data in inspector
    $("#inspector-state-variables").html("");
    $("#inspector-unit-of-informations").html("");
    //var stateAndInfos = ele._private.data.sbgnstatesandinfos;
    for (var i = 0; i < stateAndInfos.length; i++) {
        var state = stateAndInfos[i];
        if (state.clazz == "state variable") {

            $("#inspector-state-variables").append("<div><input type='text' class='just-added-inspector-input inspector-state-variable-value' style='width: "
                + width / 5 + "px' value='" + stringAfterValueCheck(state.state.value) + "'/>"
                + "<span width='" + width / 5 + "'px>@</span>"
                + "<input type='text' class='just-added-inspector-input inspector-state-variable-variable' style='width: "
                + width / 2.5 + "px' value='" + stringAfterValueCheck(state.state.variable)
                + "'/><img width='12px' height='12px' class='just-added-inspector-input inspector-delete-state-and-info' src='sample-app/sampleapp-images/delete.png'/></div>");

            //Change variable
            $(".inspector-state-variable-variable").unbind('change').on('change', function () {
                var param = {
                    state: $(this).data("state"),
                    valueOrVariable: $(this).attr('value'),
                    type: 'variable',
                    ele: ele,
                    width: width,
                    sync: true
                };

                editorActions.changeStateVariable(param);
                  
            });


            //Change value
            $(".inspector-state-variable-value").unbind('change').on('change', function () {
                var param = {
                    state: $(this).data("state"),
                    valueOrVariable: $(this).attr('value'),
                    type: 'value',
                    ele: ele,
                    width: width,
                    sync: true
                };

                editorActions.changeStateVariable(param);
                  
            });


        }
        else if (state.clazz == "unit of information") {

            var total = width / 5 + width / 5 + width / 2.5;
            $("#inspector-unit-of-informations").append("<div><input type='text' class='just-added-inspector-input inspector-unit-of-information-label' style='width: "
                + total + "px' value='" + stringAfterValueCheck(state.label.text)
                + "'/><img width='12px' height='12px' class='just-added-inspector-input inspector-delete-state-and-info' src='sample-app/sampleapp-images/delete.png'/></div>");

            $(".inspector-unit-of-information-label").unbind('change').on('change', function () {
                var param = {
                    state: $(this).data("state"),
                    text: $(this).attr('value'),
                    ele: ele,
                    width: width,
                    sync: true
                };
                editorActions.changeUnitOfInformation(param);
                  
            });
        }

        $(".inspector-delete-state-and-info").unbind('click').click(function (event) {
            var param = {
                obj: $(this).data("state"),
                ele: ele,
                width: width,
                sync: true
            };
            editorActions.removeStateAndInfo(param);
        });

        $(".just-added-inspector-input").data("state", state);
        $(".just-added-inspector-input").removeClass("just-added-inspector-input");
    }
    $("#inspector-state-variables").append("<img id='inspector-add-state-variable' src='sample-app/sampleapp-images/add.png'/>");
    $("#inspector-unit-of-informations").append("<img id='inspector-add-unit-of-information' src='sample-app/sampleapp-images/add.png'/>");

    $("#inspector-add-state-variable").click(function () {
        var obj = {};
        obj.clazz = "state variable";

        obj.state = {
            value: "",
            variable: ""
        };
        obj.bbox = {
            w: 69,
            h: 28
        };
        var param = {
            obj: obj,
            ele: ele,
            width: width,
            sync: true
        };
        editorActions.addStateAndInfo(param);
    });

    $("#inspector-add-unit-of-information").click(function () {
        var obj = {};
        obj.clazz = "unit of information";
        obj.label = {
            text: ""
        };
        obj.bbox = {
            w: 53,
            h: 18
        };
        var param = {
            obj: obj,
            ele: ele,
            width: width,
            sync: true
        };
        editorActions.addStateAndInfo(param);


    });
};
