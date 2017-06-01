QUnit = require('qunitjs');


module.exports = function(serverIp, modelManager){


    QUnit.module( "Agent API Tests" );

    var agent;
    var agentId = '103abc';
    var agentName = "testAgent";



    function testNewAgent() {
        QUnit.test('new Agent', function (assert) {
            var Agent = require("../../agent-interaction/agentAPI");
            agent = new Agent(agentName, agentId);
            assert.ok(agent, "Agent created.");
        });
    }

    function testAgentProperties(){
        QUnit.test('Agent properties', function(assert) {
            assert.equal(agent.agentId, '103abc', "agentId is correct.");
            assert.equal(agent.agentName, "testAgent", "agentName is correct");
            assert.equal(agent.colorCode, "#00bfff", "colorCode is correct");
        });
    }



    function testLoadModel() {
        QUnit.test('Connect to server and load model', function (assert) {
            assert.expect(3);

            var done1 = assert.async();
            var done2 = assert.async();
            var done3 = assert.async();

            agent.connectToServer("http://localhost:3000/", function (socket) {

                assert.ok(socket, "Socket connection achieved");
                done1();



                agent.loadModel(function () {
                    assert.ok(agent.pageDoc, "Agent acquired pageDoc");
                    done2();

                    agent.loadOperationHistory(function () {

                        assert.ok(agent.opHistory, "Agent acquired opHistory");
                        done3();
                    });
                });

            });
        });
    }

    function testChangeName(){
        QUnit.test('Change name', function (assert) {

            assert.expect(1);
            var done1 = assert.async();

            agent.changeName("HAL", function () {
                setTimeout(function () { //should wait here as well
                    assert.equal(agent.agentName, "HAL", "Agent name changed.");
                    done1();
                }, 100);

            });
        });

    }

    function testMessages() {
        QUnit.test('Message send/receive', function (assert) {
            assert.expect(3);
            var done1 = assert.async();
            var done2 = assert.async();
            var done3 = assert.async();

            //
            // agent.sendRequest("agentMessage", {comment:[{text:"hello", style:"color:blue;"},{text:"bob", style:"font-weight:bold;"}], targets:"*"}, function(data) {
            //
            //     setTimeout(function () { //should wait here as well
            //
            //
            //         assert.equal(data, "success", "Agent message sent.");
            //         done1();
            //     }, 100);
            // });
            agent.sendRequest("agentMessage", {comment:"hello my name is <b> Bob </b>", targets:"*"}, function(data){

                setTimeout(function () { //should wait here as well
                    assert.equal(data, "success", "Agent message sent.");
                        done1();
                    }, 100);
                });




            // agent.sendRequest("agentMessage", {comment:{text:"hello 2"}, targets:"*"}, function(data){
            //
            //     setTimeout(function () { //should wait here as well
            //
            //
            //         assert.equal(data, "success", "Agent message sent.");
            //         done2();
            //     }, 100);
            // });
            //
            // agent.sendRequest("agentMessage", {comment:{text:"hello 3", link:"http://google.com"}, targets:"*"}, function(data){
            //
            //     setTimeout(function () { //should wait here as well
            //
            //
            //         assert.equal(data, "success", "Agent message sent.");
            //         done3();
            //     }, 100);
            // });

        });
    }






    function testGetRequests(){


        QUnit.test('Agent getNode and getEdge', function(assert) {
            assert.expect(2);
            var done1 = assert.async();
            var done2 = assert.async();

            agent.getNodeRequest("glyph0", function(){
                assert.equal(agent.selectedNode.id, "glyph0", "Node get operation is correct.");
                done1();
            });


            agent.getEdgeRequest("glyph15-glyph12", function(){
                assert.equal(agent.selectedEdge.id, "glyph15-glyph12", "Edge get operation is correct.");
                done2();
            });
        });

    }

    function testAddDeleteRequests(){


        QUnit.test('Agent addNode addEdge deleteNode deleteEdge clone', function(assert) {
            assert.expect(5);
            var done1 = assert.async();
            var done2 = assert.async();
           var done3 = assert.async();
            var done4 = assert.async();
            var done5 = assert.async();


            agent.sendRequest("agentAddNodeRequest", {x:30, y:40, class:"macromolecule"}, function(nodeId){
                setTimeout(function () { //should wait here as well
                    var val = modelManager.getModelNode(nodeId);
                    assert.ok(val, "Node added.");
                    done1();
                },100);

            });


            var param = {source:"glyph9", target:"glyph15", class:"consumption"};
            var edgeId = (param.source+ "-" + param.target + "-" + param.class);
            agent.sendRequest("agentAddEdgeRequest", {id: edgeId, source:param.source, target:param.target, class:param.class}, function(){
                setTimeout(function () { //should wait here as well
                    var val = modelManager.getModelEdge(edgeId);
                    assert.ok(val, "Edge added.");
                    done2();
                },100);

            });
            var elesToDelete = ["glyph4", "glyph7-glyph24"];
            agent.sendRequest("agentDeleteElesRequest", {elementIds: elesToDelete, type:"simple"}, function(nodeId){

                setTimeout(function () { //should wait here as well
                    var val = modelManager.getModelEdge("glyph4-glyph18");
                    assert.notOk(val, "Elements deleted simply.");
                    done3();
                },100);

            });

            var elesToDelete = ["glyph28"];
            agent.sendRequest("agentDeleteElesRequest", {elementIds: elesToDelete, type:"smart"}, function(nodeId){
                setTimeout(function () { //should wait here as well
                    var val = modelManager.getModelNode("glyph42");
                    assert.notOk(val, "Elements deleted smartly.");
                    done4();
                },100);

            });

            agent.sendRequest("agentCloneRequest", {elementIds:["glyph0", "glyph1"]}, function(val){

                setTimeout(function () { //should wait here as well

                    assert.equal(val, "success", "Elements cloned");
                    done5();
                },100);

            });

        });

    }

    function testUndoRedoRequest(){


        QUnit.test('Agent undo redo', function(assert) {
            //Test on delete
            var nodeToDelete = "glyph32";

            assert.expect(3);
            var done1 = assert.async();
           var done2 = assert.async();
           var done3 = assert.async();

            var elesToDelete = [nodeToDelete];
            agent.sendRequest("agentDeleteElesRequest", {elementIds: elesToDelete, type:"simple"}, function(result){
                console.log(result);
                var val = modelManager.getModelNode(nodeToDelete);
                assert.notOk(val,"Deletion for undo/redo is performed.");
                done1();

            });

            setTimeout(function(){

                agent.sendRequest("agentUndoRequest",null, function(undoActionStr){
                    setTimeout(function () { //should wait here as well
                        var val = modelManager.getModelNode(nodeToDelete);
                        assert.ok(val, "Undo performed");
                        done2();
                    },100);

            });
            }, 500);

            setTimeout(function() {

                agent.sendRequest("agentRedoRequest", null, function () {
                    setTimeout(function () { //should wait here as well
                        var val = modelManager.getModelNode(nodeToDelete);
                        assert.notOk(val, "Redo performed");
                        done3();
                    }, 100);
                });
            }, 800);




        });

    }


    function testMoveNodeRequest(){

        QUnit.test('Agent moveNode', function(assert) {
            var nodeId = "glyph8";
            var pos = {x: 30, y:50};
            assert.expect(1);
            var done1 = assert.async();


            agent.sendRequest("agentMoveNodeRequest", {id: nodeId,  pos:pos}, function(){
                setTimeout(function () { //should wait here as well
                    var val = modelManager.getModelNodeAttribute("position", nodeId);
                    assert.propEqual(val, pos, "Node move operation is correct.");
                    done1();
                },100);
            });



        });

    }



    function testAlignRequest(){

        QUnit.test('Agent align', function(assert) {
            var nodeId = "glyph8";

            assert.expect(2);
            var done1 = assert.async();
            var done2 = assert.async();

            agent.sendRequest("agentAlignRequest", {nodeIds: '*', alignTo:nodeId, horizontal:"none", vertical:"center"}, function(res){
                setTimeout(function () { //should wait here as well
                    assert.equal(res, "success", "Align successful.");
                    done1();
                },100);
            });

            //UNDO
            setTimeout(function(){
                agent.sendRequest("agentUndoRequest",null, function(res){
                    setTimeout(function () { //should wait here as well
                        assert.equal(res, "success", "Undo performed");
                        done2();
                    },100);

                });
            }, 500);


        });
    }


    function testNodeSetAttributeRequests() {

        QUnit.test('agentChangeNodeAttributeRequest', function (assert) {
            var id = "glyph8";

            var done = [];

            var attr = [
                {str: "highlightColor", val: "red"},
                {str: "data.label", val: "abc"},
                // {str: "data.class", val: "Phenotype"}, //changing this causes problems after reloading
                {str: "data.bbox.w", val: 40},
                {str: "data.bbox.h", val: 20},
                {str: "data.border-color", val: "green"},
                {str: "data.font-family", val: "Times"},
                {str: "data.font-weight", val: "bold"},
                {str: "data.font-size", val: 10},
                {str: "data.font-style", val: "normal"},
                {str: "data.border-width", val: 5},
                {str: "data.background-color", val: "blue"},
                {str: "data.background-opacity", val: 0.2},
                {str: "data.clonemarker", val: true},
                {str: "data.parent", val: "glyph1"},
                {
                    str: "data.statesandinfos",
                    val: [{
                        bbox: {x: 5, y: 5, w: 10, h: 10},
                        clazz: "state variable",
                        state: {value: "a", variable: "b"}
                    }, {bbox: {x: 7, y: 7, w: 15, h: 20}, clazz: "unit of information", label: {text: "abc"}}]
                },
            ];


            var expectCnt = attr.length;

            assert.expect(expectCnt);

            for (var i = 0; i < expectCnt; i++)
                done.push(assert.async());


            for (var i = 0; i < expectCnt; i++) {

                //Call like this because of asynchronicity
                var sendRequests = function (id, attStr, attVal, currDone) {
                    agent.sendRequest("agentChangeNodeAttributeRequest", {
                        id: id,
                        attStr: attStr,
                        attVal: attVal
                    }, function () {

                        setTimeout(function () { //should wait here as well

                            var val = modelManager.getModelNodeAttribute(attStr, id);
                            assert.propEqual(val, attVal, (attStr + " is correct"));
                            currDone();
                        }, 100);
                    });
                }(id, attr[i].str, attr[i].val, done[i]);

            }
        });
    }

    function testEdgeSetAttributeRequests() {

        QUnit.test('agentChangeEdgeAttributeRequest', function(assert) {
            var id = "glyph8-glyph15";

            var done = [];

            var attr = [
                {str: "highlightColor", val: "red"},
                {str: "data.cardinality", val: 5},
                {str: "data.line-color", val: "blue"},
                {str: "data.width", val: 20},
                {str: "data.class", val: "necessary stimulation"}
                //{str: "bendPoints", val:{distances:[2,2], weights:[0.5,0.4]}}

            ];


            var expectCnt = attr.length;

            assert.expect(expectCnt);

            for (var i = 0; i < expectCnt; i++)
                done.push(assert.async());



            for (var i = 0; i < expectCnt; i++) {

                //Call like this because of asynchronicity
                var sendRequests = function (id, attStr, attVal, currDone) {
                    agent.sendRequest("agentChangeEdgeAttributeRequest", {
                        id: id,
                        attStr: attStr,
                        attVal: attVal
                    }, function () {

                        setTimeout(function () { //should wait here as well

                            var val = modelManager.getModelEdgeAttribute(attStr, id);
                            assert.propEqual(val, attVal, (attStr + " is correct"));
                            currDone();
                        }, 100);
                    });
                }(id, attr[i].str, attr[i].val, done[i]);

            }
        });
    }


    function testLayout(){

        QUnit.test('Agent layout', function(assert) {

            assert.expect(1);
            var done1 = assert.async();
            agent.sendRequest("agentRunLayoutRequest", null, function(val){
                setTimeout(function () { //should wait here as well
                    assert.equal(val, "success", "Layout run.") ;
                    done1();
                },100);
            });
        });

    }


    function testHideShow(){

        QUnit.test('Agent hide show', function(assert) {

            assert.expect(3);

            var done1 = assert.async();
            var done2 = assert.async();
            var done3 = assert.async();

            agent.sendRequest("agentUpdateVisibilityStatusRequest", {val:"hide", elementIds:["glyph8"]}, function(out){
                setTimeout(function () { //should wait here as well
                    var vStatus = modelManager.getModelNodeAttribute("visibilityStatus", "glyph8");
                    assert.equal(vStatus, "hide", "Nodes hidden.") ;
                    done1();
                },100);
            });

            agent.sendRequest("agentUpdateVisibilityStatusRequest", {val:"show", elementIds:["glyph10"]}, function(out){
                setTimeout(function () { //should wait here as well
                    var vStatus = modelManager.getModelNodeAttribute("visibilityStatus", "glyph10");
                    assert.notEqual(vStatus, "hide", "Nodes shown.") ;
                    done2();
                },100);
            });


            setTimeout(function () { //wait here not to affect initial hide
                agent.sendRequest("agentUpdateVisibilityStatusRequest", {val: "showAll"}, function (out) {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("visibilityStatus", "glyph8");
                        assert.equal(vStatus, "show", "All nodes shown.");
                        done3();
                    }, 100);
                });

            }, 500);

        });
    }

    function testHighlight(){

        QUnit.test('Agent highlight', function(assert) {

            assert.expect(4);

            var done1 = assert.async();
            var done2 = assert.async();
            var done3 = assert.async();
            var done4 = assert.async();

            agent.sendRequest("agentUpdateHighlightStatusRequest", {val:"neighbors", elementIds:["glyph20"]}, function(out){
                setTimeout(function () { //should wait here as well
                    var vStatus = modelManager.getModelNodeAttribute("highlightStatus", "glyph24");
                    assert.equal(vStatus, "highlighted", "Neighbors highlighted.") ;
                    done1();
                },100);
            });

            agent.sendRequest("agentUpdateHighlightStatusRequest", {val:"processes", elementIds:["glyph20"]}, function(out){
                setTimeout(function () { //should wait here as well
                    var vStatus = modelManager.getModelNodeAttribute("highlightStatus", "glyph21");
                    assert.equal(vStatus, "highlighted", "Processes highlighted.") ;
                    done2();
                },100);
            });

            setTimeout(function () { //wait here not to affect initial hide
                agent.sendRequest("agentUpdateHighlightStatusRequest", {val: "remove"}, function (out) {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("highlightStatus", "glyph20");
                        assert.notEqual(vStatus, "highlighted", "Highlights removed.");
                        done3();
                    }, 500);
                });

            }, 500);

            agent.sendRequest("agentSearchByLabelRequest", {label:"myosin"}, function(out){
                setTimeout(function () { //should wait here as well
                    var vStatus = modelManager.getModelNodeAttribute("highlightStatus", "glyph39");
                    assert.equal(vStatus, "highlighted", "Label search successful.") ;
                    done4();
                },100);
            });

        });
    }

    function testExpandCollapse(){

        QUnit.test('Agent expand collapse', function(assert) {

            assert.expect(2);

            var done1 = assert.async();
            var done2 = assert.async();

            agent.sendRequest("agentUpdateExpandCollapseStatusRequest", {val:"collapse", elementIds:["glyph0"]}, function(out){
                setTimeout(function () { //should wait here as well
                    var vStatus = modelManager.getModelNodeAttribute("expandCollapseStatus", "glyph0");
                    assert.equal(vStatus, "collapse", "Nodes collapsed.") ;
                    done1();
                },100);
            });

            setTimeout(function () { //wait here not to affect initial collapse
                agent.sendRequest("agentUpdateExpandCollapseStatusRequest", {
                    val: "expand",
                    elementIds: ["glyph0"]
                }, function (out) {
                    setTimeout(function () { //should wait here as well
                        var vStatus = modelManager.getModelNodeAttribute("expandCollapseStatus", "glyph0");
                        assert.notEqual(vStatus, "collapse", "Nodes expanded.");
                        done2();
                    }, 100);
                });
            },500);

        });
    }

    function testAddCompound(){

        QUnit.test('Agent add compound', function(assert) {
            assert.expect(2);
            var done1 = assert.async();
            var done2 = assert.async();

            agent.sendRequest("agentAddCompoundRequest", {val:"complex", elementIds:["glyph8", "glyph9"]}, function(val){
                setTimeout(function () { //should wait here as well
                    var node = modelManager.getModelNode("glyph8");
                    var parent = modelManager.getModelNode(node.data.parent);

                    assert.equal(parent.data.class,"complex", "Complex added.");
                    done1();
                },100);

            });

            agent.sendRequest("agentAddCompoundRequest", {val:"compartment", elementIds:["glyph26", "glyph27"]}, function(val){
                setTimeout(function () { //should wait here as well
                    var node = modelManager.getModelNode("glyph26");
                    var parent = modelManager.getModelNode(node.data.parent);
                    assert.equal(parent.data.class,"compartment", "Compartment added.");
                    done2();
                },100);

            });

        });
    }

    function testNewFile(){

        QUnit.test('Agent new file', function(assert) {

            assert.expect(1);
            var done1 = assert.async();
            agent.sendRequest("agentNewFileRequest", null, function(){
                setTimeout(function () { //should wait here as well
                    var cy = modelManager.getModelCy();
                    assert.ok((jQuery.isEmptyObject(cy.nodes) && jQuery.isEmptyObject(cy.edges)),"New file loaded") ;
                    done1();
                },100);
            });
        });

    }

    function testMerge(){
        QUnit.test('Agent new file', function(assert) {

            var sbgn = '<sbgn xmlns="http://sbgn.org/libsbgn/pd/0.1"> <map> <glyph id="id_0" class="macromolecule"> <label text="MAP2K1"/> <bbox y="0" h="60" w="140" x="0"/> <glyph id="id_3" class="unit of information"> <label text="mt:prot"/> <bbox y="0" h="18" w="53" x="0"/> </glyph> </glyph> <glyph id="id_1" class="macromolecule">    <label text="MAPK1"/> <bbox y="0" h="60" w="140" x="0"/> <glyph id="id_4" class="unit of information"> <label text="mt:prot"/> <bbox y="0" h="18" w="53" x="0"/> </glyph> <glyph id="id_5" class="state variable"> <state variable="T185" value="P"/> <bbox y="1" h="30" w="70" x="1"/> </glyph> </glyph> <glyph id="id_2" class="macromolecule"> <label text="MAPK1"/> <bbox y="0" h="60" w="140" x="0"/> <glyph id="id_6" class="unit of information"> <label text="mt:prot"/> <bbox y="0" h="18" w="53" x="0"/> </glyph> </glyph> <glyph id="id_7" class="process"> <bbox y="0" h="20" w="20" x="0"/> </glyph> <arc source="id_2" id="id_8" target="id_7" class="consumption"/> <arc source="id_7" id="id_9" target="id_1" class="production"/> <arc source="id_0" id="id_10" target="id_7" class="catalysis"/> </map> </sbgn>'
            assert.expect(1);
            var done1 = assert.async();
            agent.sendRequest('agentMergeGraphRequest', {type: 'sbgn', graph: sbgn}, function (data) {
                console.log(data);
                assert.ok(data,"Sbgn graph merged") ;
                done1();
            });
        });
    }

    function testPropertyRequests(){

        QUnit.test('Property updates', function(assert) {

            assert.expect(1);
            var done1 = assert.async();
            var props = {
                name: 'cose-bilkent',
                nodeRepulsion: 4500,
                idealEdgeLength: 50,
                edgeElasticity: 0.45,
                nestingFactor: 0.1,
                gravity: 5,
                numIter: 1000,
                tile: true,
                animationEasing: 'cubic-bezier(0.19, 1, 0.22, 1)',
                animate: 'end',
                animationDuration: 1000,
                randomize: false,
                tilingPaddingVertical: 20,
                tilingPaddingHorizontal: 20,
                gravityRangeCompound: 1.5,
                gravityCompound: 1.0,
                gravityRange: 3.8,
            };
            agent.sendRequest("agentSetLayoutPropertiesRequest", props, function(val){
                setTimeout(function () { //should wait here as well
                    var layoutProps = modelManager.getLayoutProperties();
                    assert.equal(layoutProps.numIter, 1000, "Layout run.") ;
                    done1();
                },100);
            });
        });

    }




    function testDisconnect(){

        QUnit.test('Agent disconnect', function(assert) {

            assert.expect(1);
            var done1 = assert.async();
            console.log(agent.socket);
            agent.disconnect(function(){

                assert.notOk(agent.socket.connected,"Agent disconnected." ) ;
                done1();
            });


        });

    }


    setTimeout(function() {
        testNewAgent();
    }, 100);



    setTimeout(function() {
        testAgentProperties();
    }, 100);


    setTimeout(function() {
        testLoadModel();
    }, 100);


    // //Make sure the model is loaded first
    // setTimeout(function() {
    //     testChangeName();
    // }, 100);
    //
    //
    // setTimeout(function() {
    //     testMessages();
    // }, 100);

    // setTimeout(function() {
    //     testMerge();
    // }, 100);

    // setTimeout(function() {
    //     testGetRequests();
    // },100);
    //
    //
    // setTimeout(function() {
    //     testMoveNodeRequest();
    // },100);
    //
    // setTimeout(function() {
    //     testNodeSetAttributeRequests();
    // },100);
    //
    //
    //
    // setTimeout(function() {
    //     testEdgeSetAttributeRequests();
    // },100);
    //
    // setTimeout(function() {
    //     testPropertyRequests();
    // },100);
    //
    //
    // setTimeout(function() {
    //     testAlignRequest();
    // }, 1000);
    //
    // setTimeout(function() {
    //     testUndoRedoRequest();
    // }, 1000);
    //
    //
    // setTimeout(function() {
    //     testHighlight();
    // }, 100);
    //
    // setTimeout(function() {
    //     testAddCompound();
    // }, 100);
    //
    // setTimeout(function() {
    //     testAddDeleteRequests();
    // },100);
    //
    // setTimeout(function() {
    //     testHideShow();
    // }, 100);
    //
    //
    //
    //
    // //Do this after others
    // setTimeout(function() {
    //     testExpandCollapse();
    // }, 500);
    //
    //
    //
    // //do this at the end
    // setTimeout(function() {
    //     testLayout();
    // }, 1000);
    //
    // //do this at the end
    // setTimeout(function() {
    //     testNewFile();
    // }, 2000);

    //
    // //do this at the end
    // setTimeout(function() {
    //     testDisconnect();
    // }, 3000);
};