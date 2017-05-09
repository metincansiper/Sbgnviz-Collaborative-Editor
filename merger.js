//Traverse the graph with the cytoscape library.
//Return the visited nodes in an order that reflects
//the chronology in which they were visited.
//The resulting array is called the rephrase.
var traverseGraph = function (node, visitedNodes) {
    // break if we visit a node twice
    if (visitedNodes.map(visitedNodes => visitedNodes.id()).includes(node.id())) {
        visitedNodes.push(node);
        return visitedNodes;
    }

    // add visited node to collection
    visitedNodes.push(node);

    // select node
    node.select();

    // get the edges leaving the node
    const edgesTo = node.outgoers(function () {
        return this.isEdge();
    });

    // get the edges entering the node
    const edgesFrom = node.incomers(function () {
        return this.isEdge();
    });

    var i = 0;
    var previousVisitedNodesLength;

    // travel through the edges leaving the node
    edgesTo.forEach(edge => {
        edge.select();
        if (!visitedNodes.map(visitedNodes => visitedNodes.id()).includes(edge.id())) {
            i += 1;
            if(i > 1)
                visitedNodes.push(node);

            visitedNodes.push(edge);
            
            previousVisitedNodesLength = visitedNodes.length;
            traverseGraph(edge.target(), visitedNodes);
            if((visitedNodes.length == previousVisitedNodesLength) && (i > 1))
                visitedNodes.pop();
        }
    });

    // travel through the edges entering the node
    edgesFrom.forEach(edge => {
        edge.select();
        if (!visitedNodes.map(visitedNodes => visitedNodes.id()).includes(edge.id())) {
            i += 1;
            if(i > 1)
                visitedNodes.push(node);

            visitedNodes.push(edge);

            previousVisitedNodesLength = visitedNodes.length;
            traverseGraph(edge.source(), visitedNodes);
            if((visitedNodes.length == previousVisitedNodesLength) && (i > 1))
                visitedNodes.pop();
        }
    });

    return visitedNodes;
};

// Make sure the sources of the edges are placed before and
// the targets after the edges in the rephrase.
var rearrangeRephrase = function(rephrase, intermedprioritynodes) {
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isEdge() && rephrase[i].source().id() != rephrase[i - 1].id()) {
            //Duplicate the nodes around the edge.
            rephrase.splice(i - 1, 0, rephrase[i - 1]);
            rephrase.splice(i + 2, 0, rephrase[i + 2]);

            tmp = rephrase[i + 2];
            rephrase[i + 2] = rephrase[i];
            rephrase[i] = tmp;
        }
    }
}

// When two nodes in the rephrase are the same but the ids differ
// make the two nodes exactly (they point to the same cytoscape object).
var mergeNodes = function(rephrase, intermedprioritynodes) {
    var i;
    var signature;
    var nonredundantnodes = {};
    for(i = 0; i < rephrase.length; i++) {
        signature = descString(rephrase[i].descendants()) + rephrase[i].data('sbgnlabel') + rephrase[i].data('sbgnclass') + rephrase[i].data('parent');
        if(rephrase[i].data('sbgnstatesandinfos') != undefined && rephrase[i].data('sbgnstatesandinfos').length > 0) {
            rephrase[i].data('sbgnstatesandinfos').forEach(box => {
                signature += box.clazz + JSON.stringify(box.label);
            });
        }

        if(rephrase[i].isNode() && intermedprioritynodes[rephrase[i].data('sbgnclass')] == undefined && signature in nonredundantnodes) {
            rephrase[i] = nonredundantnodes[signature];
        } else if(rephrase[i].isNode() && intermedprioritynodes[rephrase[i].data('sbgnclass')] == undefined)
            nonredundantnodes[signature] = rephrase[i];
    }
}

