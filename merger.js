/**
  The module merge multiple json objects into a single one. The strategy that have been adopted here is to merge
  the different elements of a graph sequentially, according to their level of priority: when merging,
  the molecules/complexes/etc... must be merged first, the process nodes must be merged second and the edges must be merged at last.
  Only such a procedure guarantees a proper merge. It relies on the assumption that the SBGN graph can be split
  in triplets of node-edge-node where one of the nodes is a biological item (protein, DNA, compartment, multimers, ...) and
  the other node is a process node (process, association, source and sink, ...) or a logic node (and, or, not). So weird results can happen
  while merging graphs with logic nodes directly linked to process nodes for example.
 **/

//Author: David Servillo.

//Last change made the: 05/15/2017.

// Travel through the edges leaving the node.
var traverseThroughEdges = function(node, edges, npassages, back_to_source, visited_nodes) {
  var next;
  var previous_visited_nodes_length;
  edges.forEach(edge => { //Visit the edges.
    edge.select();
    if (!visited_nodes.map(visited_nodes => visited_nodes.id()).includes(edge.id())) {
      npassages += 1;
      if(npassages > 1)
        visited_nodes.push(node); //We are back to the current node again so re-add it to the rephrase.

      visited_nodes.push(edge);

      previous_visited_nodes_length = visited_nodes.length;
      next = edge.target();
      if(back_to_source)
        next = edge.source();

      traverseGraph(next, visited_nodes);
      if((visited_nodes.length === previous_visited_nodes_length) && (npassages > 1))
        visited_nodes.pop(); //The node we just visited through the edge has previously been visited already so remove it from the rephrase.
    }
  });

  return npassages;
};

//Traverse the graph with the cytoscape library.
//Return the visited nodes in an order that reflects
//the chronology in which they were visited.
//The resulting array is called the rephrase.
var traverseGraph = function (node, visited_nodes) {
  // break if we visit a node twice
  if (visited_nodes.map(visited_nodes => visited_nodes.id()).includes(node.id())) {
    visited_nodes.push(node);
    return visited_nodes;
  }

  // add visited node to collection
  visited_nodes.push(node);

  // get the edges leaving the node
  const edgesTo = node.outgoers(function () {
    return this.isEdge();
  });

  // get the edges entering the node
  const edgesFrom = node.incomers(function () {
    return this.isEdge();
  });

  // travel through the edges leaving the node
  var npassages = traverseThroughEdges(node, edgesTo, 0, 0, visited_nodes);

  // travel through the edges entering the node
  traverseThroughEdges(node, edgesFrom, npassages, 1, visited_nodes);

  return visited_nodes;
};

//Read the cytoscape object, traverse the graph and 
//returns the "rephrase", i.e. an array of nodes and edges
//whose the order reflects the one to which the elements were visited.
var cytoscape2rephrase = function(cytoscape) {
  var i;
  var tmp;
  var id_list = [];
  var indice_list;
  var rephrase = [];
  var indices_to_explore = [];
  for(i = 0; i < cytoscape.nodes().length; i++) {
    id_list.push(cytoscape.nodes()[i].id());
    indices_to_explore.push(i);
  }

  while(indices_to_explore.length > 0) {
    indice_list = {};
    tmp = traverseGraph(cytoscape.nodes()[indices_to_explore[0]], []); //Traverse the graph, starting with a node not already explored.
    tmp.forEach(element => {
      if(element.isNode())
        indice_list[id_list.indexOf(element.id())] = 1;
    });

    i = 0;
    Object.keys(indice_list).sort(function(a, b){return a-b}).forEach(indice => {
      id_list.splice(indice - i, 1);
      indices_to_explore.splice(indice - i, 1); //Remove the indexes in cytoscape that have been explored.
      i += 1;
    });

    for(i = 0; i < tmp.length; i++)
      rephrase.push(tmp[i]); //Combine the rephrases together.
  }

  return rephrase;
};

