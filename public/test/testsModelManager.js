QUnit = require('qunitjs');
module.exports = function(){


    QUnit.module( "modelManager Tests" );

    QUnit.test('modelManager.setName()', function(assert) {
        ModelManager.setName("abc");
          assert.equal(ModelManager.getName(), "abc", "User name is correctly set.");
    });


    //Node is not initialized here
    function addModelNodeTest(id){
        QUnit.test('modelManager.addModelNode()', function(assert) {
            // assert.notOk(cy.getElementById(id),"Node already existing");


            ModelManager.addModelNode(id, {x: 100, y: 200, class: "macromolecule" });


            assert.ok(cy.getElementById(id),"Node added to cytoscape");
            assert.equal(ModelManager.getModelNode(id).data.id, cy.getElementById(id).id() , "Node is equal in model and cytoscape");

            assert.equal(cy.getElementById(id)._private.data.class, "macromolecule", "Node class is correct.");
            assert.equal(cy.getElementById(id)._private.data.class, ModelManager.getModelNode(id).data.class, "Node class is equal in model and cytoscape.");


            assert.equal(cy.getElementById(id)._private.position.x, 100, "Node position x is correct.");
            assert.equal(cy.getElementById(id).position().x, ModelManager.getModelNode(id).position.x, "Node position x is equal in model and cytoscape.");

            assert.equal(cy.getElementById(id)._private.position.y, 200, "Node position y is correct.");
            assert.equal(cy.getElementById(id).position().y, ModelManager.getModelNode(id).position.y, "Node position y is equal in model and cytoscape.");

        });
    }

    function initModelNodeTest(id){
        QUnit.test('modelManager.initNode()', function(assert) {

            ModelManager.initModelNode(cy.getElementById(id));

            var node = cy.getElementById(id);
            var modelNode = ModelManager.getModelNode(id);

            for(var att in modelNode.data){
                assert.propEqual(modelNode.data[att], node.data(att), "Model node " + att + " correctly initialized.");
            }

            for(var att in node.data){
                assert.propEqual(node.data(att), modelNode.data[att], "Cy node " + att + " correctly initialized.");
            }


        });
    }

    function addModelEdgeTest(id1, id2, firstTime){
        QUnit.test('modelManager.addModelEdge()', function(assert) {


            var id = (id1 + "-"+ id2);
            ModelManager.addModelEdge(id, {source: id1, target: id2, class: "consumption"});

            var modelEdge = ModelManager.getModelEdge(id);
            var edge = cy.getElementById(id);
            assert.ok(edge,"Edge added to cytoscape");

            for(var att in modelEdge.data){
                assert.propEqual(modelEdge.data[att], edge.data(att), "Model edge " + att + " correctly added.");
            }

            for(var att in edge.data){
                assert.propEqual(edge.data(att), modelEdge.data[att], "Cy edge " + att + " correctly added.");
            }

        });
    }

    function initModelEdgeTest(id) {
        QUnit.test('modelManager.initEdge()', function (assert) {

            ModelManager.initModelEdge(cy.getElementById(id));

            var edge = cy.getElementById(id);
            var modelEdge = ModelManager.getModelEdge(id);

            for(var att in modelEdge.data){
                assert.propEqual(modelEdge.data[att], edge.data(att), "Model edge" + att + " correctly initialized.");
            }

            for(var att in edge.data) {
                assert.propEqual(edge.data(att), modelEdge.data[att], "Cy edge" + att + " correctly initialized.");
            }




        });
    }

    function deleteModelNodeTest(id){
        QUnit.test('modelManager.deleteModelNode()', function(assert){
            ModelManager.deleteModelNode(id);
            assert.equal(ModelManager.getModelNode(id), null, "Node removed from model.");
            assert.equal(cy.getElementById(id).length,0, "Node removed from cytoscape.");

        });
    }

    function deleteModelEdgeTest(id){
        QUnit.test('modelManager.deleteModelEdge()', function(assert){
            ModelManager.deleteModelEdge(id);
            assert.equal(ModelManager.getModelEdge(id), null, "Edge removed from model.");
            assert.equal(cy.getElementById(id).length,0, "Edge removed from cytoscape.");

        });
    }



    function selectModelNodeTest(id){
        QUnit.test('modelManager.selectModelNode()', function(assert){
            var node = cy.getElementById(id);
            ModelManager.selectModelNode(node);
            assert.equal(node.css('overlay-color'), ModelManager.getModelNode(id).highlightColor, "Node correctly selected.");
        });
    }
    function unselectModelNodeTest(id){
        QUnit.test('modelManager.unselectModelNode()', function(assert){
            var node = cy.getElementById(id);
            ModelManager.unselectModelNode(node);
            assert.equal(ModelManager.getModelNode(id).highlightColor, null, "Node correctly unselected.");
            // console.log(node.css('overlay-color'));
            // assert.equal(node.css('overlay-color'), null, "Cytoscape backgroundColor correctly reverted.");
        });
    }

    function selectModelEdgeTest(id){
        QUnit.test('modelManager.selectModelEdge()', function(assert){
            var edge = cy.getElementById(id);
            ModelManager.selectModelEdge(edge);
            assert.equal(edge.css('overlay-color'), ModelManager.getModelEdge(id).highlightColor, "Edge correctly selected.");
        });
    }

    function unselectModelEdgeTest(id){
        QUnit.test('modelManager.unselectModelEdge()', function(assert){
            var edge = cy.getElementById(id);
            ModelManager.unselectModelEdge(edge);
            // assert.equal(edge.css('overlay-color'), null, "Cytoscape lineColor correctly reverted.");
            assert.equal(ModelManager.getModelEdge(id).highlightColor, null, "Edge correctly unselected.");
        });
    }


    function changeModelNodeAttributeTest(id){
        QUnit.test('modelManager.changeModelNodeAttribute()', function(assert) {
            
            ModelManager.changeModelNodeAttribute("position", id, {x: 300, y: 400});
            assert.equal(300, cy.getElementById(id).position().x,  "Node position x is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).position.x,cy.getElementById(id).position().x,  "Node position x is equal in model and cytoscape.");


            assert.equal(400, cy.getElementById(id).position().y,  "Node position y is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).position.y, cy.getElementById(id).position().y,  "Node position y is equal in model and cytoscape.");



            ModelManager.changeModelNodeAttribute("data.class", id, "phenotype");
            assert.equal("phenotype", cy.getElementById(id).data('class'),  "Node class is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data.class, cy.getElementById(id).data('class'),  "Node class is equal in model and cytoscape.");

            ModelManager.changeModelNodeAttribute("data.label", id, "label2");
            assert.equal("label2", cy.getElementById(id).data('label'),  "Node label is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data.label, cy.getElementById(id).data('label'),  "Node label is equal in model and cytoscape..");

            ModelManager.changeModelNodeAttribute("data.background-opacity", id, 1);
            assert.equal(1, cy.getElementById(id).data('background-opacity'),  "Node backgroundOpacity is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data["background-opacity"], cy.getElementById(id).data('background-opacity'),  "Node backgroundOpacity is equal in model and cytoscape..");

            ModelManager.changeModelNodeAttribute("data.background-color", id, '#333343');
            assert.equal('#333343', cy.getElementById(id).data('background-color'), "Node backgroundColor is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data["background-color"], cy.getElementById(id).data('background-color'), "Node backgroundColor is equal in model and cytoscape..");

            ModelManager.changeModelNodeAttribute("data.border-color", id, '#222222');
            assert.equal('#222222', cy.getElementById(id).data('border-color'), "Node borderColor is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data["border-color"], cy.getElementById(id).data('border-color'), "Node borderColor is equal in model and cytoscape..");

            ModelManager.changeModelNodeAttribute("data.border-width", id, "3px");
            assert.equal("3px", cy.getElementById(id).data('border-width'), "Node borderWidth is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data["border-width"], cy.getElementById(id).data('border-width'), "Node borderWidth is equal in model and cytoscape..");

            ModelManager.changeModelNodeAttribute("data.clonemarker", id, true);
            assert.equal(true, cy.getElementById(id).data('clonemarker'), "Node isCloneMarker is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data.clonemarker, cy.getElementById(id).data('clonemarker'), "Node isCloneMarker is equal in model and cytoscape..");

            //TODO
            // ModelManager.changeModelNodeAttribute("data.statesandinfos", id, [{clazz:"unit of information", label:{text:"uoi"}}]);
            // assert.deepEqual("unit of information", cy.getElementById(id).data('statesandinfos')[0].clazz, "Node statesandinfos are correct in cytoscape.");
            // assert.deepEqual(ModelManager.getModelNode(id).data.statesandinfos, cy.getElementById(id).data('statesandinfos'), "Node statesandinfos are equal in model and cytoscape..");
            // //
            // ModelManager.changeModelNodeAttribute("data.parent", id, "glyph2");
            // assert.equal("glyph2", cy.getElementById(id).data('parent'), "Node parent is correct in cytoscape.");
            // assert.equal(ModelManager.getModelNode(id).data.parent, cy.getElementById(id).data('parent'), "Node parent is equal in model and cytoscape..");


            // ModelManager.changeModelNodeAttribute("children", id, ["glyph3"]);
            // assert.equal("glyph3", cy.getElementById(id)._private.children[0].id(), "Node children are correct in cytoscape.");
            // assert.equal(ModelManager.getModelNode(id).children[0], cy.getElementById(id)._private.children[0].id(), "Node children are equal in model and cytoscape..");

            // ModelManager.changeModelNodeAttribute("data.ports", id, ["glyph4"]);
            // assert.equal(ModelManager.getModelNode(id).data.ports[0], cy.getElementById(id).data('ports')[0], "Node ports are correct in cytoscape.");
            // assert.equal(ModelManager.getModelNode(id).data.ports[0], cy.getElementById(id).data('ports')[0], "Node ports are equal in model and cytoscape..");


            ModelManager.changeModelNodeAttribute("data.bbox.h", id, 4);
            assert.equal(4, cy.getElementById(id)._private.data.bbox.h, "Node height is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data.bbox.h, cy.getElementById(id)._private.data.bbox.h, "Node height is equal in model and cytoscape..");

            console.log(cy.getElementById(id)._private.data.bbox);
            ModelManager.changeModelNodeAttribute("data.bbox.w", id, 5);
            assert.equal(5, cy.getElementById(id)._private.data.bbox.w, "Node width is correct in cytoscape.");
            assert.equal(ModelManager.getModelNode(id).data.bbox.w, cy.getElementById(id)._private.data.bbox.w, "Node width is equal in model and cytoscape..");


        });
    }



    function changeModelEdgeAttributeTest(id){
        QUnit.test('modelManager.changeModelEdgeAttribute()', function(assert){
            ModelManager.changeModelEdgeAttribute("data.class", id, "catalysis");
            assert.equal("catalysis", cy.getElementById(id).data('class'),  "Edge class is correct in cytoscape.");
            assert.equal(ModelManager.getModelEdge(id).data.class, cy.getElementById(id).data('class'),  "Edge class is equal in model and cytoscape.");

            //TODO Cannot change this directly
            // ModelManager.changeModelEdgeAttribute("data.source", id, "glyph8");
            // assert.equal("glyph8", cy.getElementById(id).data("source"),  "Edge source is correct in cytoscape.");
            // assert.equal(ModelManager.getModelEdge(id).data.source, cy.getElementById(id).data("source"),  "Edge source is equal in model and cytoscape.");
            //
            // ModelManager.changeModelEdgeAttribute("data.target", id, "glyph16");
            // assert.equal("glyph16", cy.getElementById(id)._private.data.target,  "Edge target is correct in cytoscape.");
            // assert.equal(ModelManager.getModelEdge(id).data.target, cy.getElementById(id)._private.data.target,  "Edge target is equal in model and cytoscape.");
            //
            // ModelManager.changeModelEdgeAttribute("data.source", id, "glyph9");
            // assert.equal("glyph9", cy.getElementById(id).data("source"),  "Edge source is correct in cytoscape.");
            // assert.equal(ModelManager.getModelEdge(id).data.source, cy.getElementById(id).data("source"),  "Edge source is equal in model and cytoscape.");
            //
            // ModelManager.changeModelEdgeAttribute("data.target", id, "glyph15");
            // assert.equal("glyph15", cy.getElementById(id)._private.data.target,  "Edge target is correct in cytoscape.");
            // assert.equal(ModelManager.getModelEdge(id).data.target, cy.getElementById(id)._private.data.target,  "Edge target is equal in model and cytoscape.");



            ModelManager.changeModelEdgeAttribute("data.cardinality", id, 5);
            assert.equal(5, cy.getElementById(id)._private.data.cardinality,  "Edge cardinality is correct in cytoscape.");
            assert.equal(ModelManager.getModelEdge(id).data.cardinality, cy.getElementById(id)._private.data.cardinality,  "Edge cardinality is equal in model and cytoscape.");

            ModelManager.changeModelEdgeAttribute("data.portsource", id, "glyph8");
            assert.equal("glyph8", cy.getElementById(id).data('portsource'),  "Edge portsource is correct in cytoscape.");
            assert.equal(ModelManager.getModelEdge(id).data.portsource, cy.getElementById(id).data('portsource'),  "Edge portsource is equal in model and cytoscape.");

            ModelManager.changeModelEdgeAttribute("data.porttarget", id, "glyph16");
            assert.equal("glyph16", cy.getElementById(id).data('porttarget'),  "Edge porttarget is correct in cytoscape.");
            assert.equal(ModelManager.getModelEdge(id).data.porttarget, cy.getElementById(id).data('porttarget'),  "Edge porttarget is equal in model and cytoscape.");


            ModelManager.changeModelEdgeAttribute("data.line-color", id, "#411515");
            assert.equal("#411515", cy.getElementById(id).data("line-color"),  "Edge lineColor is correct in cytoscape.");
            assert.equal(ModelManager.getModelEdge(id).data["line-color"], cy.getElementById(id).data("line-color"),  "Edge lineColor is equal in model and cytoscape.");

            ModelManager.changeModelEdgeAttribute("data.width", id, "8px");
            assert.equal("8px", cy.getElementById(id).data("width"),  "Edge width is correct in cytoscape.");
            assert.equal(ModelManager.getModelEdge(id).data.width, cy.getElementById(id).data("width"),  "Edge width is equal in model and cytoscape.");

            //
            // ModelManager.changeModelEdgeAttribute("databendPointPositions", id, [{x: 300, y: 400}]);
            // assert.equal(300, cy.getElementById(id)._private.data.bendPointPositions[0].x,  "Edge bendPointPositions are correct in cytoscape.");
            // assert.equal(ModelManager.getModelEdge(id).databendPointPositions[0].x,cy.getElementById(id)._private.data.bendPointPositions[0].x,  "Edge bendPointPositions are equal in model and cytoscape.");


        });
    }

    setTimeout(function() {
        addModelNodeTest(1000);
    }, 100);
    // addModelNodeTest(1000); //already added
    setTimeout(function() {
        initModelNodeTest(1000);
    },100);
    setTimeout(function() {
        selectModelNodeTest(1000);
    },100);
    setTimeout(function() {
     unselectModelNodeTest(1000);
    },100);
    //
    setTimeout(function() {
     changeModelNodeAttributeTest(1000);
    },100);
    setTimeout(function() {
        deleteModelNodeTest(1000);
    },100);

    // deleteModelNodeTest(1000); //already deleted
    //
    setTimeout(function() {
        addModelEdgeTest("glyph9", "glyph15");
    },100);
    // addModelEdgeTest("glyph2", "glyph6"); //already added
    setTimeout(function() {
        initModelEdgeTest("glyph9-glyph15");
    },100);
    setTimeout(function() {
        selectModelEdgeTest("glyph9-glyph15");
    },100);
    setTimeout(function() {
        unselectModelEdgeTest("glyph9-glyph15");
    },100);
    setTimeout(function() {
        changeModelEdgeAttributeTest(("glyph9-glyph15"));
    },100);
    setTimeout(function() {
        deleteModelEdgeTest("glyph9-glyph15");
    },100);
    // deleteModelEdgeTest("glyph9-glyph15"); //already deleted





};