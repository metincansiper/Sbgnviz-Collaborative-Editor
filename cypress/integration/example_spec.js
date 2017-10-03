
function addNodeTest(id, className, posX, posY) {

    it('chise.addNode()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        chise.addNode(posX, posY, className, id);
        var node = window.cy.getElementById(id);
        // expect(node, "A node with id: " + id + " is added.").to.be.ok;
        expect(node.length, "A node with id: " + id + " is added.").to.equal(1);
        expect(node.position('x'), 'x position of the node is as expected').to.equal(posX);
        expect(node.position('y'), 'y position of the node is as expected').to.equal(posY);
        expect(node.data('class'), 'the node has the expected sbgn class').to.equal(className);

        var modelManager = window.testModelManager;
        expect(modelManager, 'model manager is available here').to.be.ok;
        var nodeModel = modelManager.getModelNode(id);
        expect(nodeModel, 'node model is available here').to.be.ok;
        expect(modelManager.getModelNodeAttribute("data.id", id), "Node is equal in model and cytoscape").to.be.equal(window.cy.getElementById(id).data("id"));
        expect(modelManager.getModelNodeAttribute("data.class", id), "Node class is equal in model and cytoscape.").to.be.equal(node.data("class"));
        expect(modelManager.getModelNodeAttribute("position.x", id), "Node position x is equal in model and cytoscape.").to.be.equal(node.position('x'));
        expect(modelManager.getModelNodeAttribute("position.y", id), "Node position y is equal in model and cytoscape.").to.be.equal(node.position('y'));
      });
    });
}

function addEdgeTest(id, src, tgt, className) {

    it('chise.addEdge()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        chise.addEdge(src, tgt, className, id);
        var edge = window.cy.getElementById(id);
        expect(edge, "An edge with id: " + id + " is added.").to.be.ok;
        expect(edge.data('source'), "the edge has the expected source").to.be.equal(src);
        expect(edge.data('target'), "the edge has the expected target").to.be.equal(tgt);

        var modelManager = window.testModelManager;
        var edgeModel = modelManager.getModelEdge(id);

        expect(edgeModel, "Edge is added to the model.").to.be.ok;
        expect(modelManager.getModelEdgeAttribute("data.id", id) , "Edge is equal in model and cytoscape").to.be.equal(window.cy.getElementById(id).data("id"));
        expect(modelManager.getModelEdgeAttribute("data.class", id), "Edge class is equal in model and cytoscape.").to.be.equal(edge.data("class"));
        expect(modelManager.getModelEdgeAttribute("data.source", id), "Edge target x is equal in model and cytoscape.").to.be.equal(edge.data('source'));
        expect(modelManager.getModelEdgeAttribute("data.target", id), "Edge source y is equal in model and cytoscape.").to.be.equal(edge.data('target'));
      });
    });
}

function createCompoundTest(compoundType) {

    it('chise.createCompoundForGivenNodes()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        chise.addNode(100, 100, 'macromolecule', 'macromoleculeToCreateCompound');

        var existingIdMap = {};

        // Map the existing nodes before creating the compound
        window.cy.nodes().forEach(function (ele) {
            existingIdMap[ele.id()] = true;
        });

        chise.createCompoundForGivenNodes(window.cy.getElementById('macromoleculeToCreateCompound'), compoundType);

        // The element who is not mapped before the operation is supposed to be the new compound
        var newEle = window.cy.nodes().filter(function (ele) {
            return existingIdMap[ele.id()] !== true;
        });

        expect(newEle.length, "New compound is created").to.be.equal(1);
        expect(newEle.data('class'), "New compound has the expected class").to.be.equal(compoundType);

        var modelManager = window.testModelManager;
        var compoundModel = modelManager.getModelNode(newEle.id());

        expect(compoundModel, "Compound is added to the model.").to.be.ok;
        expect(modelManager.getModelNodeAttribute("data.id", newEle.id()), "Compound is the parent of the node.").to.be.equal(window.cy.getElementById('macromoleculeToCreateCompound').data("parent"));

        expect(modelManager.getModelNodeAttribute("data.class", newEle.id()), "Model compound has the correct sbgn class.").to.be.equal(compoundType);
      });
    });
}

