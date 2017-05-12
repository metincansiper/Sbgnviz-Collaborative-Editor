var traverseThroughEdges = function(node, edges, npassages, backtosource, visitedNodes) {
    var next;
    var previousVisitedNodesLength;
    edges.forEach(edge => {
        edge.select();
        if (!visitedNodes.map(visitedNodes => visitedNodes.id()).includes(edge.id())) {
            npassages += 1;
            if(npassages > 1)
                visitedNodes.push(node);

            visitedNodes.push(edge);
            
            previousVisitedNodesLength = visitedNodes.length;
            next = edge.target();
            if(backtosource)
                next = edge.source();

            traverseGraph(next, visitedNodes);
            if((visitedNodes.length === previousVisitedNodesLength) && (npassages > 1))
                visitedNodes.pop();
        }
    });

    return npassages;
};

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

    // travel through the edges leaving the node
    var npassages = traverseThroughEdges(node, edgesTo, 0, 0, visitedNodes);

    // travel through the edges entering the node
    traverseThroughEdges(node, edgesFrom, npassages, 1, visitedNodes);

    return visitedNodes;
};

var cytoscape2rephrase = function(cytoscape) {
    var i;
    var tmp;
    var ids = [];
    var indicelist;
    var rephrase = [];
    var indicestoexplore = [];
    for(i = 0; i < cytoscape.nodes().length; i++) {
        ids.push(cytoscape.nodes()[i].id());
        indicestoexplore.push(i);
    }

    while(indicestoexplore.length > 0) {
        indicelist = {};
        tmp = traverseGraph(cytoscape.nodes()[indicestoexplore[0]], []);
        tmp.forEach(element => {
            if(element.isNode())
                indicelist[ids.indexOf(element.id())] = 1;
        });

        i = 0;
        Object.keys(indicelist).sort(function(a, b){return a-b}).forEach(indice => {
            ids.splice(indice - i, 1);
            indicestoexplore.splice(indice - i, 1);
            i += 1;
        });

        for(i = 0; i < tmp.length; i++)
            rephrase.push(tmp[i]);
    }

    return rephrase;
};

var getLonelyNodes = function(rephrase) {
    var i;
    var lonelynodes = [];
    var triplet = new Array(3);

    rephrase.splice(0, 0, rephrase[0]);
    rephrase.splice(rephrase.length - 1, 0, rephrase[rephrase.length - 1]);

    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[0] != undefined && triplet[0].isNode() && triplet[1] != undefined && triplet[1].isNode() && triplet[2].isNode())
            lonelynodes.push(triplet[1]);
    }

    return lonelynodes;
};

var descString = function(nodearray) {
    var id;
    nodearray.forEach(node => {
        id = nodearray.data('sbgnlabel') + nodearray.data('sbgnclass');

        if(nodearray.data('sbgnstatesandinfos') != undefined && nodearray.data('sbgnstatesandinfos').length > 0) {
            nodearray.data('sbgnstatesandinfos').forEach(box => {
                id += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
            });
        }
    });

    return id;
};

var getElementSignatures = function(rephrase) {
    var i;
    var signature;
    var id2signature = {};
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isNode()) {
            signature = rephrase[i].data('sbgnlabel') + rephrase[i].data('sbgnclass');
            if(rephrase[i].data('sbgnstatesandinfos') != undefined && rephrase[i].data('sbgnstatesandinfos').length > 0) {
                rephrase[i].data('sbgnstatesandinfos').forEach(box => {
                    signature += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
                });
            }

            if(rephrase[i].data('sbgnclass') == "complex")
                signature += descString(rephrase[i].descendants());

            id2signature[rephrase[i].id()] = signature;
        }
    }

    for(i = 0; i < rephrase.length; i++) {
        if(id2signature[rephrase[i].data('parent')])
           id2signature[rephrase[i].id()] += id2signature[rephrase[i].data('parent')];
    }

    return id2signature;
};

// Make sure the sources of the edges are placed before and
// the targets after the edges in the rephrase.
var rearrangeRephrase = function(rephrase, intermedprioritynodes) {
    var tmp;
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
};

// When two nodes in the rephrase are the same but the ids differ
// make the two nodes exactly (they point to the same cytoscape object).
var mergeNodes = function(rephrase, intermedprioritynodes, id2signature) {
    var i;
    var nonredundantnodes = {};
    for(i = 0; i < rephrase.length; i++) {
        if(rephrase[i].isNode() && intermedprioritynodes[rephrase[i].data('sbgnclass')] == undefined && id2signature[rephrase[i].id()] in nonredundantnodes) {
            rephrase[i] = nonredundantnodes[id2signature[rephrase[i].id()]];
        } else if(rephrase[i].isNode() && intermedprioritynodes[rephrase[i].data('sbgnclass')] == undefined)
            nonredundantnodes[id2signature[rephrase[i].id()]] = rephrase[i];
    }
}

