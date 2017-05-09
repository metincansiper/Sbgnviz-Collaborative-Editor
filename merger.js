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
var rearrangeRephrase = function(rephrase, leastprioritynodes) {
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isEdge() && rephrase[i].source().id() != rephrase[i - 1].id()) {
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
var mergeNodes = function(rephrase, leastprioritynodes) {
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

        if(rephrase[i].isNode() && leastprioritynodes[rephrase[i].data('sbgnclass')] == undefined && signature in nonredundantnodes) {
            rephrase[i] = nonredundantnodes[signature];
        } else if(rephrase[i].isNode() && leastprioritynodes[rephrase[i].data('sbgnclass')] == undefined)
            nonredundantnodes[signature] = rephrase[i];
    }
}

// Divide the rephrase in triplets of node-edge-node and identify
// the process nodes that have the same set of triplet as neighbors
// (i.e. the reactions that have the same inputs and outputs).
// Among the duplicates, select only one of them.
// Right now I'm having issues here.
var mergeProcessNodes = function(rephrase, leastprioritynodes) {
    var i, j;
    var key;
    var processid;
    var signature;
    var idsbysignature = {};
    var tripletsbyprocid = {};
    var procidsbytriplet = {};
    var triplet = new Array(3);
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            processid = triplet[0].id();
            if(leastprioritynodes[triplet[2].data('sbgnclass')])
                processid = triplet[2].id();

            if(tripletsbyprocid[processid] == undefined)
                tripletsbyprocid[processid] = [];

            tripletsbyprocid[processid].push(triplet);
        }
    }

    Object.keys(tripletsbyprocid).forEach(id => {
        signature = "";
        Object.keys(tripletsbyprocid[id]).forEach(triplet => { 
            for(i = 0; i < tripletsbyprocid[id].length; i++) {
                for(j = 0; j < 3; j++) {
                    signature += descString(triplet[i][j].descendants()) + triplet[i][j].data('sbgnlabel') + triplet[i][j].data('sbgnclass') + triplet[i][j].data('parent');
                    if(triplet[i][j].data('sbgnstatesandinfos') != undefined && triplet[i][j].data('sbgnstatesandinfos').length > 0) {
                        triplet[i][j].data('sbgnstatesandinfos').forEach(box => {
                            signature += box.clazz + JSON.stringify(box.label);
                        });
                    }
                }

                if(signaturesbyid[id] == undefined)
                    signaturesbyid[id] = [];

                signaturesbytriplet[id].push(signature);
            }
        });

        key = signaturesbytriplet[id].sort().join("");
        if(idsbysignature[key] == undefined)
            idsbysignature[key] = [];

        idsbysignature[key].push(id);
    });

    rephrase = [];
    Object.keys(idsbysignature).forEach(signature => {
        tripletsbyprocid[idsbysignature[signature][0]].forEach(triplet => {
            rephrase.concat(triplet);
        });
    });
}

// Divide the rephrase in triplets of node-edge-node and identify
// the duplicates and remove them.
var mergeEdges = function(rephrase) {
    var i;
    var triplet;
    var signature;
    var nonredundantedges = {};
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            signature = "";
            for(i = 0; i < 3; i++) {
                signature += descString(triplet[i].descendants()) + triplet[i].data('sbgnlabel') + triplet[i].data('sbgnclass') + triplet[i].data('parent');
                if(triplet[i].data('sbgnstatesandinfos') != undefined && triplet[i].data('sbgnstatesandinfos').length > 0) {
                    triplet[i].data('sbgnstatesandinfos').forEach(box => {
                        signature += box.clazz + JSON.stringify(box.label);
                    });
                }
            }

            if(nonredundantedges[signature] != undefined)
                rephrase.splice(i - 2, 3);
            else
                nonredundantedges[signature] = rephrase[i];
        }
    }
}

//**************
// Main code
//**************
var jsonObj = {"nodes": [], "edges": []};
var rephrase = traverseGraph(cy.nodes()[2], []); //Traverse the graph and get the "rephrase" (the array representing the chronological order by which the nodes and the edges were visited).
var leastprioritynodes = {'and': 1, 'association': 1, 'dissociation': 1, 'omitted process': 1, 'or': 1, 'process': 1, 'not': 1, 'source and sink': 1, 'uncertain process': 1};

rearrangeRephrase(rephrase, leastprioritynodes); //Rearrange the orders of the nodes around the edges in the rephrase for the subsequent operations.
mergeNodes(rephrase, leastprioritynodes); //Merge the nodes.
mergeProcessNodes(rephrase, leastprioritynodes); //Merge the process nodes and the whole reaction they are involved in.
mergeEdges(rephrase); //Merge the edges.

rephrase.forEach(element => {
    if(element.isNode())
        jsonObj.nodes.push(element.json());
    else
        jsonObj.edges.push(element.json());
});
