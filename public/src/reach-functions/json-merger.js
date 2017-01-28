/** The json-merger module merges two JSON models into one. Such a process requires the consistency of the node ids. The strategy of the action lies in the comparison only of the edges between the two jsons, such that nodes which do not take part in an edge are not considered and may or not appear in the result of the merge. This last point needs to be revised in a potential update. The implementation is below.
 **/

//Author: David Servillo.

<<<<<<< HEAD
//Date of the last change: 01/26/2016.
=======
<<<<<<< HEAD
//Date of the last change: 12/23/2016.
=======
//Date of the last change: 10/12/2016.
>>>>>>> 6df15a1588f092441f40f0d6d6f04e474682dfe6
>>>>>>> 24250badecd26fb7577b71b470eda7fe2cbefac3

module.exports = {

    //Merge two JSON models.
    merge: function(json1, json2) {
        var jsonToMerge;
        var nodepositions1 = {};
        var container1 = {};
        var i;

		//Store the positions of the node ids of the first json.
        for(i=0; i<json1.nodes.length; i++)
            nodepositions1[json1.nodes[i].data.id] = i;

<<<<<<< HEAD
=======
            jsnString1 = jsnString1.replace(new RegExp('"glyph'+(j+1)+'"', "g"), '');
            jsnString1 = jsnString1.replace(new RegExp('"'+json1.nodes[i-json2.nodes.length].data.id+'"', "g"), '"glyph'+(j+1)+'"');
            jsnString1 = jsnString1.replace(new RegExp(':,"', "g"), ':"'+json1.nodes[i-json2.nodes.length].data.id+'","');
            jsnString1 = jsnString1.replace(new RegExp(':}', "g"), ':"'+json1.nodes[i-json2.nodes.length].data.id+'"}');

            jsnString1 = jsnString1.replace(new RegExp('"glyph'+(j+1)+'-', "g"), '"-');
            jsnString1 = jsnString1.replace(new RegExp('"'+json1.nodes[i-json2.nodes.length].data.id+'-', "g"), '"glyph'+(j+1)+'-');
            jsnString1 = jsnString1.replace(new RegExp(':"-', "g"), ':"'+json1.nodes[i-json2.nodes.length].data.id+'-');

            jsnString1 = jsnString1.replace(new RegExp('-glyph'+(j+1)+'"', "g"), '-');
            jsnString1 = jsnString1.replace(new RegExp('-'+json1.nodes[i-json2.nodes.length].data.id+'"', "g"), '-glyph'+(j+1)+'"');
            jsnString1 = jsnString1.replace(new RegExp('-,"', "g"), '-'+json1.nodes[i-json2.nodes.length].data.id+'","');

            json1 = JSON.parse(jsnString1);
        }

>>>>>>> 6df15a1588f092441f40f0d6d6f04e474682dfe6
        jsonToMerge = JSON.parse(JSON.stringify(json1));

        //Identify and store the container nodes, which are nodes able to contain other nodes in it.
        //Store the content of the containers as well.
        for(i=0; i<json1.nodes.length; i++) {
            if(json1.nodes[i].data.parent != "") {
                if(container1[json1.nodes[i].data.parent] === undefined)
                    container1[json1.nodes[i].data.parent] = [json1.nodes[i].data.id];
                else
                    container1[json1.nodes[i].data.parent].push(json1.nodes[i].data.id);
            }
        }

        var j = -1;
<<<<<<< HEAD
=======
        var edgepositions1 = {};
        var outcompsource1 = {};
        var outcomptarget1 = {};
        //Identify the nodes in containers and which connect to other nodes out of the containers.
        //Store their neighbors as well.
        for(i=0; i< json1.edges.length; i++) {
            edgepositions1[json1.edges[i].data.id] = i;
            if(json1.nodes[nodepositions1[json1.edges[i].data.source]].data.parent != "" && json1.nodes[nodepositions1[json1.edges[i].data.target]].data.parent == "") {
                if(outcompsource1[json1.edges[i].data.source] === undefined)
                    outcompsource1[json1.edges[i].data.source] = [json1.edges[i].data.target];
                else
                    outcompsource1[json1.edges[i].data.source].push(json1.edges[i].data.target);
            }
            if(json1.nodes[nodepositions1[json1.edges[i].data.target]].data.parent != "" && json1.nodes[nodepositions1[json1.edges[i].data.source]].data.parent == "") {
                if(outcomptarget1[json1.edges[i].data.target] === undefined)
                    outcomptarget1[json1.edges[i].data.target] = [json1.edges[i].data.source];
                else
                    outcomptarget1[json1.edges[i].data.target].push(json1.edges[i].data.source);
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the source is the container and the target the neighbors.
        outcompsourcekeys = Object.keys(outcompsource1);
        for(i=0; i<outcompsourcekeys.length; i++) {
            for(j=0; j<outcompsource1[outcompsourcekeys[i]].length; j++) {
                json1.edges.push({});
                json1.edges[json1.edges.length - 1].data = {};
                json1.edges[json1.edges.length - 1].data.id = json1.nodes[nodepositions1[outcompsourcekeys[i]]].data.parent+'-'+json1.nodes[nodepositions1[outcompsource1[outcompsourcekeys[i]][j]]].data.id;
                json1.edges[json1.edges.length - 1].data.bendPointPositions = [];
                json1.edges[json1.edges.length - 1].data.sbgncardinality = 0;
                json1.edges[json1.edges.length - 1].data.source = json1.nodes[nodepositions1[outcompsourcekeys[i]]].data.parent;
                json1.edges[json1.edges.length - 1].data.target = json1.nodes[nodepositions1[outcompsource1[outcompsourcekeys[i]][j]]].data.id;
                json1.edges[json1.edges.length - 1].data.portsource = json1.edges[json1.edges.length - 1].data.source;
                json1.edges[json1.edges.length - 1].data.porttarget = json1.edges[json1.edges.length - 1].data.target;
                json1.edges[json1.edges.length - 1].data.toBeRemoved = "";
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the target is the container and the source the neighbors.
        outcomptargetkeys = Object.keys(outcomptarget1);
        for(i=0; i<outcomptargetkeys.length; i++) {
            for(j=0; j<outcomptarget1[outcomptargetkeys[i]].length; j++) {
                json1.edges.push({});
                json1.edges[json1.edges.length - 1].data = {};
                json1.edges[json1.edges.length - 1].data.id = json1.nodes[nodepositions1[outcomptarget1[outcomptargetkeys[i]][j]]].data.id+'-'+json1.nodes[nodepositions1[outcomptargetkeys[i]]].data.parent;
                json1.edges[json1.edges.length - 1].data.bendPointPositions = [];
                json1.edges[json1.edges.length - 1].data.sbgncardinality = 0;
                json1.edges[json1.edges.length - 1].data.source = json1.nodes[nodepositions1[outcomptarget1[outcomptargetkeys[i]][j]]].data.id;
                json1.edges[json1.edges.length - 1].data.target = json1.nodes[nodepositions1[outcomptargetkeys[i]]].data.parent;
                json1.edges[json1.edges.length - 1].data.portsource = json1.edges[json1.edges.length - 1].data.source;
                json1.edges[json1.edges.length - 1].data.porttarget = json1.edges[json1.edges.length - 1].data.target;
                json1.edges[json1.edges.length - 1].data.toBeRemoved = "";
            }
        }

<<<<<<< HEAD
>>>>>>> 24250badecd26fb7577b71b470eda7fe2cbefac3
        var jsnString2 = JSON.stringify(json2);
        var maxj = json1.nodes.length;
        var nodepositions2 = {};
        var container2 = {};
        //Rename the identifiers under the form glyphN where N is an integer. The identifiers between the two jsons
        //are consistent so no identifiers is repeated.
        for(i=0; i<json2.nodes.length; i++) {
            maxj = maxj + 1;
            nodepositions2["glyph"+maxj] = i; //Store the position of the node ids in the json.

            jsnString2 = jsnString2.replace(new RegExp('"glyph'+maxj+'"', "g"), '');
            jsnString2 = jsnString2.replace(new RegExp('"'+json2.nodes[i].data.id+'"', "g"), '"glyph'+maxj+'"');
            jsnString2 = jsnString2.replace(new RegExp(':,"', "g"), ':"'+json2.nodes[i].data.id+'","');
            jsnString2 = jsnString2.replace(new RegExp(':}', "g"), ':"'+json2.nodes[i].data.id+'"}');

            jsnString2 = jsnString2.replace(new RegExp('"glyph'+maxj+'-', "g"), '"-');
            jsnString2 = jsnString2.replace(new RegExp('"'+json2.nodes[i].data.id+'-', "g"), '"glyph'+maxj+'-');
            jsnString2 = jsnString2.replace(new RegExp(':"-', "g"), ':"'+json2.nodes[i].data.id+'-');

            jsnString2 = jsnString2.replace(new RegExp('-glyph'+maxj+'"', "g"), '-');
            jsnString2 = jsnString2.replace(new RegExp('-'+json2.nodes[i].data.id+'"', "g"), '-glyph'+maxj+'"');
            jsnString2 = jsnString2.replace(new RegExp('-,"', "g"), '-'+json2.nodes[i].data.id+'","');

            json2 = JSON.parse(jsnString2);
        }

        //Identify and store the container nodes, which are nodes able to contain other nodes in it.
        //Store the content of the containers as well.
        for(i=0; i<json2.nodes.length; i++) {
            if(json2.nodes[i].data.parent != "") {
                if(container2[json2.nodes[i].data.parent] === undefined)
                    container2[json2.nodes[i].data.parent] = [json2.nodes[i].data.id];
                else
                    container2[json2.nodes[i].data.parent].push(json2.nodes[i].data.id);
            }
        }

<<<<<<< HEAD
=======
        var edgepositions2 = {};
        var outcompsource2 = {};
        var outcomptarget2 = {};
        //Identify the nodes in containers and which connect to other nodes out of the containers.
        //Store their neighbors as well.
        for(i=0; i< json2.edges.length; i++) {
            edgepositions2[json2.edges[i].data.id] = i;
            if(json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent != "" && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent == "") {
                if(outcompsource2[json2.edges[i].data.source] === undefined)
                    outcompsource2[json2.edges[i].data.source] = [json2.edges[i].data.target];
                else
                    outcompsource2[json2.edges[i].data.source].push(json2.edges[i].data.target);
            }
            if(json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent != "" && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent == "") {
                if(outcomptarget2[json2.edges[i].data.target] === undefined)
                    outcomptarget2[json2.edges[i].data.target] = [json2.edges[i].data.source];
                else
                    outcomptarget2[json2.edges[i].data.target].push(json2.edges[i].data.source);
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the source is the container and the target the neighbors.
        outcompsourcekeys = Object.keys(outcompsource2);
        for(i=0; i<outcompsourcekeys.length; i++) {
            for(j=0; j<outcompsource2[outcompsourcekeys[i]].length; j++) {
                json2.edges.push({});
                json2.edges[json2.edges.length - 1].data = {};
                json2.edges[json2.edges.length - 1].data.id = json2.nodes[nodepositions2[outcompsourcekeys[i]]].data.parent+'-'+json2.nodes[nodepositions2[outcompsource2[outcompsourcekeys[i]][j]]].data.id;
                json2.edges[json2.edges.length - 1].data.bendPointPositions = [];
                json2.edges[json2.edges.length - 1].data.sbgncardinality = 0;
                json2.edges[json2.edges.length - 1].data.source = json2.nodes[nodepositions2[outcompsourcekeys[i]]].data.parent;
                json2.edges[json2.edges.length - 1].data.target = json2.nodes[nodepositions2[outcompsource2[outcompsourcekeys[i]][j]]].data.id;
                json2.edges[json2.edges.length - 1].data.portsource = json2.edges[json2.edges.length - 1].data.source;
                json2.edges[json2.edges.length - 1].data.porttarget = json2.edges[json2.edges.length - 1].data.target;
                json2.edges[json2.edges.length - 1].data.toBeRemoved = "";
            }
        }

        //Create an edge between the container and its content's neighbors lying outside of the container.
        //This will be useful in the comparison step, as it only compares edges
        //and thus can't compare lonely nodes not involved in an edge (like a compartment).
        //Here, the target is the container and the source the neighbors.
        outcomptargetkeys = Object.keys(outcomptarget2);
        for(i=0; i<outcomptargetkeys.length; i++) {
            for(j=0; j<outcomptarget2[outcomptargetkeys[i]].length; j++) {
                json2.edges.push({});
                json2.edges[json2.edges.length - 1].data = {};
                json2.edges[json2.edges.length - 1].data.id = json2.nodes[nodepositions2[outcomptarget2[outcomptargetkeys[i]][j]]].data.id+'-'+json2.nodes[nodepositions2[outcomptargetkeys[i]]].data.parent;
                json2.edges[json2.edges.length - 1].data.bendPointPositions = [];
                json2.edges[json2.edges.length - 1].data.sbgncardinality = 0;
                json2.edges[json2.edges.length - 1].data.source = json2.nodes[nodepositions2[outcomptarget2[outcomptargetkeys[i]][j]]].data.id;
                json2.edges[json2.edges.length - 1].data.target = json2.nodes[nodepositions2[outcomptargetkeys[i]]].data.parent;
                json2.edges[json2.edges.length - 1].data.portsource = json2.edges[json2.edges.length - 1].data.source;
                json2.edges[json2.edges.length - 1].data.porttarget = json2.edges[json2.edges.length - 1].data.target;
                json2.edges[json2.edges.length - 1].data.toBeRemoved = "";
            }
        }
=======
        //var tmp;
        ////json1 has too be the bigger than json2.
        //if(json2.nodes.length > json1.nodes.length) {
        //    tmp = JSON.stringify(json2);
        //    json2 = JSON.parse(JSON.stringify(json1));
        //    json1 = JSON.parse(tmp);

          //  tmp = JSON.stringify(nodepositions2);
          //  nodepositions2 = JSON.parse(JSON.stringify(nodepositions1));
          //  nodepositions1 = JSON.parse(tmp);

            //tmp = JSON.stringify(container2);
            //container2 = JSON.parse(JSON.stringify(container1));
            //container1 = JSON.parse(tmp);

            //tmp = JSON.stringify(outcompsource2);
            //outcompsource2 = JSON.parse(JSON.stringify(outcompsource2));
            //outcompsource1 = JSON.parse(tmp);

            //tmp = JSON.stringify(outcomptarget2);
            //outcomptarget2 = JSON.parse(JSON.stringify(outcomptarget2));
            //outcomptarget1 = JSON.parse(tmp);
       // }
>>>>>>> 6df15a1588f092441f40f0d6d6f04e474682dfe6

>>>>>>> 24250badecd26fb7577b71b470eda7fe2cbefac3
        var jsn = {"nodes": [], "edges": []};

        jsn.nodes = jsn.nodes.concat(JSON.parse(JSON.stringify(json1)).nodes);
        jsn.edges = jsn.edges.concat(JSON.parse(JSON.stringify(json1)).edges);

//******************************************************************************************
//										Caution !
//
//Start of the comparison step: it compares the edges (source, target and type of interaction)
//of json2 with the biggest one.
//When a match is found the edge of json2 is not added in the final one.
//******************************************************************************************

        var found1;
        var found2;
        var found4;
        var found5;
		var matches = 0;
        var match1;
        var match2;
        var backward1;
        var backward2;
        var sharednodes = [];

        for(i=0; i<json2.edges.length; i++) {
            found1 = json1.edges.length + 1;
            found2 = 2*(json1.edges.length + 1);
            found4 = 0;
            found5 = 0;
            match1 = found1;
            match2 = found2;
            j = 0;
            while((match1 != match2 || backward1 || backward2) && j<json1.edges.length) {
                backward1 = 1;
                backward2 = 1;

//********************************************************************************
//source: is there the same source node in the other json ?
//********************************************************************************

                //The source of the edge in json2 is a container and has a label.
                if(container2[json2.edges[i].data.source] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found1 = j + 1;
                        match1 = found1;
                        backward1 = 0;
                    }
                    //The source of the edge in json2 is a container and has no label.
                } else if(container2[json2.edges[i].data.source] !== undefined && container1[json1.edges[j].data.source] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.edges[i].data.source, json1.edges[j].data.source, nodepositions2, nodepositions1, container2, container1)) {
                        found1 = j + 1;
                        match1 = found1;
                        backward1 = 0;
                    }
                    //The container in which lies the source of the edge in json2 has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel != "null" && json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent != "") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent = json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent;  //The container is found.
                        if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                            found1 = j + 1;
                            match1 = found1;
                            backward1 = 0;
                        }
                    }
                    //The container in which lies the source of the edge in json2 and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && container1[json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent, json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent, nodepositions2, nodepositions1, container2, container1)) {
                        found1 = edgepositions1[json1.edges[j].data.id] + 1;
                        match1 = found1;
                        backward1 = 0;
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found1 = j + 1;
                        match1 = found1;
                        backward1 = 0;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel == "null") {
                            found1 = 0;
                        }
                    }
                }

//********************************************************************************
//target: is there the same target node in the other json ?
//********************************************************************************

                //The target of the edge in json2 is a container and has a label.
                if(container2[json2.edges[i].data.target] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found2 = j + 1;
                        match2 = found2;
                        backward2 = 0;
                    }
                    //The target of the edge in json2 is a container and has no label.
                } else if(container2[json2.edges[i].data.target] !== undefined && container1[json1.edges[j].data.target] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.edges[i].data.target, json1.edges[j].data.target, nodepositions2, nodepositions1, container2, container1)) {
                        found2 = j + 1;
                        match2 = found2;
                        backward2 = 0;
                    }
                    //The container in which lies the target of the edge in json2 has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel != "null" && json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent != "") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent = json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent;  //The container is found.
                        if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                            found2 = j + 1;
                            match2 = found2;
                            backward2 = 0;
                        }
                    }
                    //The container in which lies the target of the edge in json2 and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && container1[json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent, json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent, nodepositions2, nodepositions1, container2, container1)) {
                        found2 = edgepositions1[json1.edges[j].data.id] + 1;
                        match2 = found2;
                        backward2 = 0;
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found2 = j + 1;
                        match2 = found2;
                        backward2 = 0;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel == "null") {
                            found2 = 0;
                        }
                    }
                }