// Divide the rephrase in triplets of node-edge-node and identify
// the process nodes that have the same set of triplet as neighbors
// (i.e. the reactions that have the same inputs and outputs).
// Among the duplicates, select only one of them.
var mergeProcessNodes = function(rephrase, intermedprioritynodes) {
    var i;
    var key;
    var processid;
    var signature;
    var idsbysignature = {};
    var signaturesbyid = {};
    var tripletsbyprocid = {};
    var triplet = new Array(3);
    var triplet2 = new Array(3);
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            processid = triplet[0].id();
            if(intermedprioritynodes[triplet[2].data('sbgnclass')])
                processid = triplet[2].id();

            if(tripletsbyprocid[processid] == undefined)
                tripletsbyprocid[processid] = [];

            tripletsbyprocid[processid].push(triplet);
        }
    }

    Object.keys(tripletsbyprocid).forEach(id => {
        signature = "";
        tripletsbyprocid[id].forEach(triplet => { 
            for(i = 0; i < tripletsbyprocid[id].length; i++) {
                signature += descString(triplet[i].descendants()) + triplet[i].data('sbgnlabel') + triplet[i].data('sbgnclass') + triplet[i].data('parent');
                if(triplet[i].data('sbgnstatesandinfos') != undefined && triplet[i].data('sbgnstatesandinfos').length > 0) {
                    triplet[i].data('sbgnstatesandinfos').forEach(box => {
                        signature += box.clazz + JSON.stringify(box.label);
                    });
                }

                if(signaturesbyid[id] == undefined)
                    signaturesbyid[id] = [];

                signaturesbyid[id].push(signature);
            }
        });

        key = signaturesbytriplet[id].sort().join("");
        if(idsbysignature[key] == undefined)
            idsbysignature[key] = [];

        idsbysignature[key].push(id);
    });

    i = 0;
    Object.keys(idsbysignature).forEach(signature => {
        tripletsbyprocid[idsbysignature[signature][0]].forEach(triplet => {
            rephrase[i] = triplet[0];
            rephrase[i + 1] = triplet[1];
            rephrase[i + 2] = triplet[2];
            i = i + 3;
        });
    });

    rephrase.splice(i, i - rephrase.length);
}

// Divide the rephrase in triplets of node-edge-node and identify
// the duplicates and remove them.
var mergeEdges = function(rephrase) {
    var i, j;
    var triplet = new Array(3);
    var signature;
    var nonredundantedges = {};
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            signature = "";
            for(j = 0; j < 3; j++) {
                signature += descString(triplet[j].descendants()) + triplet[j].data('sbgnlabel') + triplet[j].data('sbgnclass') + triplet[j].data('parent');
                if(triplet[j].data('sbgnstatesandinfos') != undefined && triplet[j].data('sbgnstatesandinfos').length > 0) {
                    triplet[j].data('sbgnstatesandinfos').forEach(box => {
                        signature += box.clazz + JSON.stringify(box.label);
                    });
                }
            }

            if(nonredundantedges[signature] != undefined) {
                rephrase[i - 2] = triplet[0];
                rephrase[i - 1] = triplet[1];
                rephrase[i] = triplet[2];
            } else
                nonredundantedges[signature] = rephrase[i];
        }
    }
}

//**************
// Main code
//**************

// The strategy that have been adopted here is to
// merge the different elements of a graph sequentially,
// according to their level of priority: when merging,
// the molecules/complexes/etc... must be merged first,
// the process nodes must be merged second and
// the edges must be merged at last.
// Only such a procedure guarantees a proper merge.
var i;
var cytmp;
var edgejs;
var jsonObj = {"nodes": [], "edges": []};
var rephrase = traverseGraph(cy.nodes()[2], []); //Traverse the graph and get the "rephrase" (the array representing the chronological order by which the nodes and the edges were visited).
var intermedprioritynodes = {'and': 1, 'association': 1, 'dissociation': 1, 'omitted process': 1, 'or': 1, 'process': 1, 'not': 1, 'source and sink': 1, 'uncertain process': 1};

rearrangeRephrase(rephrase, intermedprioritynodes); //Rearrange the orders of the nodes around the edges in the rephrase for the subsequent operations.
mergeNodes(rephrase, intermedprioritynodes); //Merge the nodes.
mergeProcessNodes(rephrase, intermedprioritynodes); //Merge the process nodes and the whole reaction they are involved in.
mergeEdges(rephrase); //Merge the edges.

rephrase.forEach(element => {
    // Get what's inside a complex and add it to the final json.
    desc = rephrase[i].descendants();
    desc.forEach(child => {
        jsonObj.nodes.push(child.json());
    });

    if(element.isNode())
        jsonObj.nodes.push(element.json());
    else {
        edgejs = rephrase[i].json();
        edgejs.data.source = rephrase[i - 1].id();
        edgejs.data.target = rephrase[i + 1].id();

        jsonObj.edges.push(edgejs);
    }
});
