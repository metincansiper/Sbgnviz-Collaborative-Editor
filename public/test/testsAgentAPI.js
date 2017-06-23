QUnit = require('qunitjs');
var jsonToSbgnml = require('../node_modules/sbgnviz/src/utilities/json-to-sbgnml-converter.js');


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


            agent.sendRequest("agentMessage", {comment:{text:"hello", style:"color:blue;"}, targets:"*"}, function(data){

                setTimeout(function () { //should wait here as well


                    assert.equal(data, "success", "Agent message sent.");
                    done1();
                }, 100);
            });


            agent.sendRequest("agentMessage", {comment:{text:"hello 2"}, targets:"*"}, function(data){

                setTimeout(function () { //should wait here as well


                    assert.equal(data, "success", "Agent message sent.");
                    done2();
                }, 100);
            });

            agent.sendRequest("agentMessage", {comment:{text:"hello 3", link:"http://google.com"}, targets:"*"}, function(data){

                setTimeout(function () { //should wait here as well


                    assert.equal(data, "success", "Agent message sent.");
                    done3();
                }, 100);
            });

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

        QUnit.test('Agent merger', function(assert) {
            var sbgnBefore = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?> <sbgn xmlns='http://sbgn.org/libsbgn/0.3'> <map language='process description' id='example4_complex_in_compartment.sbgn'> <extension> <renderInformation id='renderInformation' programName='sbgnviz' programVersion='3.1.0' backgroundColor='#000000' xmlns='http://www.sbml.org/sbml/level3/version1/render/version1'> <listOfColorDefinitions> <colorDefinition id='color_1' value='#ffffff7f' /> <colorDefinition id='color_2' value='#555555' /> </listOfColorDefinitions> <listOfStyles> <style id='nodeffffff0.55555551.2511normalnormalHelvetica' idList='ele14 e6ced17d-22c5-c392-7f89-34b89f04c1ee nwtN_f7bc13e0-b410-4faf-8c0c-c2a21ecf97f2 ele16 ele15 nwtN_a73c2c40-26f6-4bfa-b4c2-7cfc1470cd5a b020de88-a16e-3b38-a153-34e95bcb8001 nwtN_9dee3edb-f9d5-4fd6-a2b8-f2238a52dae7 nwtN_c8f1f126-c0e1-4b7f-bdb8-0a2fa2394f34 nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6 99268d17-c5c7-5b0b-6e52-51328591f271 455e2515-6925-baeb-24ef-6413e738d57c 23f9e061-f869-c1f5-1eb2-483e3f5bfb6c 66c3a96d-4a0a-ac7f-9daf-22bd6368214c 1bfe0074-67e0-b0a8-d3ea-c526537f7aa5 ac3461b4-0756-e729-fe14-7be57933a0d3 bf58c40f-1d05-c0c9-eb14-69387ac4504d 35f76633-9fad-1f5e-5212-ce8d2d2e4e97 6361d068-6a5a-3e1f-3c03-a1ca28f38b96 cd0f0e73-94d5-c560-be3c-de7ab5d24fee fbec4d2a-cf84-4244-b90e-af6f9e96a1ec 72f1683a-4cb9-0e9b-89fc-571158252cce'> <g fontSize='11' fontFamily='Helvetica' fontWeight='normal' fontStyle='normal' stroke='color_2' strokeWidth='1.25' fill='color_1' /> </style> <style id='nodeffffff0.55555551.25' idList='ele18 ele22 nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2 5fef9520-15b8-bd61-3095-256b0aa3a670'> <g stroke='color_2' strokeWidth='1.25' fill='color_1' /> </style> <style id='nodeffffff0.55555553.2511normalnormalHelvetica' idList='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27 d9c78384-d022-dcb0-63e9-016c3f120d42 5748e703-9e61-9646-0efb-bbb176894e98 2f260f0c-6392-e375-61e5-c9a6d67e7fab'> <g fontSize='11' fontFamily='Helvetica' fontWeight='normal' fontStyle='normal' stroke='color_2' strokeWidth='3.25' fill='color_1' /> </style> <style id='edge5551.25' idList='nwtE_bcb50bc3-227a-414b-8914-4dea87a1d450 nwtE_da7e865f-869e-4498-accc-56e4ffcdffaf nwtE_be4d6cb9-01cf-4d2f-a6d6-47dabd70b26a nwtE_06c6bd7a-ace1-44c1-b82f-0c0e50d4b43a'> <g stroke='color_2' strokeWidth='1.25' /> </style> <style id='edge5555551.25' idList='nwtE_8c8626d3-e66f-459c-97ca-17d3752b9d53 ele29 nwtE_a6c787dd-eac8-4a36-951a-06c88c268027 nwtE_79fe607f-7f93-49a9-8bcc-cac2045b3585 nwtE_85f0f98b-c13d-46a0-8378-be7a710046e0 nwtE_a4bd776b-b326-437b-b8d8-8b7a755f5b97 nwtE_37051c26-f349-4a48-8c49-a63c812c557d 921ce5c5-2bf7-c591-3aae-4e4f527f77ef 63c4f9c6-3341-185d-3ff8-5f51cf3049bc 7be181a2-c4d0-d6a3-6606-3e1be769d7a1'> <g stroke='color_2' strokeWidth='1.25' /> </style> </listOfStyles> </renderInformation> </extension> <glyph id='ele14' class='macromolecule' > <label text='B' /> <bbox y='-145.3359717999329' x='-77.04709971349163' w='122.55181029538099' h='118.64517435639888' /> </glyph> <glyph id='e6ced17d-22c5-c392-7f89-34b89f04c1ee' class='macromolecule' > <label text='A' /> <bbox y='48.66402820006711' x='-78.04709971349163' w='122.55181029538099' h='118.64517435639888' /> <glyph id='e6ced17d-22c5-c392-7f89-34b89f04c1ee_0' class='unit of information'> <label text='mt:prot' /> <bbox y='42.66402820006711' x='-31.77119456580114' w='30' h='12' /> </glyph> </glyph> <glyph id='ele18' class='process' > <bbox y='-4.602907607500203' x='-127.1859328850573' w='30' h='30' /> </glyph> <glyph id='ele16' class='macromolecule' > <label text='A' /> <bbox y='49.546001174052925' x='239.12171882629696' w='122.55181029538099' h='118.64517435639884' /> <glyph id='ele16_0' class='state variable'> <state value='P' variable='168' /> <bbox y='43.54600117405292' x='285.39762397398744' w='30' h='12' /> </glyph> </glyph> <glyph id='ele15' class='macromolecule' > <label text='B' /> <bbox y='-144.86360147032838' x='238.4147131685666' w='123.10990114380695' h='118.08708350797286' /> </glyph> <glyph id='ele22' class='process' > <bbox y='-4.507122940411655' x='383.24431076485274' w='30' h='30' /> </glyph> <glyph id='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' class='compartment' > <bbox y='-494.7121128581422' x='-446.04137921192586' w='346.1698443674039' h='427.154752862602' /> </glyph> <glyph id='nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6' class='macromolecule' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <label text='C' /> <bbox y='-188.74504075898182' x='-224.4980180385839' w='123.00148319406196' h='118.75543023259169' /> </glyph> <glyph id='nwtN_c8f1f126-c0e1-4b7f-bdb8-0a2fa2394f34' class='macromolecule' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <label text='D' /> <bbox y='-189.34285924228683' x='-444.41637921192586' w='122.47263084900565' h='120.16049924674668' /> </glyph> <glyph id='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' class='association' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <bbox y='-137.1188436527023' x='-283.55974438245835' w='15' h='15' /> </glyph> <glyph id='nwtN_a73c2c40-26f6-4bfa-b4c2-7cfc1470cd5a' class='complex' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <bbox y='-340.08711285814223' x='-438.13864708994066' w='329.2315610829929' h='123.70625944671363' /> <glyph id='nwtN_f7bc13e0-b410-4faf-8c0c-c2a21ecf97f2' class='macromolecule' > <label text='C' /> <bbox y='-338.46211285814223' x='-232.89379412939482' w='122.36170812244704' h='119.94232650974747' /> </glyph> <glyph id='nwtN_9dee3edb-f9d5-4fd6-a2b8-f2238a52dae7' class='macromolecule' > <label text='D' /> <bbox y='-336.7845864073439' x='-436.51364708994066' w='121.19811460861493' h='118.77873299591529' /> </glyph> </glyph> <glyph id='cd0f0e73-94d5-c560-be3c-de7ab5d24fee' class='complex' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <bbox y='-488.0871128581422' x='-439.13864708994066' w='329.2315610829929' h='123.70625944671366' /> <glyph id='fbec4d2a-cf84-4244-b90e-af6f9e96a1ec' class='macromolecule' > <label text='E' /> <bbox y='-486.46211285814223' x='-233.89379412939482' w='122.36170812244704' h='119.94232650974747' /> </glyph> <glyph id='72f1683a-4cb9-0e9b-89fc-571158252cce' class='macromolecule' > <label text='D' /> <bbox y='-484.7845864073439' x='-437.51364708994066' w='121.19811460861493' h='118.77873299591529' /> </glyph> </glyph> <glyph id='d9c78384-d022-dcb0-63e9-016c3f120d42' class='compartment' > <bbox y='-495.7121128581422' x='380.9586207880741' w='346.169844367404' h='427.154752862602' /> </glyph> <glyph id='99268d17-c5c7-5b0b-6e52-51328591f271' class='macromolecule' compartmentRef='d9c78384-d022-dcb0-63e9-016c3f120d42' > <label text='C' /> <bbox y='-189.74504075898182' x='602.501981961416' w='123.00148319406196' h='118.75543023259169' /> </glyph> <glyph id='455e2515-6925-baeb-24ef-6413e738d57c' class='macromolecule' compartmentRef='d9c78384-d022-dcb0-63e9-016c3f120d42' > <label text='D' /> <bbox y='-190.34285924228683' x='382.58362078807414' w='122.47263084900565' h='120.16049924674668' /> </glyph> <glyph id='5fef9520-15b8-bd61-3095-256b0aa3a670' class='association' compartmentRef='d9c78384-d022-dcb0-63e9-016c3f120d42' > <bbox y='-138.1188436527023' x='543.4402556175417' w='15' h='15' /> </glyph> <glyph id='23f9e061-f869-c1f5-1eb2-483e3f5bfb6c' class='complex' compartmentRef='d9c78384-d022-dcb0-63e9-016c3f120d42' > <bbox y='-341.08711285814223' x='388.8613529100594' w='329.23156108299287' h='123.70625944671363' /> <glyph id='66c3a96d-4a0a-ac7f-9daf-22bd6368214c' class='macromolecule' > <label text='C' /> <bbox y='-339.46211285814223' x='594.1062058706052' w='122.36170812244704' h='119.94232650974747' /> </glyph> <glyph id='1bfe0074-67e0-b0a8-d3ea-c526537f7aa5' class='macromolecule' > <label text='D' /> <bbox y='-337.7845864073439' x='390.48635291005934' w='121.19811460861493' h='118.77873299591529' /> </glyph> </glyph> <glyph id='bf58c40f-1d05-c0c9-eb14-69387ac4504d' class='complex' compartmentRef='d9c78384-d022-dcb0-63e9-016c3f120d42' > <bbox y='-489.0871128581422' x='387.8613529100594' w='329.23156108299287' h='123.70625944671366' /> <glyph id='35f76633-9fad-1f5e-5212-ce8d2d2e4e97' class='macromolecule' > <label text='C' /> <bbox y='-487.46211285814223' x='593.1062058706052' w='122.36170812244704' h='119.94232650974747' /> </glyph> <glyph id='6361d068-6a5a-3e1f-3c03-a1ca28f38b96' class='macromolecule' > <label text='D' /> <bbox y='-485.7845864073439' x='389.48635291005934' w='121.19811460861493' h='118.77873299591529' /> </glyph> </glyph> <glyph id='5748e703-9e61-9646-0efb-bbb176894e98' class='compartment' > <label text='cytoplasm' /> <bbox y='45.62995924101819' x='-272.1230180385839' w='126.25148319406196' h='122.0054302325917' /> </glyph> <glyph id='ac3461b4-0756-e729-fe14-7be57933a0d3' class='macromolecule' compartmentRef='5748e703-9e61-9646-0efb-bbb176894e98' > <label text='C' /> <bbox y='47.2549592410182' x='-270.4980180385839' w='123.00148319406196' h='118.75543023259169' /> </glyph> <glyph id='2f260f0c-6392-e375-61e5-c9a6d67e7fab' class='compartment' > <label text='cytoplasm' /> <bbox y='47.62995924101819' x='431.87698196141605' w='126.25148319406202' h='122.0054302325917' /> </glyph> <glyph id='b020de88-a16e-3b38-a153-34e95bcb8001' class='macromolecule' compartmentRef='2f260f0c-6392-e375-61e5-c9a6d67e7fab' > <label text='C' /> <bbox y='49.2549592410182' x='433.5019819614161' w='123.00148319406196' h='118.75543023259169' /> </glyph> <arc id='nwtE_bcb50bc3-227a-414b-8914-4dea87a1d450' target='e6ced17d-22c5-c392-7f89-34b89f04c1ee' source='ele18' class='production'> <start y='25.8970923924998' x='-97.03135072602605'/> <end y='47.46046445745942' x='-75.94851888188477'/> </arc> <arc id='nwtE_8c8626d3-e66f-459c-97ca-17d3752b9d53' target='nwtN_a73c2c40-26f6-4bfa-b4c2-7cfc1470cd5a' source='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' class='production'> <start y='-137.6176783517715' x='-275.9232033374697'/> <end y='-208.3812175679695' x='-274.715261436533'/> </arc> <arc id='ele29' target='ele14' source='ele18' class='production'> <start y='-5.1022225438988755' x='-96.68593288505728'/> <end y='-26.01695975600776' x='-75.77027124982038'/> </arc> <arc id='nwtE_a6c787dd-eac8-4a36-951a-06c88c268027' target='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' source='nwtN_c8f1f126-c0e1-4b7f-bdb8-0a2fa2394f34' class='consumption'> <start y='-129.4679168547124' x='-321.4437483629202'/> <end y='-129.59223939566223' x='-284.05970014568027'/> </arc> <arc id='nwtE_79fe607f-7f93-49a9-8bcc-cac2045b3585' target='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' source='nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6' class='consumption'> <start y='-129.50525207778' x='-224.9980180385839'/> <end y='-129.6010469502428' x='-268.05976417764646'/> </arc> <arc id='nwtE_85f0f98b-c13d-46a0-8378-be7a710046e0' target='ele18' source='nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6' class='consumption'> <start y='-69.48961052639011' x='-141.22873766091607'/> <end y='-5.102907607500214' x='-117.82095670726797'/> </arc> <arc id='nwtE_a4bd776b-b326-437b-b8d8-8b7a755f5b97' target='ele15' source='ele22' class='production'> <start y='-4.697719551321185' x='382.74431076485274'/> <end y='-26.38527815852997' x='360.61501808320025'/> </arc> <arc id='nwtE_37051c26-f349-4a48-8c49-a63c812c557d' target='ele22' source='455e2515-6925-baeb-24ef-6413e738d57c' class='consumption'> <start y='-69.68235999554017' x='424.2044822681717'/> <end y='-5.007122940411634' x='403.2631005194096'/> </arc> <arc id='921ce5c5-2bf7-c591-3aae-4e4f527f77ef' target='5fef9520-15b8-bd61-3095-256b0aa3a670' source='99268d17-c5c7-5b0b-6e52-51328591f271' class='consumption'> <start y='-130.50525207778' x='602.001981961416'/> <end y='-130.6010469502428' x='558.9402358223535'/> </arc> <arc id='63c4f9c6-3341-185d-3ff8-5f51cf3049bc' target='5fef9520-15b8-bd61-3095-256b0aa3a670' source='455e2515-6925-baeb-24ef-6413e738d57c' class='consumption'> <start y='-130.4679168547124' x='505.5562516370798'/> <end y='-130.59223939566223' x='542.9402998543197'/> </arc> <arc id='7be181a2-c4d0-d6a3-6606-3e1be769d7a1' target='23f9e061-f869-c1f5-1eb2-483e3f5bfb6c' source='5fef9520-15b8-bd61-3095-256b0aa3a670' class='production'> <start y='-138.6176783517715' x='551.0767966625302'/> <end y='-209.3812175679695' x='552.284738563467'/> </arc> <arc id='nwtE_da7e865f-869e-4498-accc-56e4ffcdffaf' target='ele18' source='ac3461b4-0756-e729-fe14-7be57933a0d3' class='consumption'> <start y='48.423035833601816' x='-150.43937926502906'/> <end y='25.804909964870816' x='-127.6859328850573'/> </arc> <arc id='nwtE_be4d6cb9-01cf-4d2f-a6d6-47dabd70b26a' target='ele16' source='ele22' class='production'> <start y='25.992877059588338' x='382.8276634508983'/> <end y='48.737358292549395' x='360.20549277300034'/> </arc> <arc id='nwtE_06c6bd7a-ace1-44c1-b82f-0c0e50d4b43a' target='ele22' source='b020de88-a16e-3b38-a153-34e95bcb8001' class='consumption'> <start y='49.953733723319665' x='437.1497289885631'/> <end y='25.992877059588366' x='413.526137705568'/> </arc> </map> </sbgn>";
            var sbgnAfter = "<?xml version='1.0' encoding='UTF-8' standalone='yes'?> <sbgn xmlns='http://sbgn.org/libsbgn/0.3'> <map language='process description' id='undefined'> <glyph id='ele18' class='process' > <bbox y='902.582799851806' x='697.1467705380547' w='30' h='30' /> </glyph> <glyph id='ele14' class='macromolecule' > <label text='B' /> <bbox y='778.9120889143222' x='769.9083731502805' w='122.55181029538099' h='118.64517435639888' /> </glyph> <glyph id='e6ced17d-22c5-c392-7f89-34b89f04c1ee' class='macromolecule' > <label text='A' /> <bbox y='1001.345265311702' x='653.7454403598275' w='122.55181029538099' h='118.64517435639888' /> <glyph id='e6ced17d-22c5-c392-7f89-34b89f04c1ee_0' class='unit of information'> <label text='mt:prot' /> <bbox y='995.345265311702' x='700.021345507518' w='30' h='12' /> </glyph> </glyph> <glyph id='ele22' class='process' > <bbox y='948.4371385702112' x='749.2976640754481' w='30' h='30' /> </glyph> <glyph id='ele16' class='macromolecule' > <label text='A' /> <bbox y='958.8826971047021' x='832.8743443196532' w='122.55181029538099' h='118.64517435639884' /> <glyph id='ele16_0' class='state variable'> <state value='P' variable='168' /> <bbox y='952.8826971047021' x='879.1502494673438' w='30' h='12' /> </glyph> </glyph> <glyph id='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' class='compartment'  > <bbox y='27.656499143582778' x='26.882684485951472' w='589.8459283251394' h='715.28194486907' /> </glyph> <glyph id='nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6' class='macromolecule' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <label text='C' /> <bbox y='622.5580137800612' x='307.8971409459218' w='123.00148319406196' h='118.75543023259169' /> </glyph> <glyph id='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' class='association' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <bbox y='558.5062484935553' x='425.2916921317518' w='15' h='15' /> </glyph> <glyph id='nwtN_a73c2c40-26f6-4bfa-b4c2-7cfc1470cd5a' class='complex'  compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <bbox y='346.10473114540525' x='271.9812810001382' w='266.409822731062' h='123.19232650974743' /> <glyph id='nwtN_f7bc13e0-b410-4faf-8c0c-c2a21ecf97f2' class='macromolecule' > <label text='C' /> <bbox y='347.72973114540525' x='273.60628100013815' w='122.36170812244704' h='119.94232650974747' /> </glyph> <glyph id='nwtN_9dee3edb-f9d5-4fd6-a2b8-f2238a52dae7' class='macromolecule' > <label text='D' /> <bbox y='347.72973114540525' x='415.56798912258523' w='121.19811460861493' h='118.77873299591529' /> </glyph> </glyph> <glyph id='nwtN_c8f1f126-c0e1-4b7f-bdb8-0a2fa2394f34' class='macromolecule' compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <label text='D' /> <bbox y='552.811425721716' x='492.6309819620853' w='122.47263084900565' h='120.16049924674668' /> </glyph> <glyph id='cd0f0e73-94d5-c560-be3c-de7ab5d24fee' class='complex'  compartmentRef='nwtN_6b5f8b31-2bf6-45b8-bd22-89222d92ca27' > <bbox y='34.28149914358278' x='33.50768448595147' w='266.409822731062' h='123.19232650974749' /> <glyph id='fbec4d2a-cf84-4244-b90e-af6f9e96a1ec' class='macromolecule' > <label text='E' /> <bbox y='35.906499143582785' x='35.13268448595148' w='122.36170812244704' h='119.94232650974747' /> </glyph> <glyph id='72f1683a-4cb9-0e9b-89fc-571158252cce' class='macromolecule' > <label text='D' /> <bbox y='35.90649914358277' x='177.09439260839855' w='121.19811460861493' h='118.77873299591529' /> </glyph> </glyph> <glyph id='5748e703-9e61-9646-0efb-bbb176894e98' class='compartment'  > <label text='cytoplasm' /> <bbox y='979.7725677933288' x='483.6997133852251' w='126.2514831940619' h='122.0054302325916' /> </glyph> <glyph id='ac3461b4-0756-e729-fe14-7be57933a0d3' class='macromolecule' compartmentRef='5748e703-9e61-9646-0efb-bbb176894e98' > <label text='C' /> <bbox y='981.3975677933288' x='485.32471338522504' w='123.00148319406196' h='118.75543023259169' /> </glyph> <arc id='ele29' target='ele14' source='ele18' class='production'> <start y='907.2507965915441' x='727.6467705380547'/> <end y='880.7999387028765' x='767.328165031145'/> </arc> <arc id='nwtE_bcb50bc3-227a-414b-8914-4dea87a1d450' target='e6ced17d-22c5-c392-7f89-34b89f04c1ee' source='ele18' class='production'> <start y='933.082799851806' x='712.4581651331239'/> <end y='992.3457696678487' x='713.6487566485083'/> </arc> <arc id='nwtE_85f0f98b-c13d-46a0-8378-be7a710046e0' target='ele18' source='nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6' class='consumption'> <start y='724.5625430630446' x='431.3986241399838'/> <end y='906.9262237760241' x='696.6467705380547'/> </arc> <arc id='nwtE_da7e865f-869e-4498-accc-56e4ffcdffaf' target='ele18' source='ac3461b4-0756-e729-fe14-7be57933a0d3' class='consumption'> <start y='994.5741909144035' x='608.826196579287'/> <end y='929.1329346966482' x='696.6467705380547'/> </arc> <arc id='nwtE_79fe607f-7f93-49a9-8bcc-cac2045b3585' target='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' source='nwtN_f69eb2e6-3f73-4ba5-be4a-41c71464eda6' class='consumption'> <start y='622.0580137800612' x='402.14086092520625'/> <end y='573.0253482340379' x='428.95343226129535'/> </arc> <arc id='nwtE_8c8626d3-e66f-459c-97ca-17d3752b9d53' target='nwtN_a73c2c40-26f6-4bfa-b4c2-7cfc1470cd5a' source='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' class='production'> <start y='558.1251782825155' x='431.41738054820837'/> <end y='477.2598920961026' x='417.31598358858366'/> </arc> <arc id='nwtE_a6c787dd-eac8-4a36-951a-06c88c268027' target='nwtN_2adeeacf-7c4c-41ea-b8ba-af5268a677b2' source='nwtN_c8f1f126-c0e1-4b7f-bdb8-0a2fa2394f34' class='consumption'> <start y='588.9848487401226' x='492.1309819620853'/> <end y='568.8951364060325' x='440.25187487945595'/> </arc> <arc id='nwtE_be4d6cb9-01cf-4d2f-a6d6-47dabd70b26a' target='ele16' source='ele22' class='production'> <start y='969.9745999229035' x='779.7976640754481'/> <end y='991.1784064783989' x='830.0708487077097'/> </arc> <arc id='nwtE_a4bd776b-b326-437b-b8d8-8b7a755f5b97' target='ele14' source='ele22' class='production'> <start y='947.9371385702112' x='772.5781922690038'/> <end y='900.2623262781848' x='798.0473940307198'/> </arc> <arc id='nwtE_37051c26-f349-4a48-8c49-a63c812c557d' target='ele22' source='nwtN_c8f1f126-c0e1-4b7f-bdb8-0a2fa2394f34' class='consumption'> <start y='673.4719249684626' x='590.2332626598638'/> <end y='947.9371385702112' x='754.9931058202392'/> </arc> <arc id='nwtE_06c6bd7a-ace1-44c1-b82f-0c0e50d4b43a' target='ele22' source='ac3461b4-0756-e729-fe14-7be57933a0d3' class='consumption'> <start y='1018.7263860745946' x='608.826196579287'/> <end y='968.9492968467073' x='748.7976640754481'/> </arc> </map> </sbgn>";

            assert.expect(1);
            var done1 = assert.async();
            agent.sendRequest('agentMergeGraphRequest', {type: 'sbgn', graph: sbgnBefore}, function (data) {
                console.log(data);
                assert.equal(jsonToSbgnml.createSbgnml().replace(new RegExp('\n', "g"), " ").trim(), sbgnAfter, "Sbgn graph merged");
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


    //Make sure the model is loaded first
    setTimeout(function() {
        testChangeName();
    }, 100);

    setTimeout(function() {
        testMessages();
    }, 100);

    //do this at the end
    setTimeout(function() {
        testNewFile();
    }, 2000);

    setTimeout(function() {
         testMerge();
    }, 2000);

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
    //     testDisconnect();
    // }, 3000);
};