//********************************************************************************
//source: is there the same node (as a target this time !) in the other json ?
//********************************************************************************

                //The source of the edge in json2 is a container and has a label.
                if(container2[json2.edges[i].data.source] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found4 = j + 1;
                        match1 = found4;
                        backward1 = 1;
                    }
                    //The source of the edge in json2 is a container and has no label.
                } else if(container2[json2.edges[i].data.source] !== undefined && container1[json1.edges[j].data.target] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.edges[i].data.source, json1.edges[j].data.target, nodepositions2, nodepositions1, container2, container1)) {
                        found4 = j + 1;
                        match1 = found4;
                        backward1 = 1;
                    }
                    //The container in which lies the source of the edge in json2 has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]].data.sbgnlabel != "null" && json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent != "") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent = json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent;  //The container is found.
                        if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                            found4 = j + 1;
                            match1 = found4;
                            backward1 = 1;
                        }
                    }
                    //The container in which lies the source of the edge in json2 and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent] !== undefined && container1[json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.nodes[nodepositions2[json2.edges[i].data.source]].data.parent, json1.nodes[nodepositions1[json1.edges[j].data.target]].data.parent, nodepositions2, nodepositions1, container2, container1)) {
                        found4 = edgepositions1[json1.edges[j].data.id] + 1;
                        match1 = found4;
                        backward1 = 1;
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found4 = j + 1;
                        match1 = found4;
                        backward1 = 1;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.source]].data.sbgnlabel == "null") {
                            found4 = 0;
                        }
                    }
                }

