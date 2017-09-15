QUnit = require('qunitjs');
module.exports = function(modelManager) {
    QUnit.module("User operations tests to see if model is updated correctly.");

    function addNodeTest(id, className, posX, posY) {
        QUnit.test('chise.addNode()', function (assert) {
            chise.addNode(posX, posY, className, id);
            var node = cy.getElementById(id);
            assert.ok(node, "A node with id: " + id + " is added.");
            assert.equal(node.position('x'), posX, 'x position of the node is as expected');
            assert.equal(node.position('y'), posY, 'y position of the node is as expected');
            assert.equal(node.data('class'), className, 'the node has the expected sbgn class');


            var nodeModel = modelManager.getModelNode(id);

            assert.ok(nodeModel, "Node is added to the model.");
            assert.equal(modelManager.getModelNodeAttribute("data.id", id), cy.getElementById(id).data("id") , "Node is equal in model and cytoscape");
            assert.equal(node.data("class"), modelManager.getModelNodeAttribute("data.class", id), "Node class is equal in model and cytoscape.");
            assert.equal(node.position('x'),modelManager.getModelNodeAttribute("position.x", id), "Node position x is equal in model and cytoscape.");
            assert.equal(node.position('y'),modelManager.getModelNodeAttribute("position.y", id), "Node position y is equal in model and cytoscape.");




        });
    }

    function addEdgeTest(id, src, tgt, className) {

        QUnit.test('chise.addEdge()', function (assert) {
            chise.addEdge(src, tgt, className, id);
            var edge = cy.getElementById(id);
            assert.ok(edge, "An edge with id: " + id + " is added.");
            assert.equal(edge.data('source'), src, "the edge has the expected source");
            assert.equal(edge.data('target'), tgt, "the edge has the expected target");

            var edgeModel = modelManager.getModelEdge(id);

            assert.ok(edgeModel, "Edge is added to the model.");
            assert.equal(modelManager.getModelEdgeAttribute("data.id", id), cy.getElementById(id).data("id") , "Edge is equal in model and cytoscape");
            assert.equal(edge.data("class"), modelManager.getModelEdgeAttribute("data.class", id), "Edge class is equal in model and cytoscape.");
            assert.equal(edge.data('source'),modelManager.getModelEdgeAttribute("data.source", id), "Edge target x is equal in model and cytoscape.");
            assert.equal(edge.data('target'),modelManager.getModelEdgeAttribute("data.target", id), "Edge source y is equal in model and cytoscape.");

        });
    }

    // TODO go back this function to consider the cases where a compound cannot be created.
    function createCompoundTest(id, compoundType) {
        QUnit.test('chise.createCompoundForGivenNodes()', function (assert) {
            // chise.addNode(100, 200, 'macromolecule', "anotherMacromolecule")
            // chise.createCompoundForGivenNodes(cy.nodes('#anotherMacromolecule'), 'complex');
            // var node = cy.getElementById(id);
            chise.createCompoundForGivenNodes(cy.getElementById(id), compoundType);
            var allNodes = cy.nodes();
            // New compound is located just before its children on the nodes list
            var newCompound = allNodes[allNodes.length - 2];
            // assert.equal(cy.nodes('#anotherMacromolecule').parent().data('class'), 'complex', 'Create compound operation is successful node');
            assert.equal(newCompound.id(), cy.getElementById(id).data('parent'), "Compound is created");
            assert.equal(newCompound.data('class'), compoundType, "Compound has the correct sbgn class");





                var compoundModel = modelManager.getModelNode(newCompound.id());

                assert.ok(compoundModel, "Compound is added to the model.");
                assert.equal(modelManager.getModelNodeAttribute("data.id", newCompound.id()), cy.getElementById(id).data("parent"), "Compound is the parent of the node.");

                assert.equal(modelManager.getModelNodeAttribute("data.class", newCompound.id()), compoundType, "Model compound has the correct sbgn class.");

        });
    }

    function cloneElementsTest() {
        QUnit.test('chise.cloneElements()', function (assert) {

            var initialSize = cy.elements().length;
            chise.cloneElements(cy.elements());
            assert.equal(cy.elements().length, initialSize * 2, "Clone operation is successful");

        });
    }

    function cloneNodeTest(id) {
        QUnit.test('chise.cloneElements()', function (assert) {




            var eles = cy.nodes('#' + id);
            var node = cy.getElementById(id);

            console.log(eles);

            chise.cloneElements(eles);


            var nodeModel = modelManager.getModelNode(id);


            for(var att in node.data()){
                if(node.data().hasOwnProperty(att) && att !== "bbox"){
                    assert.propEqual(nodeModel.data[att],node.data(att), 'Data ' + att +' of actual and cloned elements are the same.');
                }
            }




        });
    }

    function expandCollapseTest(selector) {
        QUnit.test('chise.collapseNodes() and chise.expandNodes()', function (assert) {
            var filteredNodes = cy.nodes(selector);
            var initilChildrenSize = filteredNodes.children().length;
            var initialNodesSize = cy.nodes().length;
            var initialEdgesSize = cy.edges().length;

            chise.collapseNodes(filteredNodes);
            assert.equal(filteredNodes.children().length, 0, "Collapse operation is successful");

            filteredNodes.forEach(function(node){
                var expandCollapseStatus = modelManager.getModelNodeAttribute('expandCollapseStatus', node.id());
                assert.equal(expandCollapseStatus, "collapse", "Collapse on node " + node.id()  + " is successful");

            });



            chise.expandNodes(filteredNodes);
            assert.equal(filteredNodes.children().length, initilChildrenSize, "Initial children size is protected after expand operation");
            assert.equal(cy.nodes().length, initialNodesSize, "Initial nodes size is protected after expand operation");
            assert.equal(cy.edges().length, initialEdgesSize, "Initial edges size is protected after expand operation");



            filteredNodes.forEach(function(node){
                var expandCollapseStatus = modelManager.getModelNodeAttribute('expandCollapseStatus', node.id());
                assert.equal(expandCollapseStatus, "expand", "Expand on node " + node.id()  + " is successful");

            });


        });
    }

    function deleteElesTest(selector) {
        QUnit.test('chise.deleteElesSimple()', function (assert) {

            var nodeIds = [];
            var edgeIds = [];

            cy.elements(selector).forEach(function(ele){
                if(ele.isNode())
                    nodeIds.push(ele.id());
                else
                    edgeIds.push(ele.id());

            });

            chise.deleteElesSimple(cy.elements(selector));
            assert.equal(cy.elements(selector).length, 0, "Delete simple operation is successful");

            nodeIds.forEach(function(nodeId){
                assert.notOk(modelManager.getModelNode(nodeId), "Node " + nodeId + " removed successfully.")
            });

            edgeIds.forEach(function(edgeId){
                assert.notOk(modelManager.getModelEdge(edgeId), "Edge " + edgeId + " removed successfully.")
            });


        });
    }

    function hideElesTest(selector) {
        QUnit.test('chise.hideNodesSmart()', function (assert) {
            var nodes = cy.nodes(selector);
            var allNodes = cy.nodes().filter(':visible');
            var nodesToShow = chise.elementUtilities.extendRemainingNodes(nodes, allNodes).nodes();

            chise.hideNodesSmart(nodes);
            assert.equal(cy.nodes().filter(':visible').length, nodesToShow.length, "Hide operation is successful");


            nodes.forEach(function(node){
                var visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id());
                assert.equal(visibilityStatus, "hide", "Hide on node " + node.id()  + " is successful");
            });
        });
    }

    function showAllElesTest() {
        QUnit.test('chise.showAll()', function (assert) {
            chise.showAll();
            assert.equal(cy.nodes().length, cy.nodes(':visible').length, "Show all operation is successful");

            cy.nodes().forEach(function(node){
                var visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id());
                assert.equal(visibilityStatus, "show", "Show on node " + node.id()  + " is successful");
            });
        });
    }

    function highlightNeighboursTest(selector) {
        QUnit.test('chise.highlightNeighbours()', function (assert) {
            var node = cy.nodes(selector);
            var elesToHighlight = chise.elementUtilities.getNeighboursOfNodes(node);
            chise.highlightNeighbours(node);
            assert.equal(elesToHighlight.filter('.highlighted').length, elesToHighlight.length, "Highlight neighbours operation is successful");


            elesToHighlight.forEach(function(ele){
                if(ele.isNode()){
                    var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
                    assert.equal(highlightStatus, "highlighted", "Highlight on node " + ele.id()  + " is successful");
                }
                else{
                    var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', node.id());
                    assert.equal(highlightStatus, "highlighted", "Highlight on edge " + ele.id()  + " is successful");

                }
            });

        });
    }

    function removeHighlightsTest() {
        QUnit.test('chise.removeHighlights()', function (assert) {
            chise.removeHighlights();
            assert.equal(cy.elements('.highlighted').length, 0, "Remove highlights operation is successful");


            cy.elements().forEach(function(ele){
                if(ele.isNode()){
                    var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
                    assert.equal(highlightStatus, "unhighlighted", "Unhighlight on node " + ele.id()  + " is successful");
                }
                else{
                    var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', node.id());
                    assert.equal(highlightStatus, "unhighlighted", "Unhighlight on edge " + ele.id()  + " is successful");

                }
            });



        });
    }

    function highlightProcessesTest(selector) {
        QUnit.test('chise.highlightProcesses()', function (assert) {
            var nodes = cy.nodes(selector);
            var elesToHighlight = chise.elementUtilities.extendNodeList(nodes);
            chise.highlightProcesses(nodes);
            assert.equal(elesToHighlight.filter('.highlighted').length, elesToHighlight.length, "Highlight processes operation is successful");

            elesToHighlight.forEach(function(ele){
                if(ele.isNode()){
                    var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
                    assert.equal(highlightStatus, "highlighted", "Highlight on node " + ele.id()  + " is successful");
                }
                else{
                    var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', node.id());
                    assert.equal(highlightStatus, "highlighted", "Highlight on edge " + ele.id()  + " is successful");

                }
            });
        });
    }

    function changeNodeLabelTest(selector) {
        QUnit.test('chise.changeNodeLabel()', function (assert) {
            var nodes = cy.nodes(selector);
            chise.changeNodeLabel(nodes, 'test label');
            assert.equal(nodes.filter('[label="test label"]').length, nodes.length, "Change node label operation is successful");

            nodes.forEach(function(node){
                var newNodeLabel = modelManager.getModelNodeAttribute('data.label', node.id());
                assert.equal(newNodeLabel, 'test label',  "Change node label operation is successful");
            });

        });
    }

    function resizeNodesTest(dimension) {
        QUnit.test('chise.resizeNodes()', function (assert) {
            var nodes = cy.nodes('[class="macromolecule"]');

            if (dimension === 'w') {
                chise.resizeNodes(nodes, 100);
            }
            else {
                chise.resizeNodes(nodes, undefined, 100);
            }

            var filteredNodes = nodes.filter(function (node) {
                return node.data('bbox')[dimension] === 100;
            });
            assert.equal(filteredNodes.length, nodes.length, "Change " + dimension + " operation is successful");


            filteredNodes.forEach(function(node){
                var newNodeDimension = modelManager.getModelNodeAttribute('data.bbox', node.id());
                console.log(newNodeDimension[dimension]);
                console.log(node.data('bbox')[dimension]);

                assert.equal(newNodeDimension[dimension], node.data('bbox')[dimension],  "Change " + dimension + " operation is successful");
            });


        });
    }

    function changeDataTest(selector, name, testVal, parseFloatOnCompare) {
        QUnit.test('chise.changeData(borderColor)', function (assert) {
            var nodes = cy.nodes(selector);
            nodes.unselect(); // Unselect the nodes because node selection affects some style properties like border color
            chise.changeData(nodes, name, testVal);

            var evalByParseOpt = function (val) {
                if (parseFloatOnCompare) {
                    return parseFloat(val);
                }
                return val;
            }

            var dataUpdated = nodes.filter(function (node) {
                return evalByParseOpt(node.data(name)) === testVal;
            });

            var styleUpdated = nodes.filter(function (node) {
                return evalByParseOpt(node.css(name)) === testVal;
            });

            assert.equal(dataUpdated.length, nodes.length, "Change " + name + " operation is successfully changed element data");
            assert.equal(styleUpdated.length, nodes.length, "Change " + name + " operation is successfully changed element style");



            nodes.forEach(function(node){

                var attStr = 'data.' + name;
                var attVal = modelManager.getModelNodeAttribute(attStr, node.id());
                assert.equal(attVal, testVal, "Change " + name + " operation is successful in the model.");
            });
        });
    }

    addNodeTest('addNode1', 'macromolecule', 100, 100);
    addNodeTest('addNode2', 'process', 100, 200);
    addNodeTest('addNode3', 'macromolecule', 200, 200);
    addEdgeTest('addEdge', 'addNode1', 'addNode2', 'necessary stimulation');


   createCompoundTest('addNode3', 'complex');
   cloneElementsTest();

        cloneNodeTest('addNode1');


    expandCollapseTest(':parent');
    deleteElesTest('#addNode1');
    hideElesTest('#addNode2');
    showAllElesTest();
    highlightNeighboursTest('[class="macromolecule"]');
    removeHighlightsTest();
    highlightProcessesTest('[class="macromolecule"]');
    removeHighlightsTest();
    changeNodeLabelTest('[class="macromolecule"]');
    resizeNodesTest('w');
    resizeNodesTest('h');
    changeDataTest('[class="macromolecule"]', 'border-color', '#b6f442');
    changeDataTest('[class="macromolecule"]', 'background-color', '#15076d');
    changeDataTest('[class="macromolecule"]', 'border-width', 2, true);
    changeDataTest('[class="macromolecule"]', 'background-opacity', 1, true);
}