//Divide the rephrase into triplets of node-edge-node and 
//when a triplet comes with no edge that is when a lonely node
//, i.e. not surrounded by an edge and linked to nothing, is identified.
var getLonelyNodes = function(rephrase) {
  var i;
  var lonely_node_list = [];
  var triplet = new Array(3);

  //Duplicate both ends of the rephrase.
  rephrase.splice(0, 0, rephrase[0]);
  rephrase.splice(rephrase.length - 1, 0, rephrase[rephrase.length - 1]);

  for(i = 0; i < rephrase.length; i++) {
    triplet.shift();
    triplet.push(rephrase[i]);

    if(triplet[0] != undefined
      && triplet[0].isNode()
      && triplet[1] != undefined
      && triplet[1].isNode()
      && triplet[2].isNode())
      lonely_node_list.push(triplet[1]); //A lonely node is identified.
  }

  return lonely_node_list;
};

//Get that string of characters made of 
//attribute values characterizing specifically a node,
//that I call a "signature".
//I use that function to output the signature of the elements
//contained in a complex.
var descString = function(node_array) {
  var id = "";
  var id_list = [];
  node_array.forEach(node => {
    //For each node, create its signature.
    id += node.data('sbgnlabel') + node.data('sbgnclass');

    if(node.data('sbgnstatesandinfos') != undefined && node.data('sbgnstatesandinfos').length > 0) {
      node.data('sbgnstatesandinfos').forEach(box => {
        id += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
      });
    }

    id_list.push(id); //Add the signature in the collection of signatures.
    id = "";
  });

  return id_list.sort().join(""); //Return the signatures put in order and concatenated together.
};

//Get that string of characters made of 
//attribute values characterizing specifically a node,
//that I call a "signature".
var getElementSignatures = function(rephrase) {
  var i;
  var signature;
  var id2signature = {};
  var id2nb_signature_alteration = {};
  for(i = 0; i < rephrase.length; i++) {
    //Read the rephrase and get the signature of each node.
    if(rephrase[i].isNode()) {
      signature = rephrase[i].data('sbgnlabel') + rephrase[i].data('sbgnclass');
      if(rephrase[i].data('sbgnstatesandinfos') != undefined && rephrase[i].data('sbgnstatesandinfos').length > 0) {
        rephrase[i].data('sbgnstatesandinfos').forEach(box => {
          signature += box.clazz + JSON.stringify(box.state) + JSON.stringify(box.label);
        });
      }

      if(rephrase[i].data('sbgnclass') == "complex")
        signature += descString(rephrase[i].descendants()); //Add the signature of all the nodes contained in the complex.

      id2signature[rephrase[i].id()] = signature;
      id2nb_signature_alteration[rephrase[i].id()] = 0;
    }
  }

  for(i = 0; i < rephrase.length; i++) {
    //Alter the signature of a node when it is contained in another node.
    if(id2signature[rephrase[i].data('parent')] && !id2nb_signature_alteration[rephrase[i].id()]) {
      id2signature[rephrase[i].id()] += id2signature[rephrase[i].data('parent')];
      id2nb_signature_alteration[rephrase[i].id()] = 1;
    }
  }

  return id2signature;
};

// Make sure the source of an edge is placed before and
// the target after the edge in the rephrase.
var rearrangeRephrase = function(rephrase, intermed_priority_nodes) {
  var tmp;
  for(i = 0; i < rephrase.length; i++) {
    if(rephrase[i].isEdge() && rephrase[i].source().id() != rephrase[i - 1].id()) {
      //Duplicate the nodes around the edge...
      rephrase.splice(i - 1, 0, rephrase[i - 1]);
      rephrase.splice(i + 2, 0, rephrase[i + 2]);

      //... and switch positions !
      tmp = rephrase[i + 2];
      rephrase[i + 2] = rephrase[i];
      rephrase[i] = tmp;
    }
  }
};