function cloneElementsTest() {

    it('chise.cloneElements()', function () {
      cy.window().should(function(window){
        var initialSize = window.cy.elements().length;
        window.chise.cloneElements(window.cy.elements());
        expect(window.cy.elements().length, "Clone operation is successful").to.be.equal(initialSize * 2);
      });
    });
}

function cloneNodeTest(id) {

    it('chise.cloneElements()', function () {
      cy.window().should(function(window){
        var node = window.cy.getElementById(id);

        window.chise.cloneElements(node);

        var modelManager = window.testModelManager;
        var nodeModel = modelManager.getModelNode(id);

        for(var att in node.data()){
            if(node.data().hasOwnProperty(att) && att !== "bbox"){
                // assert.propEqual(nodeModel.data[att],node.data(att), 'Data ' + att +' of actual and cloned elements are the same.');
                expect(nodeModel.data[att], 'Data ' + att +' of actual and cloned elements are the same.').to.deep.equal(node.data(att));
            }
        }
      });
    });
}

function expandCollapseTest(selector) {

    it('chise.collapseNodes() and chise.expandNodes()', function () {
      cy.window().should(function(window){
        var filteredNodes = window.cy.nodes(selector);
        var initilChildrenSize = filteredNodes.children().length;
        var initialNodesSize = window.cy.nodes().length;
        var initialEdgesSize = window.cy.edges().length;

        var chise = window.chise;

        chise.collapseNodes(filteredNodes);
        expect(filteredNodes.children().length, "Collapse operation is successful").to.be.equal(0);
        chise.expandNodes(filteredNodes);
        expect(filteredNodes.children().length, "Initial children size is protected after expand operation").to.be.equal(initilChildrenSize);
        expect(window.cy.nodes().length, "Initial nodes size is protected after expand operation").to.be.equal(initialNodesSize);
        expect(window.cy.edges().length, "Initial edges size is protected after expand operation").to.be.equal(initialEdgesSize);

        var modelManager = window.testModelManager;

        filteredNodes.forEach(function(node){
            var expandCollapseStatus = modelManager.getModelNodeAttribute('expandCollapseStatus', node.id());
            expect(expandCollapseStatus, "Expand on node " + node.id()  + " is successful").to.be.equal("expand");
        });
      });
    });
}

function deleteElesTest(selector) {

    it('chise.deleteElesSimple()', function () {
      cy.window().should(function(window){
        var nodeIds = [];
        var edgeIds = [];

        window.cy.elements(selector).forEach(function(ele){
            if(ele.isNode())
                nodeIds.push(ele.id());
            else
                edgeIds.push(ele.id());
        });

        window.chise.deleteElesSimple(window.cy.elements(selector));
        expect(window.cy.elements(selector).length, "Delete simple operation is successful").to.be.equal(0);

        nodeIds.forEach(function(nodeId){
            expect(modelManager.getModelNode(nodeId), "Node " + nodeId + " removed successfully.").not.to.be.ok;
        });

        edgeIds.forEach(function(edgeId){
            expect(modelManager.getModelEdge(edgeId), "Edge " + edgeId + " removed successfully.").not.to.be.ok;
        });
      });
    });
}

function deleteNodesSmartTest(selector) {

    it('chise.deleteElesSmart()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var allNodes = window.cy.nodes();
        var nodes = window.cy.nodes(selector);
        var nodesToKeep = chise.elementUtilities.extendRemainingNodes(nodes, allNodes);
        var nodesNotToKeep = allNodes.not(nodesToKeep);
        chise.deleteNodesSmart(nodes);
        expect(window.cy.nodes(selector).length, "Delete smart operation is successful").to.be.equal(0);
      });
    });
}

