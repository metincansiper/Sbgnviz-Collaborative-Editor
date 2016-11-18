/** The idxcardjson-to-json-converter module translates an indexcard JSON from the Reach API into a JSON valid for SBGNviz. Its implementation is below.
 **/

// Author: David Servillo.

//Date of the last change: 08/18/2016

module.exports = {

    //Create the SBGNviz-compatible JSON
    createJson: function(idxcardjsonObj) {
        var jsonObj = {};
        jsonObj.nodes = [];
        jsonObj.edges = [];

        var i;
        for(i=0; i<idxcardjsonObj.cards.length; i++) {

            //Create the first glyph
			var newNode0 = {
				data: {
					id:"ele"+i+1,
					sbgnclass: "macromolecule",
					sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"60.0", h:"60.0"},
					sbgnstatesandinfos: [{bbox:{x:-27.916666666666668, y:-27.916666666666668, w:"53.0", h:"18.0"},
						id:"ele"+i+2,
						clazz:"unit of information",
						label:{text:"mt:prot"}}],
					parent: "",
					ports: []
				}
			};

            if('participant_a' in idxcardjsonObj.cards[i].extracted_information)
                newNode0.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_a.entity_text;
            else
                newNode0.data.sbgnlabel = "";

			jsonObj.nodes.push(newNode0);

            //Create the second glyph
			var newNode1 = {
				data: {
					id: "ele"+i+3,
					sbgnclass: "macromolecule",
					sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"60.0", h:"60.0"},
					sbgnlabel: idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text,
					sbgnstatesandinfos: [{bbox:{x:-27.916666666666668, y:-27.916666666666668, w:"53.0", h:"18.0"},
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
					sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"20.0", h:"20.0"},
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
					sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"20.0", h:"20.0"},
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
					sbgnclass: "consumption",
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

            if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "decreases_activity")  //The interaction is a type of inhibition.
                newEdge2.data.sbgnclass = "inhibition";

            if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "binds") {  //The interaction is a binding.

                //The "source and sink" glyph is transformed into a macromolecular glyph
                newNode3.data.sbgnclass = "macromolecule";
                newNode3.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.sbgnbbox.w = "60.0";
                newNode3.data.sbgnbbox.h = "60.0";
                newNode3.data.sbgnstatesandinfos[0] = {};
                newNode3.data.sbgnstatesandinfos[0].bbox = {};
                newNode3.data.sbgnstatesandinfos[0].bbox.x = -27.916666666666668;
                newNode3.data.sbgnstatesandinfos[0].bbox.y = -27.916666666666668;
                newNode3.data.sbgnstatesandinfos[0].bbox.w = "53.0";
                newNode3.data.sbgnstatesandinfos[0].bbox.h = "18.0";
                newNode3.data.sbgnstatesandinfos[0].id = "ele"+i+9;
                newNode3.data.sbgnstatesandinfos[0].clazz = "unit of information";
                newNode3.data.sbgnstatesandinfos[0].label = {};
                newNode3.data.sbgnstatesandinfos[0].label.text = "mt:prot";

                //The result of the reaction is a complex
                newNode1.data.sbgnclass = "complex";
                newNode1.data.sbgnbbox = {};
                newNode1.data.sbgnbbox.x = 585.7398209991329;
                newNode1.data.sbgnbbox.y = 585.7398209991329;
                newNode1.data.sbgnbbox.w = "60.0";
                newNode1.data.sbgnbbox.h = "60.0";
                delete newNode1.data.sbgnlabel;
                newNode1.data.sbgnstatesandinfos = [];

                //First glyph in the complex
				var newNode4 = {
					data: {
						id:"ele"+i+10,
						sbgnclass: "macromolecule",
						sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"60.0", h:"60.0"},
						sbgnlabel: idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text,
						sbgnstatesandinfos: [{bbox:{x:-27.916666666666668, y:-27.916666666666668, w:"53.0", h:"18.0"},
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
						sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"60.0", h:"60.0"},
						sbgnstatesandinfos: [{bbox:{x:-27.916666666666668, y:-27.916666666666668, w:"53.0", h:"18.0"},
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

            if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "adds_modification") { //The interaction is a chemical modification
                newEdge2.data.sbgnclass = "stimulation";

                //That glyph is not a "source and sink" glyph anymore, but a macromolecule
                newNode3.data.sbgnclass = "macromolecule";
                newNode3.data.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.participant_b.entity_text;
                newNode3.data.sbgnbbox.w = "60.0";
                newNode3.data.sbgnbbox.h = "60.0";
                newNode3.data.sbgnstatesandinfos[0] = {};
                newNode3.data.sbgnstatesandinfos[0].id = "ele"+i+8;
                newNode3.data.sbgnstatesandinfos[0].clazz = "unit of information";
                newNode3.data.sbgnstatesandinfos[0].label = {};
                newNode3.data.sbgnstatesandinfos[0].label.text = "mt:prot";
                newNode3.data.sbgnstatesandinfos[0].bbox = {};
                newNode3.data.sbgnstatesandinfos[0].bbox.x = -27.916666666666668;
                newNode3.data.sbgnstatesandinfos[0].bbox.y = -27.916666666666668;
                newNode3.data.sbgnstatesandinfos[0].bbox.w = "53.0";
                newNode3.data.sbgnstatesandinfos[0].bbox.h = "18.0";
                newNode3.data.parent = "";
                newNode3.data.ports = [];

                var j;
                for(j=0; j<idxcardjsonObj.cards[i].extracted_information.modifications.length; j++) {
					var newStateInfos = {
						id: "ele"+i+7,
						clazz: "state variable",
						bbox: {x:-27.0, y:-27.0 , w:"53.0",h: "18.0"},
					};

                    //Add a state variable resulting from the interaction
                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "acetylation") //The interaction is an acetylation
						newStateInfos.state = {value: "Ac"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "glycosylation") //The interaction is a glycosylation
						newStateInfos.state = {value: "G"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "hydroxylation") //The interaction is a hydroxylation
						newStateInfos.state = {value: "OH"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "methylation") //The interaction is a methylation
						newStateInfos.state = {value: "Me"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "myristoylation") //The interaction is a myristoylation
						newStateInfos.state = {value: "My"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "palmytoylation") //The interaction is a palmytoylation
						newStateInfos.state = {value: "Pa"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "phosphorylation") //The interaction is a phosphorylation
						newStateInfos.state = {value: "P"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "prenylation") //The interaction is a prenylation
						newStateInfos.state = {value: "Pr"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "protonation") //The interaction is a protonation
						newStateInfos.state = {value: "H"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "sulfation") //The interaction is a sulfation
						newStateInfos.state = {value: "S"};

                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "sumoylation") //The interaction is a sumoylation
						newStateInfos.state = {value: "Su"};
 
                    if(idxcardjsonObj.cards[i].extracted_information.modifications[j].modification_type == "ubiquitination") //The interaction is a ubiquitination
						newStateInfos.state = {value: "Ub"};

					newNode1.data.sbgnstatesandinfos.push(newStateInfos);
                }
            }
            if(idxcardjsonObj.cards[i].extracted_information.interaction_type == "translocates") {  //The interaction is a translocation

                //jsonObj.edges[3*i+2].data.sbgnclass = "consumption";

                //A second compartment
                if(idxcardjsonObj.cards[i].extracted_information.to_location_text !== undefined) {
					var newNode4 = {
						data: {
							id:"ele"+i+10,
							sbgnclass: "compartment",
							sbgnbbox: {x:585.7398209991329, y:585.7398209991329, w:"120.0", h:"120.0"},
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
                newNode3.data.sbgnbbox.w = "60.0";
                newNode3.data.sbgnbbox.h = "60.0";
                newNode3.data.sbgnstatesandinfos[0] = {};
                newNode3.data.sbgnstatesandinfos[0].bbox = {};
                newNode3.data.sbgnstatesandinfos[0].bbox.x = -27.916666666666668;
                newNode3.data.sbgnstatesandinfos[0].bbox.y = -27.916666666666668;
                newNode3.data.sbgnstatesandinfos[0].bbox.w = "53.0";
                newNode3.data.sbgnstatesandinfos[0].bbox.h = "18.0";
                newNode3.data.sbgnstatesandinfos[0].id = "ele"+i+9;
                newNode3.data.sbgnstatesandinfos[0].clazz = "unit of information";
                newNode3.data.sbgnstatesandinfos[0].label = {};
                newNode3.data.sbgnstatesandinfos[0].label.text = "mt:prot";

                //The first glyph is transformed into a compartment
                if(idxcardjsonObj.cards[i].extracted_information.from_location_text !== undefined) {
                    newNode0.sbgnclass = "compartment";
                    newNode0.sbgnstatesandinfos = [];
                    newNode0.sbgnlabel = idxcardjsonObj.cards[i].extracted_information.from_location_text;
                    newNode0.sbgnbbox.w = "120.0";
                    newNode0.sbgnbbox.h = "120.0";

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