// When two nodes in the rephrase are the same but the ids differ
// make the two nodes the same (they point to the same cytoscape object).
var mergeNodes = function(rephrase, intermed_priority_nodes, id2signature) {
  var i;
  var non_redundant_node_list = {};
  for(i = 0; i < rephrase.length; i++) {
    if(rephrase[i].isNode()
      && intermed_priority_nodes[rephrase[i].data('sbgnclass')] == undefined
      && id2signature[rephrase[i].id()] in non_redundant_node_list)
      rephrase[i] = non_redundant_node_list[id2signature[rephrase[i].id()]]; //A duplicate node (i.e. that has the same signature as another node) is identified, replace it by the original one.
    else if(rephrase[i].isNode() && intermed_priority_nodes[rephrase[i].data('sbgnclass')] == undefined)
      non_redundant_node_list[id2signature[rephrase[i].id()]] = rephrase[i];
  }
};

// Divide the rephrase into triplets of node-edge-node and identify
// the process nodes that have the same set of triplets as neighbors
// (i.e. the reactions that have the same inputs and outputs).
// Among the duplicates, select only one of them.
var mergeProcessNodes = function(rephrase, intermed_priority_nodes, id2signature) {
  var i, j;
  var key;
  var process_id;
  var signature;
  var to_remove = 0;
  var ids_by_signature = {};
  var signatures_by_id = {};
  var triplets_by_proc_id = {};
  var triplet = new Array(3);
  for(i = 0; i < rephrase.length; i++) {
    triplet.shift();
    triplet.push(rephrase[i]);

    if(triplet[1] != undefined && triplet[1].isEdge()) {
      //The triplets around the same process node are stored together.
      //First identify which node is the process node in the triplet and get its id.
      process_id = triplet[0].id();
      if(intermed_priority_nodes[triplet[2].data('sbgnclass')])
        process_id = triplet[2].id();

      if(triplets_by_proc_id[process_id] == undefined)
        triplets_by_proc_id[process_id] = [];

      triplets_by_proc_id[process_id].push([triplet[0], triplet[1], triplet[2]]); //Store the triplets.
    }
  }

  //The triplets in the previous hash tables are transformed into their signatures
  //and concatenated to obtain one signature of a reaction.
  //Then, the keys of the hash table become the values and the values become the keys.
  //After that operation, the signature of each reaction is associated to an array of ids
  //of process nodes that perform the same reaction.
  Object.keys(triplets_by_proc_id).forEach(id => {
    triplets_by_proc_id[id].forEach(triplet => { 
      signature = "";
      for(i = 0; i < 3; i++)
        signature += id2signature[triplet[i].id()]; //Get the signature of the triplet.

      if(signatures_by_id[id] == undefined)
        signatures_by_id[id] = [];

      signatures_by_id[id].push(signature); //Store the signatures.
    });

    key = signatures_by_id[id].sort().join(""); //The key now is the reaction signature.
    if(ids_by_signature[key] == undefined)
      ids_by_signature[key] = [];

    ids_by_signature[key].push(id); //Role switching: reaction signatures are the keys while the process node ids are the values.
  });

  i = 0;
  Object.keys(ids_by_signature).forEach(signature => {
    //For each reaction signature, select just the triplets of the reaction of the
    //process node corresponding to the first process node id in the array of 
    //process node ids.
    triplets_by_proc_id[ids_by_signature[signature][0]].forEach(triplet => {
      for(j = 0; j < 3; j++)
        rephrase[i + j] = triplet[j]; //Rewrite the rephrase with the new triplets.

      i = i + 3;
      to_remove = rephrase.length - i
    });
  });

  //The above operations result in a reduction of information.
  //Remove the rest of the rephrase that is rendered useless.
  rephrase.splice(i, to_remove);
};

// Divide the rephrase in triplets of node-edge-node and identify
// the duplicates and remove them.
var mergeEdges = function(rephrase, id2signature) {
  var i, j;
  var signature;
  var to_remove = [];
  var non_redundant_signature_list = {};
  var triplet = new Array(3);
  for(i = 0; i < rephrase.length; i++) {
    triplet.shift();
    triplet.push(rephrase[i]);

    if(triplet[1] != undefined && triplet[1].isEdge()) {
      signature = "";
      for(j = 0; j < 3; j++)
        signature += id2signature[triplet[j].id()]; //Get the signature of the triplet.

      if(non_redundant_signature_list[signature]
        && triplet[0] == non_redundant_signature_list[signature][0]
        && triplet[2] == non_redundant_signature_list[signature][2])
        //A duplicate triplet of node-edge-node is identified and
        //both source and target are the same as the one in the original triplet.
        //Store the position of the triplet which is to be removed later.
        to_remove.push(i - 2); 
      else {
        non_redundant_signature_list[signature] = new Array(3);
        for(j = 0; j < 3; j++)
          non_redundant_signature_list[signature][j] = triplet[j];
      }
    }
  }

  //Remove the duplicate triplets.
  to_remove.forEach(startposition => {
    rephrase.splice(startposition, 3);
  });
};