function hideElesTest(selector) {

    it('chise.hideNodesSmart()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var nodes = window.cy.nodes(selector);
        var allNodes = window.cy.nodes().filter(':visible');
        var nodesToShow = chise.elementUtilities.extendRemainingNodes(nodes, allNodes).nodes();

        chise.hideNodesSmart(nodes);
        expect(window.cy.nodes().filter(':visible').length, "Hide operation is successful").to.be.equal(nodesToShow.length);

        var modelManager = window.testModelManager;

        nodes.forEach(function(node){
            var visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id());
            expect(visibilityStatus, "Hide on node " + node.id()  + " is successful").to.be.equal("hide");
        });
      });
    });
}

function showAllElesTest() {

    it('chise.showAll()', function () {
      cy.window().should(function(window){
        window.chise.showAll();
        expect(window.cy.nodes().length, "Show all operation is successful").to.be.equal(window.cy.nodes(':visible').length);

        var modelManager = window.testModelManager;

        window.cy.nodes().forEach(function(node){
            var visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id());
            expect(visibilityStatus, "Show on node " + node.id()  + " is successful").not.to.be.equal("hide");
        });
      });
    });
}

function alignTest (selector, horizontal, vertical, alignToId) {

    it('chise.align()', function () {
      cy.window().should(function(window){
        var nodes = window.cy.nodes(selector);

        // If node to align to is not set use the first node in the list
        var alignToNode = alignToId ? window.cy.getElementById(alignToId) : nodes[0];

        // Return the alignment coordinate of the given node. This alignment coordinate is depandent on
        // the horizontal and vertical parameters and after the align operation all nodes should have the same
        // alignment coordinate of the align to node.
        var getAlignmentCoord = function(node) {
            if (vertical === 'center') {
                return node.position('x');
            }
            if (vertical === 'left') {
                return node.position('x') - node.outerWidth() / 2;
            }
            if (vertical === 'right') {
                return node.position('x') + node.outerWidth() / 2;
            }
            if (horizontal === 'middle') {
                return node.position('y');
            }
            if (horizontal === 'top') {
                return node.position('y') - node.outerHeight() / 2;
            }
            if (horizontal === 'bottom') {
                return node.position('y') + node.outerHeight() / 2;
            }
        }

        var expectedCoord = getAlignmentCoord(alignToNode);

        window.chise.align(nodes, horizontal, vertical, alignToNode);
        var filteredNodes = nodes.filter(function(node) {
            var coord = getAlignmentCoord(node);
            return coord === expectedCoord;
        });

        expect(filteredNodes.length, "Align operation is successful for all nodes " + horizontal + " " + vertical).to.be.equal(nodes.length);
      });
    });
}

function highlightElesTest(selector) {

    it('chise.highlightEles()', function () {
      cy.window().should(function(window){
        var eles = window.cy.$(selector);
        window.chise.highlightSelected(eles); // This method highlights the given eles not the selected ones. It has an unfortune name.
        expect(eles.filter('.highlighted').length, "Highlight operation is successful").to.be.equal(eles.length);
      });
    });
}

function removeHighlightsTest() {

    it('chise.removeHighlights()', function () {
      cy.window().should(function(window){
        window.chise.removeHighlights();
        expect(window.cy.elements('.highlighted').length, "Remove highlights operation is successful").to.be.equal(0);

        var modelManager = window.testModelManager;

        window.cy.elements().forEach(function(ele){
            if(ele.isNode()){
                var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
                expect(highlightStatus, "Unhighlight on node " + ele.id()  + " is successful").to.be.equal("unhighlighted");
            }
            else{
                var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id());
                expect(highlightStatus, "Unhighlight on edge " + ele.id()  + " is successful").to.be.equal("unhighlighted");
            }
        });
      });
    });
}

