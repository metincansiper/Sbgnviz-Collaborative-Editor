QUnit = require('qunitjs');
module.exports = function(modelManager){
  QUnit.module( "User operations tests to see if model is updated correctly." );

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

  function selectTest(selector) {
    QUnit.test('chise.select()', function (assert) {
      assert.equal(cy.elements(selector).length, cy.elements(selector).filter(':visible').length, "select " + selector + " operation is successful");
    });
  }

  function createCompoundTest(compoundType) {
    QUnit.test('chise.createCompoundForGivenNodes()', function (assert) {
      chise.addNode(100, 100, 'macromolecule', 'macromoleculeToCreateCompound');

      var existingIdMap = {};

      cy.nodes().forEach(function (ele) {
        existingIdMap[ele.id()] = true;
      });

      chise.createCompoundForGivenNodes(cy.getElementById('macromoleculeToCreateCompound'), compoundType);

      var newEle = cy.nodes().filter(function (ele) {
        return existingIdMap[ele.id()] !== true;
      });

      assert.equal(newEle.length, 1, "New compound is created");
      assert.equal(newEle.data('class'), compoundType, "New compound has the expected class");

      var compoundModel = modelManager.getModelNode(newEle.id());

      assert.ok(compoundModel, "Compound is added to the model.");
      assert.equal(modelManager.getModelNodeAttribute("data.id", newEle.id()), cy.getElementById('macromoleculeToCreateCompound').data("parent"), "Compound is the parent of the node.");

      assert.equal(modelManager.getModelNodeAttribute("data.class", newEle.id()), compoundType, "Model compound has the correct sbgn class.");
    });
  }

  function changeParentTest(selector, newParentId, posDiffX, posDiffY) {
    QUnit.test('chise.changeParentTest()', function (assert) {
      // Keep initial positions of the nodes to be able to check if they are repositioned as expected
      var oldPositions = {};
      var nodes = cy.nodes(selector);

      nodes.forEach(function(node) {
        oldPositions[node.id()] = {
          x: node.position('x'),
          y: node.position('y')
        };
      });

      chise.changeParent(nodes, newParentId, posDiffX, posDiffY);

      var updatedNodes = cy.nodes(selector); // Node list should be updated after change parent operation

      // Filter the nodes that are moved to the new parent
      var filteredNodes = updatedNodes.filter(function (node) {
        return node.data('parent') === newParentId;
      });

      assert.equal(filteredNodes.length, nodes.length, "All nodes are moved to the new parent");

      var allRepositionedCorrectly = true;

      // Check if the nodes are repositioned as expected
      updatedNodes.forEach(function(node) {
        if (node.position('x') - oldPositions[node.id()].x !== posDiffX
            || node.position('y') - oldPositions[node.id()].y !== posDiffY) {
          allRepositionedCorrectly = false;
        }
      });

      assert.equal(allRepositionedCorrectly, true, "All nodes are repositioned as expected");
    });
  }

  function cloneElementsTest() {
    QUnit.test('chise.cloneElements()', function (assert) {
      var initialSize = cy.elements().length;
      chise.cloneElements(cy.elements());
      assert.equal(cy.elements().length, initialSize * 2, "Clone operation is successful");
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

  function deleteNodesSmartTest(selector) {
    QUnit.test('chise.deleteElesSimple()', function (assert) {
      var allNodes = cy.nodes();
      var nodes = cy.nodes(selector);
      var nodesToKeep = chise.elementUtilities.extendRemainingNodes(nodes, allNodes);
      var nodesNotToKeep = allNodes.not(nodesToKeep);
      chise.deleteNodesSmart(nodes);
      assert.equal(cy.nodes(selector).length, 0, "Delete smart operation is successful");
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
      var done = assert.async();
      chise.showAll();

      setTimeout(function() {
        assert.equal(cy.nodes().length, cy.nodes(':visible').length, "Show all operation is successful");

        cy.nodes().forEach(function(node){
          var visibilityStatus = modelManager.getModelNodeAttribute('visibilityStatus', node.id());
          assert.equal(visibilityStatus, "show", "Show on node " + node.id()  + " is successful");
        });

        done();
      }, 0);

    });
  }

  function highlightElesTest (selector) {
    QUnit.test('chise.highlightEles()', function (assert) {
      var eles = cy.$(selector);
      chise.highlightSelected(eles); // This method highlights the given eles not the selected ones. It has an unfortune name.
      assert.equal(eles.filter('.highlighted').length, eles.length, "Highlight operation is successful");
    });
  }

  function highlightNeighboursTest (selector) {
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
          var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id());
          assert.equal(highlightStatus, "highlighted", "Highlight on edge " + ele.id()  + " is successful");
        }
      });
    });
  }

  function removeHighlightsTest () {
    QUnit.test('chise.removeHighlights()', function (assert) {
      chise.removeHighlights();
      assert.equal(cy.elements('.highlighted').length, 0, "Remove highlights operation is successful");

      cy.elements().forEach(function(ele){
        if(ele.isNode()){
          var highlightStatus = modelManager.getModelNodeAttribute('highlightStatus', ele.id());
          assert.equal(highlightStatus, "unhighlighted", "Unhighlight on node " + ele.id()  + " is successful");
        }
        else{
          var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id());
          assert.equal(highlightStatus, "unhighlighted", "Unhighlight on edge " + ele.id()  + " is successful");
        }
      });
    });
  }

  function highlightProcessesTest (selector) {
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
          var highlightStatus = modelManager.getModelEdgeAttribute('highlightStatus', ele.id());
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

      var filteredNodes = nodes.filter(function(node) {
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

  function changeDataTest (selector, name, testVal, parseFloatOnCompare, omitStyle) {
      QUnit.test('chise.changeData()', function (assert) {
        var elements = cy.$(selector);
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

        assert.equal(dataUpdated.length, elements.length, "Change " + name + " operation is successfully changed element data");

        // Generally data fields have a corresponding style fields that are updated by their values.
        // If there is an exceptional case 'omitStyle' flag should be set upon calling this function.
        if (!omitStyle) {
          var styleUpdated = elements.filter(function(ele) {
            return evalByParseOpt(ele.css(name)) === testVal;
          });

          assert.equal(styleUpdated.length, elements.length, "Change " + name + " operation is successfully changed element style");
        }

        elements.forEach(function(ele){
          var attStr = 'data.' + name;
          var attVal = ele.isNode() ? modelManager.getModelNodeAttribute(attStr, ele.id()) : modelManager.getModelEdgeAttribute(attStr, ele.id());
          assert.equal(attVal, testVal, "Change " + name + " operation is successful in the model.");
        });
      });
  }

  function addStateOrInfoboxTest (id, obj) {
    QUnit.test('chise.addStateOrInfoBox()', function (assert) {
      var node = cy.getElementById(id);
      var initialUnitsSize = node.data('statesandinfos').length;
      chise.addStateOrInfoBox(node, obj);
      var statesandinfos = node.data('statesandinfos')
      assert.equal(initialUnitsSize + 1, statesandinfos.length, "A new auxiliary unit is successfully added");

      var newUnit = statesandinfos[statesandinfos.length - 1];
      assert.equal(newUnit.clazz, obj.clazz, "New unit has the expected unit type");
      assert.equal(JSON.stringify(newUnit.bbox), JSON.stringify(obj.bbox), "New unit has the expected sizes");

      if (obj.state) {
        assert.equal(JSON.stringify(newUnit.state), JSON.stringify(obj.state), "New unit has the expected state object");
      }

      if (obj.label) {
        assert.equal(JSON.stringify(newUnit.label), JSON.stringify(obj.label), "New unit has the expected label object");
      }
    });
  }

  // 'type' paremeter is used for state variables, it is useless for units of information
  function changeStateOrInfoBoxTest (id, index, value, type) {
    QUnit.test('chise.changeStateOrInfoBox()', function (assert) {
      var node = cy.getElementById(id);
      chise.changeStateOrInfoBox(node, index, value, type);

      // Get the updated unit to check if it is updated correctly
      var unit = node.data('statesandinfos')[index];

      // If type is not set we assume that it is a unit of information
      if (type) {
        assert.equal(unit.state[type], value, "State variable is updated by " + type + " field.");
      }
      else {
        assert.equal(unit.label['text'], value, "Unit of information label text is updated correctly.")
      }
    });
  }

  function removeStateOrInfoBoxTest (id, index) {
    QUnit.test('chise.removeStateOrInfoBox()', function (assert) {
      var node = cy.getElementById(id);
      var unitToRemove = node.data('statesandinfos')[index];
      chise.removeStateOrInfoBox(node, index);
      var checkIndex = node.data('statesandinfos').indexOf(unitToRemove);
      assert.equal(checkIndex, -1, "Auxiliary unit is removed successfully");
    });
  }

  function setMultimerStatusTest (selector, status) {
    QUnit.test('chise.setMultimerStatus()', function (assert) {
      var nodes = cy.nodes(selector);
      chise.setMultimerStatus(nodes, status);
      var filteredNodes = nodes.filter(function(node) {
        var isMultimer = node.data('class').indexOf('multimer') > -1;
        return isMultimer === status;
      });
      assert.equal(filteredNodes.length, nodes.length, "Multimer status is set/unset for all nodes");
    });
  }

  function setCloneMarkerStatusTest (selector, status) {
    QUnit.test('chise.setCloneMarkerStatus()', function (assert) {
      var nodes = cy.nodes(selector);
      chise.setCloneMarkerStatus(nodes, status);
      var filteredNodes = nodes.filter(function(node) {
        var isCloneMarker = ( node.data('clonemarker') === true );
        return isCloneMarker === status;
      });
      assert.equal(filteredNodes.length, nodes.length, "clonemarker status is set/unset for all nodes");
    });
  }

  function changeFontPropertiesTest (selector, data) {
    QUnit.test('chise.changeFontProperties()', function (assert) {
      var nodes = cy.nodes(selector);
      chise.changeFontProperties(nodes, data);
      var filteredNodes = nodes.filter(function(node) {
        for (var prop in data) {
          if (node.data(prop) !== data[prop]) {
            return false;
          }

          return true;
        }
      });
      assert.equal(filteredNodes.length, nodes.length, "Font properties are updated for all nodes");
    });
  }

  function alignTest (selector, horizontal, vertical, alignToId) {
    QUnit.test('chise.align()', function (assert) {
      var nodes = cy.nodes(selector);

      // If node to align to is not set use the first node in the list
      var alignToNode = alignToId ? cy.getElementById(alignToId) : nodes[0];

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

      chise.align(nodes, horizontal, vertical, alignToNode);
      var filteredNodes = nodes.filter(function(node) {
        var coord = getAlignmentCoord(node);
        return coord === expectedCoord;
      });

      assert.equal(filteredNodes.length, nodes.length, "Align operation is successful for all nodes " + horizontal + " " + vertical);
    });
  }

  function setPortsOrderingTest(selector, ordering) {
    QUnit.test('chise.setPortsOrdering()', function (assert) {
      var nodes = cy.nodes(selector);
      chise.setPortsOrdering(nodes, ordering);
      var commonOrdering = chise.elementUtilities.getPortsOrdering(nodes);

      assert.equal(commonOrdering, ordering, "Ports ordering is set for all nodes");
    });
  }

  var timeoutDuration = 1000;

  setTimeout(addNodeTest, timeoutDuration, 'pdNode0', 'macromolecule', 100, 100);
  setTimeout(addNodeTest, timeoutDuration, 'pdNode1', 'process', 100, 200);
  setTimeout(addNodeTest, timeoutDuration, 'pdNode2', 'macromolecule', 200, 200);

  setTimeout(addEdgeTest, timeoutDuration, 'pdEdge', 'pdNode1', 'pdNode2', 'necessary stimulation');

  var pdNodeTypes = ['macromolecule', 'complex', 'simple chemical', 'unspecified entity',
    'nucleic acid feature', 'perturbing agent', 'source and sink', 'phenotype', 'process',
    'omitted process', 'uncertain process', 'association', 'dissociation', 'tag',
    'compartment', 'submap', 'and', 'or', 'not'
  ];

  for (var i = 0; i < pdNodeTypes.length; i++) {
    var id = 'pdNode' + (i + 3);
    setTimeout(addNodeTest, timeoutDuration, id, pdNodeTypes[i], 300, 200);
  }

  chise.resetMapType(); // Reset the map type to unknown to allow adding AF elements

  var afNodeTypes = ['biological activity', 'BA plain', 'BA unspecified entity',
    'BA simple chemical', 'BA macromolecule', 'BA nucleic acid feature',
    'BA perturbing agent', 'BA complex', 'delay'];

  for (var i = 0; i < afNodeTypes.length; i++) {
    var id = 'afNode' + i;
    setTimeout(addNodeTest, timeoutDuration, id, afNodeTypes[i], 300, 200);
  }

  var pdEdgeTypes = ['consumption', 'production', 'modulation', 'stimulation',
    'catalysis', 'necessary stimulation', 'logic arc', 'equivalence arc'];

  for (var i = 0; i < pdEdgeTypes.length; i++) {
    var id = 'pdEdge' + i;
    var src = 'pdNode' + i;
    var tgt = 'pdNode' + (pdNodeTypes.length - i - 1);
    setTimeout(addEdgeTest, timeoutDuration, id, src, tgt, pdEdgeTypes[i]);
  }

  var afEdgeTypes = ['unknown influence', 'positive influence', 'negative influence'];

  for (var i = 0; i < afEdgeTypes.length; i++) {
    var id = 'afEdge' + i;
    var src = 'afNode' + i;
    var tgt = 'afNode' + (afNodeTypes.length - i - 1);
    setTimeout(addEdgeTest, timeoutDuration, id, src, tgt, afEdgeTypes[i]);
  }

  setTimeout(createCompoundTest, timeoutDuration, 'complex');
  setTimeout(cloneElementsTest, timeoutDuration);
  setTimeout(expandCollapseTest, timeoutDuration, ':parent');

  setTimeout(deleteElesTest, timeoutDuration, '#pdNodeO');
  setTimeout(deleteNodesSmartTest, timeoutDuration, '#pdNode7');
  setTimeout(hideElesTest, timeoutDuration, '#pdNode1');
  setTimeout(showAllElesTest, timeoutDuration);

  setTimeout(alignTest, timeoutDuration, 'node', 'left'); // TODO check if calling this before show all test fails it
  setTimeout(alignTest, timeoutDuration, 'node', 'right');
  setTimeout(alignTest, timeoutDuration, 'node', 'center');
  setTimeout(alignTest, timeoutDuration, 'node', 'none', 'top');
  setTimeout(alignTest, timeoutDuration, 'node', 'none', 'bottom');
  setTimeout(alignTest, timeoutDuration, 'node', 'none', 'middle');

  setTimeout(highlightElesTest, timeoutDuration, '[class="macromolecule"]');
  setTimeout(removeHighlightsTest, timeoutDuration);
  setTimeout(highlightNeighboursTest, timeoutDuration, '[class="macromolecule"]');
  setTimeout(removeHighlightsTest, timeoutDuration);
  setTimeout(highlightProcessesTest, timeoutDuration, '[class="macromolecule"]');
  setTimeout(removeHighlightsTest, timeoutDuration);
  setTimeout(changeNodeLabelTest, timeoutDuration, '[class="macromolecule"]');
  setTimeout(resizeNodesTest, timeoutDuration, 'w');
  setTimeout(resizeNodesTest, timeoutDuration, 'h');
  // For change data test 4th parameter indicates if values are parsed to float while comparing
  // the 5th flag indicates whether the style should be omitted in assertions
  setTimeout(changeDataTest, timeoutDuration, '[class="macromolecule"]', 'border-color', '#b6f442');
  setTimeout(changeDataTest, timeoutDuration, '[class="macromolecule"]', 'background-color', '#15076d');
  setTimeout(changeDataTest, timeoutDuration, '[class="macromolecule"]', 'border-width', 2, true);
  setTimeout(changeDataTest, timeoutDuration, '[class="macromolecule"]', 'background-opacity', 1, true);
  setTimeout(changeDataTest, timeoutDuration, 'edge', 'width', 3.5, true);
  setTimeout(changeDataTest, timeoutDuration, 'edge', 'cardinality', 3, true, true);
  setTimeout(changeDataTest, timeoutDuration, 'edge', 'line-color', '#b6f442');

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

  setTimeout(addStateOrInfoboxTest, timeoutDuration, 'pdNode3', stateVarObj);
  setTimeout(addStateOrInfoboxTest, timeoutDuration, 'pdNode3', unitOfInfoObj);

  setTimeout(changeStateOrInfoBoxTest, timeoutDuration, 'pdNode3', 0, 'updated val', 'value');
  setTimeout(changeStateOrInfoBoxTest, timeoutDuration, 'pdNode3', 0, 'updated var', 'variable');
  setTimeout(changeStateOrInfoBoxTest, timeoutDuration, 'pdNode3', 1, 'updated label');

  setTimeout(removeStateOrInfoBoxTest, timeoutDuration, 'pdNode3', 0);
  setTimeout(setMultimerStatusTest, timeoutDuration, '[class="macromolecule"]', true);
  setTimeout(setCloneMarkerStatusTest, timeoutDuration, '[class="macromolecule multimer"]', true);

  setTimeout(setMultimerStatusTest, timeoutDuration, '[class="macromolecule multimer"]', false);
  setTimeout(setCloneMarkerStatusTest, timeoutDuration, '[class="macromolecule"]', false);

  setTimeout(changeFontPropertiesTest, timeoutDuration, '[class="macromolecule"]', {
    'font-size': '10px',
    'font-family': 'Arial',
    'font-weight': 'bolder'
  });

  chise.addNode(100, timeoutDuration, 'compartment', 'aCompartment');
  chise.addNode(150, 150, 'macromolecule', 'mm1');
  chise.addNode(150, 190, 'macromolecule', 'mm2');
  setTimeout(changeParentTest, timeoutDuration, '#mm1, #mm2', 'aCompartment', 5, 5);

  chise.addNode(50, 50, 'process', 'process1');
  chise.addNode(50, 100, 'omitted process', 'process2');
  setTimeout(setPortsOrderingTest, timeoutDuration, '#process1, #process2', 'T-to-B');

  setTimeout(selectTest, timeoutDuration, '*');
  setTimeout(selectTest, timeoutDuration, 'node');
  setTimeout(selectTest, timeoutDuration, 'edge');
};
