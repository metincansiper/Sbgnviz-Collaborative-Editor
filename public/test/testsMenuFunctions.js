QUnit = require('qunitjs');
jsonmerger = require('../src/reach-functions/json-merger.js');
module.exports = function(){


    QUnit.module( "Menu functions tests to see if model is updated correctly." );

    function addNodeFromMenuTest(id) {
        QUnit.test('menu.addNode()', function (assert) {

            MenuFunctions.addNode(id, 50, 70, "macromolecule", "nodeLabel", true);

            var modelNode = ModelManager.getModelNode(id);
            assert.ok(modelNode, "Node added to model through menu.")
            assert.equal(modelNode.id, 1000, "Node id correctly added.");
            assert.equal(modelNode.sbgnclass, "macromolecule", "Node sbgnclass correctly added.");
            assert.equal(modelNode.sbgnlabel, "nodeLabel", "Node label correctly added.");
            assert.equal(modelNode.position.x, 50, "Node position x correctly added.");
            assert.equal(modelNode.position.y, 70, "Node position y correctly added.");
            
        });
    }



    function deleteNodeFromMenuTest(id) {
        QUnit.test('menu.deleteNode()', function(assert) {
            MenuFunctions.deleteElement(1000, true);

            assert.equal(ModelManager.getModelNode(id), null, "Node deleted correctly.");
        });
    };



    QUnit.module( "Editor-actions tests to see if model is updated correctly." );

    var synchronizationManager = require('./synchronizationManager.js');
    function addNodeFromEditorActionsTest() {

        QUnit.test('synchronizationManager.addNode()', function (assert) {

            var node = synchronizationManager.addNode({x:50, y:70, sbgnclass:"macromolecule", sync: true});

            var modelNode = ModelManager.getModelNode(node.id());
            assert.ok(modelNode, "Node added to model through synchronizationManager.")
            assert.equal(modelNode.id, node.id(), "Node id correctly added.");
            assert.equal(modelNode.sbgnclass, "macromolecule", "Node sbgnclass correctly added.");
            assert.equal(modelNode.position.x, 50, "Node position x correctly added.");
            assert.equal(modelNode.position.y, 70, "Node position y correctly added.");



            //initialized
            assert.equal(modelNode.sbgnclass, node.data('sbgnclass'), "Node sbgnclass correctly initialized.");
            assert.equal(modelNode.sbgnlabel, node.data('sbgnlabel'), "Node sbgnlabel correctly initialized.");
            assert.equal(modelNode.backgroundOpacity, node.data('backgroundOpacity'), "Node backgroundOpacity correctly initialized.");
            assert.equal(modelNode.backgroundColor, node.css('background-color'), "Node backgroundColor correctly initialized.");
            assert.equal(modelNode.borderColor, node.css('border-color'), "Node borderColor correctly initialized.");
            assert.equal(modelNode.borderWidth, node.css('border-width'), "Node borderWidth correctly initialized.");
            assert.equal(modelNode.isCloneMarker, node.data('sbgnclonemarker'), "Node isCloneMarker correctly initialized.");
            assert.equal(modelNode.sbgnStatesAndInfos.length, 0, "Node sbgnStatesAndInfos correctly initialized.");
            assert.equal(modelNode.parent, node.data('parent'), "Node parent correctly initialized.");
            assert.equal(modelNode.children, node.data('children'), "Node children correctly initialized.");
            assert.equal(modelNode.ports.length, 0, "Node ports correctly initialized.");
            assert.equal(modelNode.height, node._private.data.sbgnbbox.h, "Node height correctly initialized.");
            assert.equal(modelNode.width, node._private.data.sbgnbbox.w, "Node width correctly initialized.");


        });
    }
    
    function changeHighlightStatusTest(){
        
        QUnit.test('synchronizationManager.higlightSelected() for neighbors', function(assert){
            var param = {
                sync: true,
                selectedEles : cy.getElementById("glyph2"),
                highlightNeighboursofSelected: true
            };
            synchronizationManager.highlightSelected(param);

            //Not-highlighted nodes
            cy.nodes().forEach(function(node){
                if(node.id()!= "glyph2" && node.id()!= "glyph9") {
                    assert.equal(ModelManager.getModelNode(node.id()).highlightStatus, "notHighlighted", (node.id() + " highlighted correctly in model."));
                    assert.equal(node.hasClass("not-highlighted"), true, (node.id() + " highlighted correctly in cytoscape."));
                }
                else{
                    assert.equal(ModelManager.getModelNode(node.id()).highlightStatus, "highlighted", (node.id() + " highlighted correctly in model."));
                    assert.equal(node.hasClass("not-highlighted"), false, (node.id() + " highlighted correctly in cytoscape."));
                }
            });

            cy.edges().forEach(function(edge){
                if(edge.id()!= "ele10") {
                    assert.equal(ModelManager.getModelEdge(edge.id()).highlightStatus, "notHighlighted", (edge.id() + " highlighted correctly in model."));
                    assert.equal(edge.hasClass("not-highlighted"), true, (edge.id() + " highlighted correctly in cytoscape."));
                }
                else{
                    assert.equal(ModelManager.getModelEdge(edge.id()).highlightStatus, "highlighted", (edge.id() + " highlighted correctly in model."));
                    assert.equal(edge.hasClass("not-highlighted"), false, (edge.id() + " highlighted correctly in cytoscape."));

                }
            });

        });
        
        QUnit.test('synchronizationManager.removeHighlights()', function(assert){

            synchronizationManager.removeHighlights({sync:true});
        
            //Not-highlighted nodes
            cy.nodes().forEach(function(node){
                assert.equal(ModelManager.getModelNode(node.id()).highlightStatus, "highlighted", (node.id() + " highlighted correctly in model."));
                assert.equal(node.hasClass("not-highlighted"), false, (node.id() + " highlighted correctly in cytoscape."));

            });
        
            cy.edges().forEach(function(edge){
                assert.equal(ModelManager.getModelEdge(edge.id()).highlightStatus, "highlighted", (edge.id() + " highlighted correctly in model."));
                assert.equal(edge.hasClass("not-highlighted"), false, (edge.id() + " highlighted correctly in cytoscape."));


            });
        
        });


        QUnit.test('synchronizationManager.higlightSelected() for processes', function(assert){
            var param = {
                sync: true,
                selectedEles : cy.getElementById("glyph2"),
                highlightProcessesOfSelected: true
            };
            synchronizationManager.highlightSelected(param);


            cy.nodes().forEach(function(node){
                //Not-highlighted nodes
                if(node.id()!= "glyph2" && node.id()!= "glyph9" && node.id()!= "glyph0" && node.id()!= "glyph1" && node.id()!= "glyph10" && node.id()!= "glyph11" && node.id()!= "glyph12" && node.id()!= "glyph13") {
                    assert.equal(ModelManager.getModelNode(node.id()).highlightStatus, "notHighlighted", (node.id() + " highlighted correctly in model."));
                    assert.equal(node.hasClass("not-highlighted"), true, (node.id() + " highlighted correctly in cytoscape."));
                }
                else{ //highlighted nodes
                    assert.equal(ModelManager.getModelNode(node.id()).highlightStatus, "highlighted", (node.id() + " highlighted correctly in model."));
                    assert.equal(node.hasClass("not-highlighted"), false, (node.id() + " highlighted correctly in cytoscape."));
                }
            });

            cy.edges().forEach(function(edge){
                if(edge.id()!= "ele10" && edge.id()!= "ele9" && edge.id()!= "ele6") {
                    assert.equal(ModelManager.getModelEdge(edge.id()).highlightStatus, "notHighlighted", (edge.id() + " highlighted correctly in model."));
                    assert.equal(edge.hasClass("not-highlighted"), true, (edge.id() + " highlighted correctly in cytoscape."));
                }
                else{
                    assert.equal(ModelManager.getModelEdge(edge.id()).highlightStatus, "highlighted", (edge.id() + " highlighted correctly in model."));
                    assert.equal(edge.hasClass("not-highlighted"), false, (edge.id() + " highlighted correctly in cytoscape."));

                }
            });

       });


        QUnit.test('synchronizationManager.removeHighlights() again', function(assert){

            synchronizationManager.removeHighlights({sync:true});

            //Not-highlighted nodes
            cy.nodes().forEach(function(node){
                assert.equal(ModelManager.getModelNode(node.id()).highlightStatus, "highlighted", (node.id() + " highlighted correctly in model."));
                assert.equal(node.hasClass("not-highlighted"), false, (node.id() + " highlighted correctly in cytoscape."));

            });

            cy.edges().forEach(function(edge){
                assert.equal(ModelManager.getModelEdge(edge.id()).highlightStatus, "highlighted", (edge.id() + " highlighted correctly in model."));
                assert.equal(edge.hasClass("not-highlighted"), false, (edge.id() + " highlighted correctly in cytoscape."));


            });

        });

    }
    
    function changeVisibilityStatusTest(){
        QUnit.test('synchronizationManager.showSelected()', function(assert){
            var param = {
                sync: true,
                selectedEles : cy.getElementById("glyph2"),

            };
            synchronizationManager.showSelected(param);

            cy.nodes().forEach(function(node){
                //Visible nodes
                if(node.id()!= "glyph2" && node.id()!= "glyph9" && node.id()!= "glyph0" && node.id()!= "glyph1" && node.id()!= "glyph10" && node.id()!= "glyph11" && node.id()!= "glyph12" && node.id()!= "glyph13") {
                    assert.equal(ModelManager.getModelNode(node.id()).visibilityStatus, "invisible", (node.id() + " hidden correctly in model."));
                    assert.equal(node.visible(), false, (node.id() + " hidden correctly in cytoscape."));
                }
                else{ //hidden nodes
                    assert.equal(ModelManager.getModelNode(node.id()).visibilityStatus, "visible", (node.id() + " shown correctly in model."));
                    assert.equal(node.visible(), true, (node.id() + " shown correctly in cytoscape."));
                }
            });

        });

        QUnit.test('synchronizationManager.showAll()', function(assert){
            synchronizationManager.showAll({sync:true});

            cy.nodes().forEach(function(node){
                assert.equal(ModelManager.getModelNode(node.id()).visibilityStatus, "visible", (node.id() + " shown correctly in model."));
                assert.equal(node.visible(), true, (node.id() + " shown correctly in cytoscape."));

            });

        });

        QUnit.test('synchronizationManager.hideSelected()', function(assert){
            var param = {
                sync: true,
                selectedEles : cy.getElementById("glyph2"),

            };
            synchronizationManager.hideSelected(param);

            cy.nodes().forEach(function(node){
                //Hidden nodes
                if(node.id()!= "glyph2" && node.id()!= "glyph9" && node.id()!= "glyph0" && node.id()!= "glyph1" && node.id()!= "glyph10" && node.id()!= "glyph11" && node.id()!= "glyph12" && node.id()!= "glyph13") {
                    assert.equal(ModelManager.getModelNode(node.id()).visibilityStatus, "visible", (node.id() + " shown correctly in model."));
                    assert.equal(node.visible(), true, (node.id() + " shown correctly in cytoscape."));
                }
                else{ //visible nodes
                    assert.equal(ModelManager.getModelNode(node.id()).visibilityStatus, "invisible", (node.id() + " hidden correctly in model."));
                    assert.equal(node.visible(), false, (node.id() + " hidden correctly in cytoscape."));
                }
            });

        });

        QUnit.test('synchronizationManager.showAll() again', function(assert){
            synchronizationManager.showAll({sync:true});

            cy.nodes().forEach(function(node){
                assert.equal(ModelManager.getModelNode(node.id()).visibilityStatus, "visible", (node.id() + " shown correctly in model."));
                assert.equal(node.visible(), true, (node.id() + " shown correctly in cytoscape."));

            });

        });

    }

    QUnit.module( "Json merger tests to see if it actually merge correctly." );

    function jsonMergerTest() {
  		QUnit.test("json merger", function( assert ) {
  			function test(json1, json2, expected) {
				assert.equal(JSON.stringify(jsonmerger.merge(json1, json2).wholeJson), JSON.stringify(expected));
  			}
  			var weIntroduceANewMethod = {"nodes": [], "edges": []};
  			var MDM2phosphorylatesTP53 = {"nodes":[{"data":{"id":"ele01","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"MDM2"}},{"data":{"id":"ele03","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"TP53","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele06","clazz":"unit of information","label":{"text":"mt:prot"}},{"id":"ele07","clazz":"state variable","bbox":{"x":-27,"y":-27,"w":"53.0","h":"18.0"},"state":{"value":"P"}}],"parent":"","ports":[]}},{"data":{"id":"ele05","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"ele06","sbgnclass":"macromolecule","sbgnlabel":"TP53","sbgnstatesandinfos":[{"id":"ele08","clazz":"unit of information","label":{"text":"mt:prot"},"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"}}],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"parent":"","ports":[]}}],"edges":[{"data":{"id":"ele06-ele05","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"ele06","target":"ele05","portsource":"ele06","porttarget":"ele05"}},{"data":{"id":"ele05-ele03","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"ele05","target":"ele03","portsource":"ele05","porttarget":"ele03"}},{"data":{"id":"ele01-ele05","sbgnclass":"stimulation","bendPointPositions":[],"sbgncardinality":0,"source":"ele01","target":"ele05","portsource":"ele01","porttarget":"ele05"}}]};
	  		var SMAD3deactivatesRAC = {"nodes":[{"data":{"id":"ele01","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"SMAD3"}},{"data":{"id":"ele03","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"RAC","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele06","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[]}},{"data":{"id":"ele05","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"ele06","sbgnclass":"source and sink","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}}],"edges":[{"data":{"id":"ele06-ele05","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"ele06","target":"ele05","portsource":"ele06","porttarget":"ele05"}},{"data":{"id":"ele05-ele03","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"ele05","target":"ele03","portsource":"ele05","porttarget":"ele03"}},{"data":{"id":"ele01-ele05","sbgnclass":"inhibition","bendPointPositions":[],"sbgncardinality":0,"source":"ele01","target":"ele05","portsource":"ele01","porttarget":"ele05"}}]};
  			var MDM2deactivatesRAF = {"nodes":[{"data":{"id":"ele01","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"MDM2"}},{"data":{"id":"ele03","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"RAF","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele06","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[]}},{"data":{"id":"ele05","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"ele06","sbgnclass":"source and sink","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}}],"edges":[{"data":{"id":"ele06-ele05","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"ele06","target":"ele05","portsource":"ele06","porttarget":"ele05"}},{"data":{"id":"ele05-ele03","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"ele05","target":"ele03","portsource":"ele05","porttarget":"ele03"}},{"data":{"id":"ele01-ele05","sbgnclass":"inhibition","bendPointPositions":[],"sbgncardinality":0,"source":"ele01","target":"ele05","portsource":"ele01","porttarget":"ele05"}}]};
			var weIntroduceANewMethodMDM2phosphorylatesTP53 = {"nodes":[{"data":{"id":"glyph3","sbgnclass":"macromolecule","sbgnlabel":"TP53","sbgnstatesandinfos":[{"id":"ele08","clazz":"unit of information","label":{"text":"mt:prot"},"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"}}],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"parent":"","ports":[]}},{"data":{"id":"glyph3","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph3","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph2","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"TP53","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"glyph4","clazz":"unit of information","label":{"text":"mt:prot"}},{"id":"ele07","clazz":"state variable","bbox":{"x":-27,"y":-27,"w":"53.0","h":"18.0"},"state":{"value":"P"}}],"parent":"","ports":[]}},{"data":{"id":"glyph1","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"MDM2"}},{"data":{"id":"glyph3","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}}],"edges":[{"data":{"id":"glyph4-glyph3","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"glyph4","target":"glyph3","portsource":"glyph4","porttarget":"glyph3"}},{"data":{"id":"glyph3-glyph2","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"glyph3","target":"glyph2","portsource":"glyph3","porttarget":"glyph2"}},{"data":{"id":"glyph1-glyph3","sbgnclass":"stimulation","bendPointPositions":[],"sbgncardinality":0,"source":"glyph1","target":"glyph3","portsource":"glyph1","porttarget":"glyph3"}}]};
  			var SMAD3deactivatesRACMDM2deactivatesRAF = {"nodes":[{"data":{"id":"ele01","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"SMAD3"}},{"data":{"id":"ele03","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"RAC","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele06","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[]}},{"data":{"id":"ele05","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"ele06","sbgnclass":"source and sink","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph8","sbgnclass":"source and sink","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph7","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph7","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph6","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"RAF","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"glyph8","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[]}},{"data":{"id":"glyph5","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"MDM2"}},{"data":{"id":"glyph7","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}}],"edges":[{"data":{"id":"ele06-ele05","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"ele06","target":"ele05","portsource":"ele06","porttarget":"ele05"}},{"data":{"id":"ele05-ele03","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"ele05","target":"ele03","portsource":"ele05","porttarget":"ele03"}},{"data":{"id":"ele01-ele05","sbgnclass":"inhibition","bendPointPositions":[],"sbgncardinality":0,"source":"ele01","target":"ele05","portsource":"ele01","porttarget":"ele05"}},{"data":{"id":"glyph8-glyph7","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"glyph8","target":"glyph7","portsource":"glyph8","porttarget":"glyph7"}},{"data":{"id":"glyph7-glyph6","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"glyph7","target":"glyph6","portsource":"glyph7","porttarget":"glyph6"}},{"data":{"id":"glyph5-glyph7","sbgnclass":"inhibition","bendPointPositions":[],"sbgncardinality":0,"source":"glyph5","target":"glyph7","portsource":"glyph5","porttarget":"glyph7"}}]};
  			var MDM2phosphorylatesTP53MDM2deactivatesRAF = {"nodes":[{"data":{"id":"ele01","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele02","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[],"sbgnlabel":"MDM2"}},{"data":{"id":"ele03","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"TP53","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"ele06","clazz":"unit of information","label":{"text":"mt:prot"}},{"id":"ele07","clazz":"state variable","bbox":{"x":-27,"y":-27,"w":"53.0","h":"18.0"},"state":{"value":"P"}}],"parent":"","ports":[]}},{"data":{"id":"ele05","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"ele06","sbgnclass":"macromolecule","sbgnlabel":"TP53","sbgnstatesandinfos":[{"id":"ele08","clazz":"unit of information","label":{"text":"mt:prot"},"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"}}],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"parent":"","ports":[]}},{"data":{"id":"glyph8","sbgnclass":"source and sink","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph7","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph7","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}},{"data":{"id":"glyph6","sbgnclass":"macromolecule","sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"60.0","h":"60.0"},"sbgnlabel":"RAF","sbgnstatesandinfos":[{"bbox":{"x":-27.916666666666668,"y":-27.916666666666668,"w":"53.0","h":"18.0"},"id":"glyph8","clazz":"unit of information","label":{"text":"mt:prot"}}],"parent":"","ports":[]}},{"data":{"id":"glyph7","sbgnclass":"process","sbgnlabel":"null","sbgnstatesandinfos":[],"sbgnbbox":{"x":585.7398209991329,"y":585.7398209991329,"w":"20.0","h":"20.0"},"parent":"","ports":[]}}],"edges":[{"data":{"id":"ele06-ele05","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"ele06","target":"ele05","portsource":"ele06","porttarget":"ele05"}},{"data":{"id":"ele05-ele03","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"ele05","target":"ele03","portsource":"ele05","porttarget":"ele03"}},{"data":{"id":"ele01-ele05","sbgnclass":"stimulation","bendPointPositions":[],"sbgncardinality":0,"source":"ele01","target":"ele05","portsource":"ele01","porttarget":"ele05"}},{"data":{"id":"glyph8-glyph7","sbgnclass":"consumption","bendPointPositions":[],"sbgncardinality":0,"source":"glyph8","target":"glyph7","portsource":"glyph8","porttarget":"glyph7"}},{"data":{"id":"glyph7-glyph6","sbgnclass":"production","bendPointPositions":[],"sbgncardinality":0,"source":"glyph7","target":"glyph6","portsource":"glyph7","porttarget":"glyph6"}},{"data":{"id":"glyph5-glyph7","sbgnclass":"inhibition","bendPointPositions":[],"sbgncardinality":0,"source":"ele01","target":"glyph7","portsource":"ele01","porttarget":"glyph7"}}]};
  			//test: "We introduce a new method. MDM2 phosphorylates TP53."
  			test(weIntroduceANewMethod, MDM2phosphorylatesTP53, weIntroduceANewMethodMDM2phosphorylatesTP53);

  			//test: "SMAD3 deactivates RAC. MDM2 deactivates RAF."
  			test(SMAD3deactivatesRAC, MDM2deactivatesRAF, SMAD3deactivatesRACMDM2deactivatesRAF);

  			//test: "MDM2 phosphorylates TP53. MDM2 deactivates RAF."
  			test(MDM2phosphorylatesTP53, MDM2deactivatesRAF, MDM2phosphorylatesTP53MDM2deactivatesRAF);
  		})
	}

    addNodeFromMenuTest(1000);
    deleteNodeFromMenuTest(1000);
    addNodeFromEditorActionsTest();


   changeHighlightStatusTest();
   changeVisibilityStatusTest();

   jsonMergerTest();
};