function highlightProcessesTest(selector) {

    it('chise.highlightProcesses()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var nodes = window.cy.nodes(selector);
        var elesToHighlight = chise.elementUtilities.extendNodeList(nodes);
        chise.highlightProcesses(nodes);
        assert.equal(elesToHighlight.filter('.highlighted').length, elesToHighlight.length, "Highlight processes operation is successful");

        var modelManager = window.testModelManager;

        elesToHighlight.forEach(function(ele){
            if(ele.isNode()){
                var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
                expect(highlightStatus, "Highlight on node " + ele.id()  + " is successful").to.be.equal("highlighted");
            }
            else{
                var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id());
                expect(highlightStatus, "Highlight on edge " + ele.id()  + " is successful").to.be.equal("highlighted");
            }
        });
      });
    });
}

function highlightNeighboursTest (selector) {

    it('chise.highlightNeighbours()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var nodes = window.cy.nodes(selector);
        var elesToHighlight = chise.elementUtilities.getNeighboursOfNodes(nodes);
        chise.highlightNeighbours(nodes);
        expect(elesToHighlight.filter('.highlighted').length, "Highlight neighbours operation is successful").to.be.equal(elesToHighlight.length);

        var modelManager = window.testModelManager;

        elesToHighlight.forEach(function(ele){
            if(ele.isNode()){
                var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
                expect(highlightStatus, "Highlight on node " + ele.id()  + " is successful").to.be.equal("highlighted");
            }
            else{
                var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id());
                expect(highlightStatus, "Highlight on edge " + ele.id()  + " is successful").to.be.equal("highlighted");
            }
        });
      });
    });
}

function changeNodeLabelTest(selector) {

    it('chise.changeNodeLabel()', function () {
      cy.window().should(function(window){
        var nodes = window.cy.nodes(selector);
        window.chise.changeNodeLabel(nodes, 'test label');
        expect(nodes.filter('[label="test label"]').length, "Change node label operation is successful").to.be.equal(nodes.length);

        var modelManager = window.testModelManager;

        nodes.forEach(function(node){
            var newNodeLabel = modelManager.getModelNodeAttribute('data.label', node.id());
            expect(newNodeLabel,  "Change node label operation is successful").to.be.equal('test label');
        });
      });
    });
}

function resizeNodesTest(dimension) {

    it('chise.resizeNodes()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var nodes = window.cy.nodes('[class="macromolecule"]');

        if (dimension === 'w') {
            chise.resizeNodes(nodes, 100);
        }
        else {
            chise.resizeNodes(nodes, undefined, 100);
        }

        var filteredNodes = nodes.filter(function(node) {
            return node.data('bbox')[dimension] === 100;
        });

        expect(filteredNodes.length, "Change " + dimension + " operation is successful").to.be.equal(nodes.length);

        var modelManager = window.testModelManager;

        filteredNodes.forEach(function(node){
            var newNodeDimension = modelManager.getModelNodeAttribute('data.bbox', node.id());
            console.log(newNodeDimension[dimension]);
            console.log(node.data('bbox')[dimension]);

            expect(newNodeDimension[dimension],  "Change " + dimension + " operation is successful").to.be.equal(node.data('bbox')[dimension]);
        });
      });
    });
}

function changeDataTest(selector, name, testVal, parseFloatOnCompare, omitStyle) {

    it('chise.changeData()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var elements = window.cy.$(selector);
        elements.unselect(); // Unselect the nodes because node selection affects some style properties like border color
        chise.changeData(elements, name, testVal);

        var evalByParseOpt = function(val) {
            if (parseFloatOnCompare) {
                return parseFloat(val);
            }
            return val;
        }

        var dataUpdated = elements.filter(function(ele) {
            return evalByParseOpt(ele.data(name)) === testVal;
        });

        expect(dataUpdated.length, "Change " + name + " operation is successfully changed element data").to.be.equal(elements.length);

        // Generally data fields have a corresponding style fields that are updated by their values.
        // If there is an exceptional case 'omitStyle' flag should be set upon calling this function.
        if (!omitStyle) {
            var styleUpdated = elements.filter(function(ele) {
                return evalByParseOpt(ele.css(name)) === testVal;
            });

            expect(styleUpdated.length, "Change " + name + " operation is successfully changed element style").to.be.equal(elements.length);
        }

        var modelManager = window.testModelManager;

        elements.forEach(function(ele){
            var attStr = 'data.' + name;
            var attVal = ele.isNode() ? modelManager.getModelNodeAttribute(attStr, ele.id()) : modelManager.getModelEdgeAttribute(attStr, ele.id());
            expect(attVal, "Change " + name + " operation is successful in the model.").to.be.equal(testVal);
        });
      });
    });
}