// Divide the rephrase in triplets of node-edge-node and identify
// the process nodes that have the same set of triplet as neighbors
// (i.e. the reactions that have the same inputs and outputs).
// Among the duplicates, select only one of them.
var mergeProcessNodes = function(rephrase, intermedprioritynodes, id2signature) {
    var i, j;
    var key;
    var processid;
    var signature;
    var toremove = 0;
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

            tripletsbyprocid[processid].push([triplet[0], triplet[1], triplet[2]]);
        }
    }

    Object.keys(tripletsbyprocid).forEach(id => {
        tripletsbyprocid[id].forEach(triplet => { 
            signature = "";
            for(i = 0; i < 3; i++)
                signature += id2signature[triplet[i].id()];

            if(signaturesbyid[id] == undefined)
                signaturesbyid[id] = [];

            signaturesbyid[id].push(signature);
        });

        key = signaturesbyid[id].sort().join("");
        if(idsbysignature[key] == undefined)
            idsbysignature[key] = [];

        idsbysignature[key].push(id);
    });

    i = 0;
    Object.keys(idsbysignature).forEach(signature => {
        tripletsbyprocid[idsbysignature[signature][0]].forEach(triplet => {
            for(j = 0; j < 3; j++)
                rephrase[i + j] = triplet[j];

            i = i + 3;
            toremove = rephrase.length - i
        });
    });

    rephrase.splice(i, toremove);
};

// Divide the rephrase in triplets of node-edge-node and identify
// the duplicates and remove them.
var mergeEdges = function(rephrase, id2signature) {
    var i, j;
    var signature;
    var nonredundantedges = {};
    var triplet = new Array(3);
    for(i = 0; i < rephrase.length; i++) {
        triplet.shift();
        triplet.push(rephrase[i]);

        if(triplet[1] != undefined && triplet[1].isEdge()) {
            signature = "";
            for(j = 0; j < 3; j++)
                signature += id2signature[triplet[j].id()];

            if(nonredundantedges[signature] && triplet[0] == nonredundantedges[signature][0] && triplet[2] == nonredundantedges[signature][2]) {
                for(j = 0; j < 3; j++)
                    rephrase[i - (2 - j)] = nonredundantedges[signature][j];
            } else {
                nonredundantedges[signature] = new Array(3);
                for(j = 0; j < 3; j++)
                    nonredundantedges[signature][j] = triplet[j];
            }
        }
    }
};

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
var edgejs;
var nodejs;
var tmp = [];
var rephrase2;
var idlist = {};
var old2newids = {};
var rephrase = cytoscape2rephrase(cy);
var jsonObj = {"nodes": [], "edges": []};
var lonelynodes = getLonelyNodes(rephrase);
var id2signature = getElementSignatures(rephrase);
var intermedprioritynodes = {'and': 1, 'association': 1, 'dissociation': 1, 'omitted process': 1, 'or': 1, 'process': 1, 'not': 1, 'source and sink': 1, 'uncertain process': 1};

rearrangeRephrase(rephrase, intermedprioritynodes); //Rearrange the orders of the nodes around the edges in the rephrase for the subsequent operations.

if(lonelynodes.length) {
    rephrase2 = new Array(rephrase.length);
    for(i = 0; i < rephrase.length; i++)
        rephrase2[i] = rephrase[i];
}

mergeNodes(rephrase, intermedprioritynodes, id2signature); //Merge the nodes.

if(lonelynodes.length) {
    for(i = 0; i < rephrase.length; i++) {
        idlist[rephrase[i].id()] = 1;
        old2newids[rephrase2[i].id()] = rephrase[i].id();
    }

    for(i = 0; i < lonelynodes.length; i++) {
        if(lonelynodes[i].id() in idlist)
            tmp.push(lonelynodes[i]);
    }
}

lonelynodes = tmp;

mergeProcessNodes(rephrase, intermedprioritynodes, id2signature); //Merge the process nodes and the whole reaction they are involved in.
mergeEdges(rephrase, id2signature); //Merge the edges.

for(i = 0; i < rephrase.length; i++) {
    // Get what's inside a complex and add it to the final json.
    desc = rephrase[i].descendants();
    desc.forEach(child => {
        jsonObj.nodes.push(child.json());
    });

    if(rephrase[i].isNode()) {
        nodejs = rephrase[i].json();
        if(nodejs.data.parent)
            nodejs.data.parent = old2newids[nodejs.data.parent];

        jsonObj.nodes.push(nodejs);
    } else {
        edgejs = rephrase[i].json();
        edgejs.data.source = rephrase[i - 1].id();
        edgejs.data.target = rephrase[i + 1].id();

        jsonObj.edges.push(edgejs);
    }
}

for(i = 0; i < lonelynodes.length; i++) {
    nodejs = lonelynodes[i].json();
    if(nodejs.data.parent)
        nodejs.data.parent = old2newids[nodejs.data.parent];

    jsonObj.nodes.push(nodejs);
}
