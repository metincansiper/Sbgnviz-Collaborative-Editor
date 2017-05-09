/** The idxcardjson-to-json-converter module translates an indexcard JSON from the Reach API into a JSON valid for SBGNviz. Its implementation is below.
**/

// Author: David Servillo.

//Date of the last change: 04/27/2017

module.exports = {

    //Create the SBGNviz-compatible JSON
    createJson: function(idxcardjsonObj) {
        var jsonObj = {};
        jsonObj.nodes = [];
        jsonObj.edges = [];

        var entityBbox = {
            "compartment": {x:0, y:0, w:60, h:60},
            "complex": {x:0, y:0, w:60, h:60},
            "macromolecule": {x:0, y:0, w:70, h:65},
            "process": {x:0, y:0, w:20, h:20},
            "source and sink": {x:0, y:0, w:30, h:30}
        };

        var statesandinfosbbox = {x:20, y:-6, w:40, h:12};
        var addmodifstatesandinfosbbox = {x:20, y:59, w:40, h:12};

        var stateInfos = {
            "acetylation": "Ac",
            "glycosylation": "G",
            "hydroxylation": "OH",
            "methylation": "Me",
            "myristoylation": "My",
            "palmytoylation": "Pa",
            "phosphorylation": "P",
            "prenylation": "Pr",
            "protonation": "H",
            "sulfation": "S",
            "sumoylation": "Su",
            "ubiquitination": "Ub"
        }

        var i;
        for(i=0; i<idxcardjsonObj.cards.length; i++) {

            //Create the first glyph
            var newNode0 = {
                data: {
                    id:"ele"+i+1,
                    sbgnclass: "macromolecule",
                    sbgnbbox: entityBbox.macromolecule,
                    sbgnstatesandinfos: [{bbox: statesandinfosbbox,
                        id: "ele"+i+2,
                        clazz: "unit of information",
                        label: {text:"mt:prot"}}],
                    parent: "",
                    ports: []
                }
            };

            if('participant_a' in idxcardjsonObj.cards[i].extracted_information)
                newNode0.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_a.entity_text;
            else {
                newNode0.data.sbgnlabel = "null";
                newNode0.data.sbgnclass = "source and sink";
				newNode0.data.sbgnstatesandinfos = [];
			}

            jsonObj.nodes.push(newNode0);

            //Create the second glyph
            var newNode1 = {
                data: {
                    id: "ele"+i+3,
                    sbgnclass: "macromolecule",
                    sbgnbbox: entityBbox.macromolecule,
                    sbgnlabel: idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text,
                    sbgnstatesandinfos: [{bbox: statesandinfosbbox,
                        id:"ele"+i+6,
                        clazz:"unit of information",
                        label:{text:"mt:prot"}}],
                    parent: "",
                    ports: []
                }
            };

            jsonObj.nodes.push(newNode1);

            //Create the third glyph
            var newNode2 = {
                data: {
                    id: "ele"+i+5,
                    sbgnclass: "process",
                    sbgnlabel: "null",
                    sbgnstatesandinfos: [],
                    sbgnbbox: entityBbox.process,
                    parent: "",
                    ports: []
                }
            };

            jsonObj.nodes.push(newNode2);

            //Create the fourth glyph
            var newNode3 = {
                data: {
                    id: "ele"+i+6,
                    sbgnclass: "source and sink",
                    sbgnlabel: "null",
                    sbgnstatesandinfos: [],
                    sbgnbbox: entityBbox.macromolecule,
                    parent: "",
                    ports: []
                }
            };

            jsonObj.nodes.push(newNode3);

            //Create the first arc
            var newEdge0 = {
                data: {
                    id: newNode3.data.id + "-" + newNode2.data.id,
                    sbgnclass: "consumption",
                    bendPointPositions: [],
                    sbgncardinality: 0,
                    source: newNode3.data.id,
                    target: newNode2.data.id,
                    portsource: newNode3.data.id,
                    porttarget: newNode2.data.id
                }
            };

            jsonObj.edges.push(newEdge0);

            //Create the second arc
            var newEdge1 = {
                data: {
                    id: newNode2.data.id + "-" + newNode1.data.id,
                    sbgnclass: "production",
                    bendPointPositions: [],
                    sbgncardinality: 0,
                    source: newNode2.data.id,
                    target: newNode1.data.id,
                    portsource: newNode2.data.id,
                    porttarget: newNode1.data.id
                }
            };

            jsonObj.edges.push(newEdge1);

            //Create the third arc
            var newEdge2 = {
                data: {
                    id: newNode0.data.id + "-" + newNode2.data.id,
                    sbgnclass: "consumption",
                    bendPointPositions: [],
                    sbgncardinality: 0,
                    source: newNode0.data.id,
                    target: newNode2.data.id,
                    portsource: newNode0.data.id,
                    porttarget: newNode2.data.id
                }
            };

            jsonObj.edges.push(newEdge2);

            if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "increases_activity")  //The interaction is a type of stimulation.
                newEdge2.data.sbgnclass = "stimulation";

            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "decreases_activity")  //The interaction is a type of inhibition.
                newEdge2.data.sbgnclass = "inhibition";

            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "binds") {  //The interaction is a binding.

                //The "source and sink" glyph is transformed into a macromolecular glyph
                newNode3.data.sbgnclass = "macromolecule";
                newNode3.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.sbgnbbox = entityBbox.macromolecule;
                newNode3.data.sbgnstatesandinfos.push({});
                newNode3.data.sbgnstatesandinfos[0].bbox = statesandinfosbbox;
                newNode3.data.sbgnstatesandinfos[0].id = "ele"+i+9;
                newNode3.data.sbgnstatesandinfos[0].clazz = "unit of information";
                newNode3.data.sbgnstatesandinfos[0].label = {};
                newNode3.data.sbgnstatesandinfos[0].label.text = "mt:prot";

                //The result of the reaction is a complex
                newNode1.data.sbgnclass = "complex";
                newNode1.data.sbgnbbox = entityBbox.complex;
                delete newNode1.data.sbgnlabel;
                newNode1.data.sbgnstatesandinfos = [];

                //First glyph in the complex
                var newNode4 = {
                    data: {
                        id:"ele"+i+10,
                        sbgnclass: "macromolecule",
                        sbgnbbox: entityBbox.macromolecule,
                        sbgnlabel: idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text,
                        sbgnstatesandinfos: [{bbox: statesandinfosbbox,
                            id:"ele"+i+4,
                            clazz: "unit of information",
                            label: {text:"mt:prot"}}],
                        parent: "ele"+i+3,
                        ports: []
                    }
                };

                jsonObj.nodes.push(newNode4);

                //Second glyph in the complex
                var newNode5 = {
                    data: {
                        id: "ele"+i+11,
                        sbgnclass: "macromolecule",
                        sbgnbbox: entityBbox.macromolecule,
                        sbgnstatesandinfos: [{bbox: statesandinfosbbox,
                            id: "ele"+i+12,
                            clazz: "unit of information",
                            label:{text:"mt:prot"}}],
                        sbgnlabel: newNode0.data.sbgnlabel,
                        parent: "ele"+i+3,
                        ports: []
                    }
                };

                jsonObj.nodes.push(newNode5);

                newNode2.data.sbgnclass = "association";

                newEdge2.data.sbgnclass = "consumption";
            }

            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "adds_modification") { //The interaction is a chemical modification
                newEdge2.data.sbgnclass = "stimulation";

                //That glyph is not a "source and sink" glyph anymore, but a macromolecule
                newNode3.data.sbgnclass = "macromolecule";
                newNode3.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.sbgnbbox = entityBbox.macromolecule;
                newNode3.data.sbgnstatesandinfos,push({});
                newNode3.data.sbgnstatesandinfos[0].id = "ele"+i+8;
                newNode3.data.sbgnstatesandinfos[0].clazz = "unit of information";
                newNode3.data.sbgnstatesandinfos[0].label = {};
                newNode3.data.sbgnstatesandinfos[0].label.text = "mt:prot";
                newNode3.data.sbgnstatesandinfos[0].bbox = statesandinfosbbox;
                newNode3.data.parent = "";
                newNode3.data.ports = [];

                var j;
                for(j=0; j<idxcardjsonObj.cards[i].extracted_information.modifications.length; j++) {
                    var newStateInfos = {
                        id: "ele"+i+7,
                        clazz: "state variable",
                        bbox: addmodifstatesandinfosbbox,
                        state: {value: stateInfos[idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type]}
                    };

                    newNode1.data.sbgnstatesandinfos.push(newStateInfos);
                }
            }
            else if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "translocates") {  //The interaction is a translocation

                //jsonObj.edges[3*i+2].data.sbgnclass = "consumption";

                //A second compartment
                if(idxcardjsonObj.cards[i].extracted_information.to_location_text !== undefined) {
                    var newNode4 = {
                        data: {
                            id:"ele"+i+10,
                            sbgnclass: "compartment",
                            sbgnbbox: entityBbox.compartment,
                            sbgnlabel: idxcardjsonObj.cards[i].extracted_information.to_location_text,
                            sbgnstatesandinfos: [],
                            parent: "",
                            ports: []
                        }
                    };

                    jsonObj.nodes.push(newNode4);

                    newNode1.data.parent = "ele"+i+10;
                }

                //The "source and sink" glyph is transformed into a macromolecule
                newNode3.data.sbgnclass = "macromolecule";
                newNode3.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.sbgnbbox = entityBbox.macromolecule;
                newNode3.data.sbgnstatesandinfos.push({});
                newNode3.data.sbgnstatesandinfos[0].bbox = statesandinfosbbox;
                newNode3.data.sbgnstatesandinfos[0].id = "ele"+i+9;
                newNode3.data.sbgnstatesandinfos[0].clazz = "unit of information";
                newNode3.data.sbgnstatesandinfos[0].label = {};
                newNode3.data.sbgnstatesandinfos[0].label.text = "mt:prot";

                //The first glyph is transformed into a compartment
                if(idxcardjsonObj.cards[i].extracted_information.from_location_text !== undefined) {
                    newNode0.sbgnclass = "compartment";
                    newNode0.sbgnstatesandinfos = [];
                    newNode0.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.from_location_text;
                    newNode0.sbgnbbox = entityBbox.compartment.bbox;

                    newNode3.data.parent = "ele"+i+1;
                } else {
                    newNode0.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                    newNode3 = {};
                    newEdge0 = {};
                }
            }
        }
        return jsonObj;
    }
};
