QUnit = require('qunitjs');
module.exports = function(){
  QUnit.module( "User operations tests to see if model is updated correctly." );

  function addNodeTest(id, className, posX, posY) {
    QUnit.test('chise.addNode()', function (assert) {
      chise.addNode(posX, posY, className, id);
      var node = cy.getElementById(id);
      assert.ok(node, "A node with id: " + id + " is added.");
      assert.equal(node.position('x'), posX, 'x position of the node is as expected');
      assert.equal(node.position('y'), posY, 'y position of the node is as expected');
      assert.equal(node.data('class'), className, 'the node has the expected sbgn class');
    });
  }

  function addEdgeTest(id, src, tgt, className) {

    QUnit.test('chise.addEdge()', function (assert) {
      chise.addEdge(src, tgt, className, id);
      var edge = cy.getElementById(id);
      assert.ok(edge, "An edge with id: " + id + " is added.");
      assert.equal(edge.data('source'), src, "the edge has the expected source");
      assert.equal(edge.data('target'), tgt, "the edge has the expected target");
    });
  }

  // TODO go back this function to consider the cases where a compound cannot be created.
  function createCompoundTest(id, compoundType) {
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
    });
  }

  function deleteElesTest(selector) {
    QUnit.test('chise.deleteElesSimple()', function (assert) {
      chise.deleteElesSimple(cy.elements(selector));
      assert.equal(cy.elements(selector).length, 0, "Delete simple operation is successful");
    });
  }

  function hideElesTest(selector) {
    QUnit.test('chise.hideNodesSmart()', function (assert) {
      var nodes = cy.nodes(selector);
      var allNodes = cy.nodes().filter(':visible');
      var nodesToShow = chise.elementUtilities.extendRemainingNodes(nodes, allNodes).nodes();

      chise.hideNodesSmart(nodes);
      assert.equal(cy.nodes().filter(':visible').length, nodesToShow.length, "Hide operation is successful");
    });
  }

  function showAllElesTest() {
    QUnit.test('chise.showAll()', function (assert) {
      chise.showAll();
      assert.equal(cy.nodes().length, cy.nodes(':visible').length, "Show all operation is successful");
    });
  }

  function highlightNeighboursTest (selector) {
    QUnit.test('chise.highlightNeighbours()', function (assert) {
      var node = cy.nodes(selector);
      var elesToHighlight = chise.elementUtilities.getNeighboursOfNodes(node);
      chise.highlightNeighbours(node);
      assert.equal(elesToHighlight.filter('.highlighted').length, elesToHighlight.length, "Highlight neighbours operation is successful");
    });
  }

  function removeHighlightsTest () {
    QUnit.test('chise.removeHighlights()', function (assert) {
      chise.removeHighlights();
      assert.equal(cy.elements('.highlighted').length, 0, "Remove highlights operation is successful");
    });
  }

  function highlightProcessesTest (selector) {
    QUnit.test('chise.highlightProcesses()', function (assert) {
      var nodes = cy.nodes(selector);
      var elesToHighlight = chise.elementUtilities.extendNodeList(nodes);
      chise.highlightProcesses(nodes);
      assert.equal(elesToHighlight.filter('.highlighted').length, elesToHighlight.length, "Highlight processes operation is successful");
    });
  }

  function changeNodeLabelTest(selector) {
    QUnit.test('chise.changeNodeLabel()', function (assert) {
      var nodes = cy.nodes(selector);
      chise.changeNodeLabel(nodes, 'test label');
      assert.equal(nodes.filter('[label="test label"]').length, nodes.length, "Change node label operation is successful");
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
    });
  }

  function changeDataTest (selector, name, testVal, parseFloatOnCompare) {
      QUnit.test('chise.changeData()', function (assert) {
        var nodes = cy.nodes(selector);
        nodes.unselect(); // Unselect the nodes because node selection affects some style properties like border color
        chise.changeData(nodes, name, testVal);

        var evalByParseOpt = function(val) {
          if (parseFloatOnCompare) {
            return parseFloat(val);
          }
          return val;
        }

        var dataUpdated = nodes.filter(function(node) {
          return evalByParseOpt(node.data(name)) === testVal;
        });

        var styleUpdated = nodes.filter(function(node) {
          return evalByParseOpt(node.css(name)) === testVal;
        });

        assert.equal(dataUpdated.length, nodes.length, "Change " + name + " operation is successfully changed element data");
        assert.equal(styleUpdated.length, nodes.length, "Change " + name + " operation is successfully changed element style");
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

  chise.resetMapType(); // Reset the map type to unknown to allow adding AF elements

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

  createCompoundTest('pdNode2', 'complex');
  cloneElementsTest();
  expandCollapseTest(':parent');
  deleteElesTest('#pdNodeO');
  hideElesTest('#pdNode1');
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
};