//Convert a json object to acytoscape object.
var json2cytoscape = function(jsObj) {
  return cytoscape({
    elements: jsObj,
    headless: true,
    styleEnabled: true,
  });
};

//**************
// Main code
//**************


//Merge an array of json objects to output a single json object.
var mergeJsons = function(json_list) {
  var i;
  var edgejs;
  var nodejs;
  var tmp = [];
  var rephrase2;
  var id_list = {};
  var old2new_id_list = {};
  var intermed_priority_nodes = {'and': 1, 'association': 1, 'dissociation': 1, 'omitted process': 1, 'or': 1, 'process': 1, 'not': 1, 'source and sink': 1, 'uncertain process': 1};

  var jsonObj = {"nodes": [], "edges": []};
  var cy = json2cytoscape(jsonObj);

  //Convert the json_list into one single cytoscape object.
  for(i = 0; i < json_list.length; i++)
    cy.add(json2cytoscape(json_list[i]));

  var rephrase = cytoscape2rephrase(cy); //Rephrase the cytoscape object, in order to get the array of nodes and edges.

  //Save the lonely nodes. It is mostly made to handle the nodes contained in complexes.
  //Since they are not connected to any edge, they will be discarded when merging process nodes.
  var lonely_node_list = getLonelyNodes(rephrase);
  var id2signature = getElementSignatures(rephrase);

  rearrangeRephrase(rephrase, intermed_priority_nodes); //Rearrange the orders of the nodes around the edges in the rephrase for the subsequent operations.

  if(lonely_node_list.length) {
    rephrase2 = new Array(rephrase.length);
    for(i = 0; i < rephrase.length; i++)
      rephrase2[i] = rephrase[i];
  }

  mergeNodes(rephrase, intermed_priority_nodes, id2signature); //Merge the nodes.

  //After merging the nodes, some nodes may have disappeared to be replaced by others.
  //Update the collection of lonely nodes previously saved.
  if(lonely_node_list.length) {
    for(i = 0; i < rephrase.length; i++) {
      id_list[rephrase[i].id()] = 1;
      old2new_id_list[rephrase2[i].id()] = rephrase[i].id();
    }

    for(i = 0; i < lonely_node_list.length; i++) {
      if(lonely_node_list[i].id() in id_list)
        tmp.push(lonely_node_list[i]);
    }
  }

  lonely_node_list = tmp; //Update the lonely nodes collection.

  mergeProcessNodes(rephrase, intermed_priority_nodes, id2signature); //Merge the process nodes and the whole reaction they are involved in.
  mergeEdges(rephrase, id2signature); //Merge the edges.

  //Create the merged json object.
  for(i = 0; i < rephrase.length; i++) {
    if(rephrase[i].isNode()) {
      nodejs = rephrase[i].json();
      if(nodejs.data.parent)
        nodejs.data.parent = old2new_id_list[nodejs.data.parent];

      jsonObj.nodes.push(nodejs);
    } else {
      edgejs = rephrase[i].json();
      edgejs.data.source = rephrase[i - 1].id();
      edgejs.data.target = rephrase[i + 1].id();

      jsonObj.edges.push(edgejs);
    }
  }

  //Add the lonely nodes that were discarded at the process node merge stage.
  for(i = 0; i < lonely_node_list.length; i++) {
    nodejs = lonely_node_list[i].json();
    if(nodejs.data.parent)
      nodejs.data.parent = old2new_id_list[nodejs.data.parent];

    jsonObj.nodes.push(nodejs);
  }
};