function addStateOrInfoboxTest (id, obj) {

    it('chise.addStateOrInfoBox()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var node = window.cy.getElementById(id);
        var initialUnitsSize = node.data('statesandinfos').length;
        chise.addStateOrInfoBox(node, obj);
        var statesandinfos = node.data('statesandinfos')
        expect(initialUnitsSize + 1, "A new auxiliary unit is successfully added").to.be.equal(statesandinfos.length);

        var newUnit = statesandinfos[statesandinfos.length - 1];
        expect(newUnit.clazz, "New unit has the expected unit type").to.be.equal(obj.clazz);
        expect(JSON.stringify(newUnit.bbox), "New unit has the expected sizes").to.be.equal(JSON.stringify(obj.bbox));

        if (obj.state) {
            expect(JSON.stringify(newUnit.state), "New unit has the expected state object").to.be.equal(JSON.stringify(obj.state));
        }

        if (obj.label) {
            expect(JSON.stringify(newUnit.label), "New unit has the expected label object").to.be.equal(JSON.stringify(obj.label));
        }
      });
    });
}

function changeStateOrInfoBoxTest (id, index, value, type) {

    it('chise.changeStateOrInfoBox()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var node = window.cy.getElementById(id);
        chise.changeStateOrInfoBox(node, index, value, type);

        // Get the updated unit to check if it is updated correctly
        var unit = node.data('statesandinfos')[index];

        // If type is not set we assume that it is a unit of information
        if (type) {
            expect(unit.state[type], "State variable is updated by " + type + " field.").to.be.equal(value);
        }
        else {
            expect(unit.label['text'], "Unit of information label text is updated correctly.").to.be.equal(value)
        }
      });
    });
}

function removeStateOrInfoBoxTest (id, index) {

    it('chise.removeStateOrInfoBox()', function () {
      cy.window().should(function(window){
        var node = window.cy.getElementById(id);
        var unitToRemove = node.data('statesandinfos')[index];
        window.chise.removeStateOrInfoBox(node, index);
        var checkIndex = node.data('statesandinfos').indexOf(unitToRemove);
        expect(checkIndex, "Auxiliary unit is removed successfully").to.be.equal(-1);
      });
    });
}

function setMultimerStatusTest (selector, status) {

    it('chise.setMultimerStatus()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        var nodes = window.cy.nodes(selector);

        chise.setMultimerStatus(nodes, status);

        var filteredNodes = nodes.filter(function(node) {
            var isMultimer = node.data('class').indexOf('multimer') > -1;
            return isMultimer === status;
        });

        expect(filteredNodes.length, "Multimer status is set/unset for all nodes").to.be.equal(nodes.length);
      });
    });
}

function setCloneMarkerStatusTest (selector, status) {

    it('chise.setCloneMarkerStatus()', function () {
      cy.window().should(function(window){
        var nodes = window.cy.nodes(selector);
        window.chise.setCloneMarkerStatus(nodes, status);

        var filteredNodes = nodes.filter(function(node) {
            var isCloneMarker = ( node.data('clonemarker') === true );
            return isCloneMarker === status;
        });

        expect(filteredNodes.length, "clonemarker status is set/unset for all nodes").to.be.equal(nodes.length);
      });
    });
}