//********************************************************************************
//target: is there the same node (as a source this time !) in the other json ?
//********************************************************************************

                //The target of the edge in json2 is a container and has a label.
                if(container2[json2.edges[i].data.target] !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel != "null") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found5 = j + 1;
                        match2 = found5;
                        backward2 = 1;
                    }
                    //The target of the edge in json2 is a container and has no label.
                } else if(container2[json2.edges[i].data.target] !== undefined && container1[json1.edges[j].data.source] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.edges[i].data.target, json1.edges[j].data.source, nodepositions2, nodepositions1, container2, container1)) {
                        found5 = j + 1;
                        match2 = found5;
                        backward2 = 1;
                    }
                    //The container in which lies the target of the edge in json2 has a label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel !== undefined && json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]].data.sbgnlabel != "null" && json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent != "") {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent = json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent; //The container is found.
                        if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                            found5 = j + 1;
                            match2 = found5;
                            backward2 = 1;
                        }
                    }
                    //The container in which lies the target of the edge in json2 and has no label.
                } else if(container2[json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent] !== undefined && container1[json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent] !== undefined) {
                    //Compare the two containers.
                    if(this.sameInnerNodes(json2, json1, json2.nodes[nodepositions2[json2.edges[i].data.target]].data.parent, json1.nodes[nodepositions1[json1.edges[j].data.source]].data.parent, nodepositions2, nodepositions1, container2, container1)) {
                        found5 = edgepositions1[json1.edges[j].data.id] + 1;
                        match2 = found5;
                        backward2 = 1;
                    }
                    //The node is a regular node, without a container.
                } else {
                    if(JSON.stringify(json2.nodes[nodepositions2[json2.edges[i].data.target]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(json1.nodes[nodepositions1[json1.edges[j].data.source]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                        found5 = j + 1;
                        match2 = found5;
                        backward2 = 1;
                        if(json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel === undefined || json2.nodes[nodepositions2[json2.edges[i].data.target]].data.sbgnlabel == "null") {
                            found5 = 0;
                        }
                    }
                }

                j = j + 1;
            }

//******************************************************************************************
//End of the comparison step.
//******************************************************************************************

            //The target node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) != 0 && found2%(json1.edges.length + 1) == 0 && !found4 && !found5) {
                //The node may be a container with multiple sub-levels of containers in it.
                this.addInnerNodes(json2, jsn, container2, nodepositions2, json2.edges[i].data.target);

                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found1 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found1 - 1].data.portsource;

                sharednodes.push(json1.edges[found1 - 1].data.source);
            }

            //The source node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) != 0 && !found4 && !found5) {
                //The node may be a container with multiple sub-levels of containers in it.
                this.addInnerNodes(json2, jsn, container2, nodepositions2, json2.edges[i].data.source);

                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found2 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found2 - 1].data.porttarget;

                sharednodes.push(json1.edges[found2 - 1].data.target);
            }

            //The target node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) == 0 && found4 && !found5) {
                //The node may be a container with multiple sub-levels of containers in it.
                this.addInnerNodes(json2, jsn, container2, nodepositions2, json2.edges[i].data.target);

                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found4 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found4 - 1].data.porttarget;

                sharednodes.push(json1.edges[found4 - 1].data.target);
            }

            //The source node is not in json1, then add it to the final json.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) == 0 && !found4 && found5) {
                //The node may be a container with multiple sub-levels of containers in it.
                this.addInnerNodes(json2, jsn, container2, nodepositions2, json2.edges[i].data.source);

                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found5 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found5 - 1].data.portsource;

                sharednodes.push(json1.edges[found5 - 1].data.source);
            }

            //Neither the target node nor the source node are in json1, then add all the edge.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) == 0 && !found4 & !found5) {
                //The node may be a container with multiple sub-levels of containers in it.
                this.addInnerNodes(json2, jsn, container2, nodepositions2, json2.edges[i].data.source);

                //The node may be a container with multiple sub-levels of containers in it.
                this.addInnerNodes(json2, jsn, container2, nodepositions2, json2.edges[i].data.target);

                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
            }

            //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            if(found1%(json1.edges.length + 1) != 0 && found2%(json1.edges.length + 1) != 0) {
                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found1 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found1 - 1].data.portsource;

                sharednodes.push(json1.edges[found1 - 1].data.source);

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found2 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found2 - 1].data.porttarget;

                sharednodes.push(json1.edges[found2 - 1].data.target);

                //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            } else if(found4 && found5) {
                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found4 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found4 - 1].data.porttarget;

                sharednodes.push(json1.edges[found4 - 1].data.target);

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found5 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found5 - 1].data.portsource;

                sharednodes.push(json1.edges[found5 - 1].data.source);
            }

            //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            if(found1%(json1.edges.length + 1) != 0 && found2%(json1.edges.length + 1) == 0 && !found4 && found5) {
                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found1 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found1 - 1].data.portsource;

                sharednodes.push(json1.edges[found1 - 1].data.source);

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found5 - 1].data.source;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found5 - 1].data.portsource;

                sharednodes.push(json1.edges[found5 - 1].data.source);
            }

            //Both the target node and the source node are in json1. Only add the interaction type of the edge.
            if(found1%(json1.edges.length + 1) == 0 && found2%(json1.edges.length + 1) != 0 && found4 && !found5) {
                jsn.edges.push(JSON.parse(JSON.stringify(json2.edges[i])));
                jsn.edges[jsn.edges.length - 1].data.source = json1.edges[found4 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.portsource = json1.edges[found4 - 1].data.porttarget;

                sharednodes.push(json1.edges[found4 - 1].data.target);

                jsn.edges[jsn.edges.length - 1].data.target = json1.edges[found2 - 1].data.target;
                jsn.edges[jsn.edges.length - 1].data.porttarget = json1.edges[found2 - 1].data.porttarget;

                sharednodes.push(json1.edges[found2 - 1].data.target);
            }
<<<<<<< HEAD
=======
        }

        //Some edges were created for the comparison step. They are useless now.
        for(i=0; i<jsn.edges.length; i++) {
            if("toBeRemoved" in jsn.edges[i].data) {
                jsn.edges.splice(i, 1);
                i = i - 1;
            }
        }

        for(i=0; i<json1.edges.length; i++) {  //Remove the useless edges.
            if("toBeRemoved" in json1.edges[i].data) {
                json1.edges.splice(i, 1);
                i = i - 1;
<<<<<<< HEAD
            }
        }

        var whichJsn = {jsn1:[], jsn2:[]};
        for(i=0; i<json1.nodes.length; i++)
            whichJsn.jsn1.push(json1.nodes[i].data.id);