function changeFontPropertiesTest (selector, data) {

    it('chise.changeFontProperties()', function () {
      cy.window().should(function(window){
        var nodes = window.cy.nodes(selector);
        window.chise.changeFontProperties(nodes, data);

        var filteredNodes = nodes.filter(function(node) {
            for (var prop in data) {
                if (node.data(prop) !== data[prop]) {
                    return false;
                }

                return true;
            }
        });

        expect(filteredNodes.length, "Font properties are updated for all nodes").to.be.equal(nodes.length);
      });
    });
}

function changeParentTest(selector, newParentId, posDiffX, posDiffY) {

    it('chise.changeParentTest()', function () {
      cy.window().should(function(window){
        // Keep initial positions of the nodes to be able to check if they are repositioned as expected
        var oldPositions = {};
        var nodes = window.cy.nodes(selector);

        nodes.forEach(function(node) {
            oldPositions[node.id()] = {
                x: node.position('x'),
                y: node.position('y')
            };
        });

        window.chise.changeParent(nodes, newParentId, posDiffX, posDiffY);

        var updatedNodes = window.cy.nodes(selector); // Node list should be updated after change parent operation

        // Filter the nodes that are moved to the new parent
        var filteredNodes = updatedNodes.filter(function (node) {
            return node.data('parent') === newParentId;
        });

        expect(filteredNodes.length, "All nodes are moved to the new parent").to.be.equal(nodes.length);

        var allRepositionedCorrectly = true;

        // Check if the nodes are repositioned as expected
        updatedNodes.forEach(function(node) {
            if (node.position('x') - oldPositions[node.id()].x !== posDiffX
                || node.position('y') - oldPositions[node.id()].y !== posDiffY) {
                allRepositionedCorrectly = false;
            }
        });

        expect(allRepositionedCorrectly, "All nodes are repositioned as expected").to.be.equal(true);
      });
    });
}

function setPortsOrderingTest(selector, ordering) {

    it('chise.setPortsOrdering()', function () {
      cy.window().should(function(window){
        var nodes = window.cy.nodes(selector);
        var chise = window.chise;

        chise.setPortsOrdering(nodes, ordering);
        var commonOrdering = chise.elementUtilities.getPortsOrdering(nodes);

        expect(commonOrdering, "Ports ordering is set for all nodes").to.be.equal(ordering);
      });
    });
}

function resetMapTypeTest() {

    it('chise.resetMapType()', function () {
      cy.window().should(function(window){
        window.chise.resetMapType();
        expect(window.chise.elementUtilities.mapType).not.to.be.ok;
      });
    });
}

describe('CWC Test', function(){
  it('Access global window object', function(){
    // https://on.cypress.io/visit
    cy.visit('http://localhost:3000')
    // cy.visit('/')

    cy.window().should(function(window){
      window.myVar = 'myVar';
    })

    cy.window().should(function(window){
      expect(window.myVar).to.be.ok
      expect(window.chise).to.be.ok
      expect(window.location.hostname).to.eq('localhost')
    })
  })

  addNodeTest('pdNode0', 'macromolecule', 100, 100);
  addNodeTest('pdNode1', 'process', 100, 200);
  addNodeTest('pdNode2', 'macromolecule', 200, 200);

  addEdgeTest('pdEdge', 'pdNode1', 'pdNode2', 'necessary stimulation');

  var pdNodeTypes = ['macromolecule', 'complex', 'simple chemical', 'unspecified entity',
      'nucleic acid feature', 'perturbing agent', 'source and sink', 'phenotype', 'process',
      'omitted process', 'uncertain process', 'association', 'dissociation', 'tag',
      'compartment', 'submap', 'and', 'or', 'not'
  ];

  for (var i = 0; i < pdNodeTypes.length; i++) {
      var id = 'pdNode' + (i + 3);
      addNodeTest(id, pdNodeTypes[i], 300, 200);
  }

  resetMapTypeTest(); // Reset the map type here to unknown to allow adding AF elements

  var afNodeTypes = ['biological activity', 'BA plain', 'BA unspecified entity',
      'BA simple chemical', 'BA macromolecule', 'BA nucleic acid feature',
      'BA perturbing agent', 'BA complex', 'delay'];

  for (var i = 0; i < afNodeTypes.length; i++) {
      var id = 'afNode' + i;
      addNodeTest(id, afNodeTypes[i], 300, 200);
  }

  var pdEdgeTypes = ['consumption', 'production', 'modulation', 'stimulation',
      'catalysis', 'necessary stimulation', 'logic arc', 'equivalence arc'];

  for (var i = 0; i < pdEdgeTypes.length; i++) {
      var id = 'pdEdge' + i;
      var src = 'pdNode' + i;
      var tgt = 'pdNode' + (pdNodeTypes.length - i - 1);
      addEdgeTest(id, src, tgt, pdEdgeTypes[i]);
  }

  var afEdgeTypes = ['unknown influence', 'positive influence', 'negative influence'];

  for (var i = 0; i < afEdgeTypes.length; i++) {
      var id = 'afEdge' + i;
      var src = 'afNode' + i;
      var tgt = 'afNode' + (afNodeTypes.length - i - 1);
      addEdgeTest(id, src, tgt, afEdgeTypes[i]);
  }

  createCompoundTest('complex');
  cloneElementsTest();
  cloneNodeTest('pdNode5');

  expandCollapseTest(':parent');
  deleteElesTest('#pdNodeO');
  deleteNodesSmartTest('#pdNode7');

  hideElesTest('#pdNode1');
  showAllElesTest();

  alignTest('node', 'left');
  alignTest('node', 'center');
  alignTest('node', 'none', 'top');
  alignTest('node', 'none', 'bottom');
  alignTest('node', 'none', 'middle');

  highlightElesTest('[class="macromolecule"]');
  removeHighlightsTest();
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
  changeDataTest('edge', 'width', 3.5, true);
  changeDataTest('edge', 'cardinality', 3, true, true);
  changeDataTest('edge', 'line-color', '#b6f442');

  var stateVarObj = {};
  stateVarObj.clazz = 'state variable';
  stateVarObj.state = {
      value: 'val',
      variable: 'var'
  };
  stateVarObj.bbox = {
      w: 40,
      h: 20
  };

  var unitOfInfoObj = {};
  unitOfInfoObj.clazz = 'unit of information';
  unitOfInfoObj.label = {
      text: 'label'
  };
  unitOfInfoObj.bbox = {
      w: 40,
      h: 20
  };

  addStateOrInfoboxTest('pdNode3', stateVarObj);
  addStateOrInfoboxTest('pdNode3', unitOfInfoObj);

  changeStateOrInfoBoxTest('pdNode3', 0, 'updated val', 'value');
  changeStateOrInfoBoxTest('pdNode3', 0, 'updated var', 'variable');
  changeStateOrInfoBoxTest('pdNode3', 1, 'updated label');

  removeStateOrInfoBoxTest('pdNode3', 0);

  setMultimerStatusTest('[class="macromolecule"]', true);
  setCloneMarkerStatusTest('[class="macromolecule multimer"]', true);

  setMultimerStatusTest('[class="macromolecule multimer"]', false);
  setCloneMarkerStatusTest('[class="macromolecule"]', false);

  changeFontPropertiesTest('[class="macromolecule"]', {
      'font-size': '10px',
      'font-family': 'Arial',
      'font-weight': 'bolder'
  });

  addNodeTest('aCompartment', 'compartment', 100, 1000);
  addNodeTest('mm1', 'macromolecule', 150, 150);
  addNodeTest('mm2', 'macromolecule', 150, 190);
  changeParentTest('#mm1, #mm2', 'aCompartment', 5, 5);

  addNodeTest('process1', 'process', 50, 50);
  addNodeTest('process2', 'omitted process', 50, 100);
  setPortsOrderingTest('#process1, #process2', 'T-to-B');
})