>>>>>>> 24250badecd26fb7577b71b470eda7fe2cbefac3

			if(match1 == match2 && json1.edges[match1 - 1].data.sbgnclass == json2.edges[i].data.sbgnclass)
				matches = matches + 1;
        }

<<<<<<< HEAD
		if(matches != json2.edges.length) {
	        //Some edges were created for the comparison step. They are useless now.
	        for(i=0; i<jsn.edges.length; i++) {
    	        if("toBeRemoved" in jsn.edges[i].data) {
        	        jsn.edges.splice(i, 1);
            	    i = i - 1;
	            }
    	    }

			//Remove the useless edges form json1.
    	    for(i=0; i<json1.edges.length; i++) {
        	    if("toBeRemoved" in json1.edges[i].data) {
            	    json1.edges.splice(i, 1);
                	i = i - 1;
	            }
    	    }

	        var whichJsn = {jsn1:[], jsn2:[]};

			//Store the ids of json1.
    	    for(i=0; i<json1.nodes.length; i++)
    	        whichJsn.jsn1.push(json1.nodes[i].data.id);

			//Adding the nodes of the second json in json1.
    	    if(json1.nodes.length < jsn.nodes.length) {
        	    for(i=json1.nodes.length; i<jsn.nodes.length; i++) {
            	    json1.nodes.push(jsn.nodes[i]);
                	whichJsn.jsn2.push(jsn.nodes[i].data.id);  //Store the ids of json2.
	            }
    	    }

	        for(i=0; i<sharednodes.length; i++)
    	        whichJsn.jsn2.push(sharednodes[i]);

	        whichJsn.jsn2.sort();

			//Adding the edges of the second json in json1.
    	    if(json1.edges.length < jsn.edges.length) {
        	    for(i=json1.edges.length; i<jsn.edges.length; i++)
            	    json1.edges.push(jsn.edges[i]);
	        }
		} else {
	        var whichJsn = {jsn1:[], jsn2:[]};

			//Store the ids of json1.
    	    for(i=0; i<json1.nodes.length; i++)
    	        whichJsn.jsn1.push(json1.nodes[i].data.id);
		}
=======
        for(i=0; i<sharednodes.length; i++)
            whichJsn.jsn2.push(sharednodes[i]);

        whichJsn.jsn2.sort();

        if(json1.edges.length < jsn.edges.length) {
            for(i=json1.edges.length; i<jsn.edges.length; i++)
                json1.edges.push(jsn.edges[i]);
        }
=======
            }
        }

		if(json1.nodes.length < jsn.nodes.length) {
			var json1nodeslength = json1.nodes.length;
			for(i=json1nodeslength; i<jsn.nodes.length; i++)
				json1.nodes.push(jsn.nodes[i]);
		}

		if(json1.edges.length < jsn.edges.length) {
			var json1edgeslength = json1.edges.length;
			for(i=json1edgeslength; i<jsn.edges.length; i++)
				json1.edges.push(jsn.edges[i]);
		}

        //There were only matches. json2 is useless, only json1 becomes the final json.
        if(matches == json2.edges.length)
            jsn = json1;
>>>>>>> 6df15a1588f092441f40f0d6d6f04e474682dfe6
>>>>>>> 24250badecd26fb7577b71b470eda7fe2cbefac3

        return {wholeJson: json1, jsonToMerge: jsonToMerge, whichJsn: whichJsn};
    },

    //Add sub-levels nodes and containers into the final json.
    addInnerNodes: function(primary, final, containerOf, positionOf, glyphId) {
        if(containerOf[glyphId] !== undefined) {
            var i;
            for(i=0; i<containerOf[glyphId].length; i++)
                this.addInnerNodes(primary, final, containerOf, positionOf, containerOf[glyphId][i]);
        }

        final.nodes.push(JSON.parse(JSON.stringify(primary.nodes[positionOf[glyphId]])));
    },

    //Compare sub-levels node in containers between the two jsons.
    sameInnerNodes: function(jsn1, jsn2, node1, node2, pos1, pos2, cont1, cont2) {
        var count = 0;
        var result = 0;
        if(cont1[node1] !== undefined && cont2[node2] !== undefined) {
            if(cont1[node1].length == cont2[node2].length) {
                for(k=0; k<cont1[node1].length; k++) {
                    for(l=0; l<cont2[node2].length; l++) {
                        if(JSON.stringify(jsn1.nodes[pos1[cont1[node1][k]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(jsn2.nodes[pos2[cont2[node2][l]]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("")) {
                            count = count + 1;
                        }
                    }
                }

                if(count >= cont1[node1].length) {
                    for(i=0; i<cont1[node1].length; i++)
                        result = this.sameInnerNodes(jsn1, jsn2, cont1[node1][i], cont2[node2][i], pos1, pos2, cont1, cont2);
                }
            }
        } else {
            if(JSON.stringify(jsn1.nodes[pos1[node1]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join("") == JSON.stringify(jsn2.nodes[pos2[node2]]).replace(new RegExp('"id":"[^"]+"', 'g'), '').replace(new RegExp('"[sbgn]*bbox":{[^}]+}', 'g'), '').replace(new RegExp('"parent":"[^"]+"'), '').replace(new RegExp(',', 'g'), '').split("").sort().join(""))
                result = 1;
        }
        return result;
    }
}
