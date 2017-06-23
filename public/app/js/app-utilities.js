/*
 * 
 * Common utilities for sample application. Includes functions and variables.
 * You can directly utilize this object also you can use this object to set a variable in a file and access it in another file.
 */
var jquery = $ = require('jquery');

var appUtilities = {};

// Configuration flag for whether the operations should be undoable.
// It is to be checked and passed to extensions/libraries where applicable.
appUtilities.undoable = true;

appUtilities.defaultLayoutProperties = {
  name: 'cose-bilkent',
  nodeRepulsion: 4500,
  idealEdgeLength: 50,
  edgeElasticity: 0.45,
  nestingFactor: 0.1,
  gravity: 0.25,
  numIter: 2500,
  tile: false, //funda
  animationEasing: 'cubic-bezier(0.19, 1, 0.22, 1)',
  animate: 'end',
  animationDuration: 0,//FUNDA1000,
  randomize: false,
  tilingPaddingVertical: 20,
  tilingPaddingHorizontal: 20,
  gravityRangeCompound: 1.5,
  gravityCompound: 1.0,
  gravityRange: 3.8,
  stop: function () {
    chise.endSpinner('layout-spinner');
  }
};

appUtilities.currentLayoutProperties = jquery.extend(true, {}, appUtilities.defaultLayoutProperties);

appUtilities.defaultGridProperties = {
  showGrid: false,
  snapToGrid: false,
  snapToAlignmentLocation: false,
  discreteDrag: false,
  gridSize: 20,
  autoResizeNodes: false,
  showGeometricGuidelines: false,
  showInitPosAlignment: false,
  showDistributionGuidelines: false,
  lineWidth: 0.75,
  guidelineTolerance: 3.0,
  guidelineColor: "#0B9BCD",
  horizontalGuidelineColor: "#0B9BCD",
  verticalGuidelineColor: "#0B9BCD",
  initPosAlignmentColor: "#0000ff",
  geometricAlignmentRange: 300,
  distributionAlignmentRange: 200,
  minDistributionAlignmentRange: 15,
  initPosAlignmentLine: [0, 0],
  lineDash: [3, 5],
  horizontalDistLine: [0, 0],
  verticalDistLine: [0, 0],
};

appUtilities.currentGridProperties = jquery.extend(true, {}, appUtilities.defaultGridProperties);

appUtilities.defaultGeneralProperties = {
  compoundPadding: 10,
  extraCompartmentPadding: 14,
  dynamicLabelSize: 'large', //FUNDA it was regular
  fitLabelsToNodes: true, //FUNDA
  rearrangeAfterExpandCollapse: true,
  animateOnDrawingChanges: false, //FUNDA
  adjustNodeLabelFontSizeAutomatically: true, //funda
  mapColorScheme: 'black_white'
};

appUtilities.currentGeneralProperties = jquery.extend(true, {}, appUtilities.defaultGeneralProperties);

appUtilities.setFileContent = function (fileName) {
  var span = document.getElementById('file-name');
  while (span.firstChild) {
    span.removeChild(span.firstChild);
  }
  span.appendChild(document.createTextNode(fileName));
};

appUtilities.triggerIncrementalLayout = function () {
  // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
  // If it is 'during' use it as is. Set 'randomize' and 'fit' options to false
  var preferences = {
    randomize: false,
    animate: this.currentGeneralProperties.animateOnDrawingChanges ? 'end' : false,
    fit: false
  };
  if (this.currentLayoutProperties.animate === 'during') {
    delete preferences.animate;
  }

  this.layoutPropertiesView.applyLayout(preferences, true); // layout must not be undoable
};

appUtilities.getExpandCollapseOptions = function () {
  var self = this;
  return {
    fisheye: function () {
      return self.currentGeneralProperties.rearrangeAfterExpandCollapse;
    },
    animate: function () {
      return self.currentGeneralProperties.animateOnDrawingChanges;
    },
    layoutBy: function () {
      if (!self.currentGeneralProperties.rearrangeAfterExpandCollapse) {
        return;
      }

      self.triggerIncrementalLayout();
    }
  };
};

appUtilities.dynamicResize = function () {
  var win = $(window);

  var windowWidth = win.width();
  var windowHeight = win.height();

  var canvasWidth = 1000;
  var canvasHeight = 680;

  if (windowWidth > canvasWidth)
  {
    $("#sbgn-network-container").width(windowWidth * 0.9 * 0.8);
    $("#sbgn-inspector").width(windowWidth * 0.9 * 0.2);
    var w = $("#sbgn-inspector-and-canvas").width();
    $(".nav-menu").width(w);
    $(".navbar").width(w);
//    $("#sbgn-info-content").width(windowWidth * 0.85);
    $("#sbgn-toolbar").width(w);
  }

  if (windowHeight > canvasHeight)
  {
    $("#sbgn-network-container").height(windowHeight * 0.85);
    $("#sbgn-inspector").height(windowHeight * 0.85);
  }
};

appUtilities.nodeQtipFunction = function (node) {
  if (node.renderedStyle("label") == node.data("label") && node.data("statesandinfos").length == 0 && node.data("class") != "complex") {
    return;
  }

  var qtipContent = chise.getQtipContent(node);

  if (!qtipContent) {
    return;
  }

  node.qtip({
    content: function () {
      return qtipContent;
    },
    show: {
      ready: true
    },
    position: {
      my: 'top center',
      at: 'bottom center',
      adjust: {
        cyViewport: true
      }
    },
    style: {
      classes: 'qtip-bootstrap',
      tip: {
        width: 16,
        height: 8
      }
    }
  });
};

appUtilities.refreshUndoRedoButtonsStatus = function () {
  var ur = cy.undoRedo();
  if (ur.isUndoStackEmpty()) {
    $("#undo-last-action").parent("li").addClass("disabled");
  }
  else {
    $("#undo-last-action").parent("li").removeClass("disabled");
  }

  if (ur.isRedoStackEmpty()) {
    $("#redo-last-action").parent("li").addClass("disabled");
  }
  else {
    $("#redo-last-action").parent("li").removeClass("disabled");
  }
};

appUtilities.resetUndoRedoButtons = function () {
  $("#undo-last-action").parent("li").addClass("disabled");
  $("#redo-last-action").parent("li").addClass("disabled");
};

// Enable drag and drop mode
appUtilities.enableDragAndDropMode = function() {
  appUtilities.dragAndDropModeEnabled = true;
  $("#sbgn-network-container canvas").addClass("target-cursor");
  cy.autolock(true);
  cy.autounselectify(true);
};

// Disable drag and drop mode
appUtilities.disableDragAndDropMode = function() {
  appUtilities.dragAndDropModeEnabled = null;
  appUtilities.nodesToDragAndDrop = null;
  $("#sbgn-network-container canvas").removeClass("target-cursor");
  cy.autolock(false);
  cy.autounselectify(false);
};

// Show given eles and perform incremental layout afterward
appUtilities.showAndPerformIncrementalLayout = function(eles) {
  var extendedList = chise.elementUtilities.extendNodeList(eles);
  chise.showAndPerformLayout(extendedList, this.triggerIncrementalLayout.bind(this));
};

appUtilities.mapColorSchemes = mapColorSchemes = {
  'black_white': {
    'name': 'Black and white',
    'values': {
      'unspecified entity': '#ffffff',
      'simple chemical': '#ffffff',
      'macromolecule': '#ffffff',
      'nucleic acid feature': '#ffffff',
      'perturbing agent': '#ffffff',
      'source and sink': '#ffffff',
      'complex': '#ffffff',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#ffffff',
      'tag': '#ffffff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#ffffff'
    }
  },
  'greyscale': {
    'name': 'Greyscale',
    'values': {
      'unspecified entity': '#ffffff',
      'simple chemical': '#bdbdbd',
      'macromolecule': '#bdbdbd',
      'nucleic acid feature': '#bdbdbd',
      'perturbing agent': '#bdbdbd',
      'source and sink': '#ffffff',
      'complex': '#d9d9d9',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#ffffff',
      'tag': '#ffffff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f0f0f0'
    }
  },
  'inverse_greyscale': {
    'name': 'Inverse greyscale',
    'values': {
      'unspecified entity': '#f0f0f0',
      'simple chemical': '#f0f0f0',
      'macromolecule': '#f0f0f0',
      'nucleic acid feature': '#f0f0f0',
      'perturbing agent': '#f0f0f0',
      'source and sink': '#f0f0f0',
      'complex': '#d9d9d9',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f0f0f0',
      'tag': '#f0f0f0',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#bdbdbd'
    }
  },
  'blue_scale': {
    'name': 'Blue scale',
    'values': {
      'unspecified entity': '#9ecae1',
      'simple chemical': '#9ecae1',
      'macromolecule': '#9ecae1',
      'nucleic acid feature': '#9ecae1',
      'perturbing agent': '#9ecae1',
      'source and sink': '#9ecae1',
      'complex': '#c6dbef',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#9ecae1',
      'tag': '#9ecae1',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#eff3ff'
    }
  },
  'inverse_blue_scale': {
    'name': 'Inverse blue scale',
    'values': {
      'unspecified entity': '#eff3ff',
      'simple chemical': '#eff3ff',
      'macromolecule': '#eff3ff',
      'nucleic acid feature': '#eff3ff',
      'perturbing agent': '#eff3ff',
      'source and sink': '#eff3ff',
      'complex': '#c6dbef',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#eff3ff',
      'tag': '#eff3ff',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#9ecae1'
    }
  },
  'opposed_red_blue': {
    'name': 'Red blue',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#fddbc7',
      'macromolecule': '#92c5de',
      'nucleic acid feature': '#f4a582',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#d1e5f0',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7'
    }
  },
  'opposed_red_blue2': {
    'name': 'Red blue 2',
    'values': {
      'unspecified entity': '#f7f7f7',
      'simple chemical': '#d1e5f0',
      'macromolecule': '#f4a582',
      'nucleic acid feature': '#92c5de',
      'perturbing agent': '#f7f7f7',
      'source and sink': '#f7f7f7',
      'complex': '#fddbc7',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f7f7f7',
      'tag': '#f7f7f7',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f7f7f7'
    }
  },
  'opposed_green_brown': {
    'name': 'Green brown',
    'values': {
      'unspecified entity': '#f5f5f5',
      'simple chemical': '#f6e8c3',
      'macromolecule': '#80cdc1',
      'nucleic acid feature': '#dfc27d',
      'perturbing agent': '#f5f5f5',
      'source and sink': '#f5f5f5',
      'complex': '#c7eae5',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f5f5f5',
      'tag': '#f5f5f5',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f5f5f5'
    }
  },
  'opposed_green_brown2': {
    'name': 'Green brown 2',
    'values': {
      'unspecified entity': '#f5f5f5',
      'simple chemical': '#c7eae5',
      'macromolecule': '#dfc27d',
      'nucleic acid feature': '#80cdc1',
      'perturbing agent': '#f5f5f5',
      'source and sink': '#f5f5f5',
      'complex': '#f6e8c3',
      'process': '#ffffff',
      'omitted process': '#ffffff',
      'uncertain process': '#ffffff',
      'association': '#ffffff',
      'dissociation': '#ffffff',
      'phenotype': '#f5f5f5',
      'tag': '#f5f5f5',
      'consumption': '#ffffff',
      'production': '#ffffff',
      'modulation': '#ffffff',
      'stimulation': '#ffffff',
      'catalysis': '#ffffff',
      'inhibition': '#ffffff',
      'necessary stimulation': '#ffffff',
      'logic arc': '#ffffff',
      'equivalence arc': '#ffffff',
      'and': '#ffffff',
      'or': '#ffffff',
      'not': '#ffffff',
      'compartment': '#f5f5f5'
    }
  }
};
// set multimers to be the same as their original elements
// just to avoid typing it manually in the mapColorSchemes dictionary
for(var scheme in mapColorSchemes){
  mapColorSchemes[scheme]['values']['nucleic acid feature multimer'] = mapColorSchemes[scheme]['values']['nucleic acid feature'];
  mapColorSchemes[scheme]['values']['macromolecule multimer'] = mapColorSchemes[scheme]['values']['macromolecule'];
  mapColorSchemes[scheme]['values']['simple chemical multimer'] = mapColorSchemes[scheme]['values']['simple chemical'];
  mapColorSchemes[scheme]['values']['complex multimer'] = mapColorSchemes[scheme]['values']['complex'];
}

// go through eles, mapping the id of these elements to values that were mapped to their data().class
// classMap is of the form: {ele.data().class: value}
// return object of the form: {ele.id: value}
appUtilities.mapEleClassToId = function(eles, classMap) {
  result = {};
  for( var i = 0; i < eles.length; i++ ){
    ele = eles[i];
    result[ele.id()] = classMap[ele.data().class];
  }
  return result;
};

// change the global style of the map by applying the current color scheme
appUtilities.applyMapColorScheme = function(newColorScheme) {
  var eles = cy.nodes();
  var idMap = appUtilities.mapEleClassToId(eles, mapColorSchemes[newColorScheme]['values']);
  var collapsedChildren = appUtilities.getCollapsedChildren("nodes");
  var collapsedIdMap = appUtilities.mapEleClassToId(collapsedChildren, mapColorSchemes[newColorScheme]['values']);

  var actions = [];
  // edit style of the current map elements
  actions.push({name: "changeData", param: {eles: eles, name: 'background-color', valueMap: idMap}});
  // collapsed nodes' style should also be changed, special edge case
  actions.push({name: "changeDataDirty", param: {eles: collapsedChildren, name: 'background-color', valueMap: collapsedIdMap}});

  // set to be the default as well
  for(var nodeClass in mapColorSchemes[newColorScheme]['values']){
    classBgColor = mapColorSchemes[newColorScheme]['values'][nodeClass];
    // nodeClass may not be defined in the defaultProperties (for edges, for example)
    if(nodeClass in chise.elementUtilities.defaultProperties){
      actions.push({name: "setDefaultProperty", param: {class: nodeClass, name: 'background-color', value: classBgColor}});
    }
  }

  cy.undoRedo().do("batch", actions);

};

// the 3 following functions are related to the handling of the dynamic image
// used during drag and drop of palette nodes
appUtilities.dragImageMouseMoveHandler = function (e) {
      $("#drag-image").css({left:e.pageX, top:e.pageY});
};

appUtilities.addDragImage = function (img, width, height){
  // see: http://stackoverflow.com/questions/38838508/make-a-dynamic-image-follow-mouse
  $(document.body).append('<img id="drag-image" src="app/img/nodes/'+img+'" style="position: absolute;'+
                                'width:'+width+'; height:'+height+';" >');
  $(document).on("mousemove", appUtilities.dragImageMouseMoveHandler);
};

appUtilities.removeDragImage = function () {
  $("#drag-image").remove();
  $(document).off("mousemove", appUtilities.dragImageMouseMoveHandler);
};

// get all the content (nodes only) of all collapsed nodes of the map
// get things in a raw, dirty way (as collapsedChildren are not to be considered as normal nodes)
appUtilities.getCollapsedChildren = function(nodesOrEdges) {
  var expandableNodes = cy.expandCollapse('get').expandableNodes();
  var resultEles = [];
  for (var i=0; i<expandableNodes.length; i++) {
    var expandableNode = expandableNodes[i];
    var collapsedChildren = expandableNode._private.data['collapsedChildren'];
    for(var j=0; j < collapsedChildren.length; j++){
      var collapsedChild = collapsedChildren[j];
      if (collapsedChild._private.group != nodesOrEdges) {
        continue;
      }
      resultEles.push(collapsedChild);
    }
  }
  return resultEles;
};

/*
  fetch all possible styles used in the graph
  example: if a node is blue with thick border, and another blue with thin border -> 2 styles
  return renderInfo {
    colors: {
      validXmlValue: id
    },
    styles: [{
      idList: list of the nodes ids have this style
      properties: {}
    }]
  }
*/
appUtilities.getAllStyles = function () {
  var collapsedChildrenNodes = appUtilities.getCollapsedChildren("nodes");
  var nodes = cy.nodes().union(collapsedChildrenNodes);
  var collapsedChildrenEdges = appUtilities.getCollapsedChildren("edges");
  var edges = cy.edges().union(collapsedChildrenEdges);

  // first get all used colors, then deal with them and keep reference to them
  var colorUsed = appUtilities.getColorsFromElements(nodes, edges);

  var nodePropertiesToXml = {
    'background-color': 'fill',
    'background-opacity': 'background-opacity', // not an sbgnml XML attribute, but used with fill
    'border-color': 'stroke',
    'border-width': 'strokeWidth',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'font-style': 'fontStyle',
    'font-family': 'fontFamily'
  };
  var edgePropertiesToXml = {
    'line-color': 'stroke',
    'width': 'strokeWidth'
  };

  function getStyleHash (element, properties) {
    var hash = "";
    for(var cssProp in properties){
      if (element.data(cssProp)) {
        hash += element.data(cssProp).toString();
      }
      else {
        hash += "";
      }
    }
    return hash;
  }

  function getStyleProperties (element, properties) {
    var props = {};
    for(var cssProp in properties){
      if (element.data(cssProp)) {
        //if it is a color property, replace it with corresponding id
        if (cssProp == 'background-color' || cssProp == 'border-color' || cssProp == 'line-color') {
          var validColor = appUtilities.elementValidColor(element, cssProp);
          var colorID = colorUsed[validColor];
          props[properties[cssProp]] = colorID;
        }
        else{
          props[properties[cssProp]] = element.data(cssProp);
        }
      }
    }
    return props;
  }

  // populate the style structure for nodes
  var styles = {}; // list of styleKey pointing to a list of properties and a list of nodes
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var styleKey = "node"+getStyleHash(node, nodePropertiesToXml);
    if (!styles.hasOwnProperty(styleKey)) { // new style encountered, init this new style
      var properties = getStyleProperties(node, nodePropertiesToXml);
      styles[styleKey] = {
        idList: [],
        properties: properties
      };
    }
    var currentNodeStyle = styles[styleKey];
    // add current node id to this style
    currentNodeStyle.idList.push(node.data('id'));
  }

  // populate the style structure for edges
  for(var i=0; i<edges.length; i++) {
    var edge = edges[i];
    var styleKey = "edge"+getStyleHash(edge, edgePropertiesToXml);
    if (!styles.hasOwnProperty(styleKey)) { // new style encountered, init this new style
      var properties = getStyleProperties(edge, edgePropertiesToXml);
      styles[styleKey] = {
        idList: [],
        properties: properties
      };
    }
    var currentEdgeStyle = styles[styleKey];
    // add current node id to this style
    currentEdgeStyle.idList.push(edge.data('id'));
  }

  var containerBgColor = $("#sbgn-network-container").css('background-color');
  if (containerBgColor == "transparent") {
    containerBgColor = "#ffffff";
  }
  else {
    containerBgColor = getXmlValidColor(containerBgColor);
  }

  return {
    colors: colorUsed,
    background: containerBgColor,
    styles: styles
  };
};

// see http://stackoverflow.com/a/4090628
function rgb2hex(rgb) {
     if (  rgb.search("rgb") == -1 ) {
          return rgb;
     } else {
          rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
          function hex(x) {
               return ("0" + parseInt(x).toString(16)).slice(-2);
          }
          return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]); 
     }
}

function expandShortHex(hex) {
  if (hex.length < 6) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    longhex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return "#" + r + r + g + g + b + b;
    });
    return longhex;
  }
  else {
    return hex
  }
}

// accepts short or long hex or rgb color, return sbgnml compliant color value (= long hex)
// can optionnally convert opacity value and return a 8 characer hex color
function getXmlValidColor(color, opacity) {
  var finalColor;
  if (/^#[0-9A-F]{3,8}$/i.test(color)){ // color is hex
    finalColor = expandShortHex(color);
  }
  else { // rgb case
    finalColor = rgb2hex(color);
  }
  if (typeof opacity === 'undefined') {
    return finalColor;
  }
  else { // append opacity as hex
    // see http://stackoverflow.com/questions/2877322/convert-opacity-to-hex-in-javascript
    return finalColor + Math.floor(opacity * 255).toString(16);
  }
}

appUtilities.elementValidColor = function (ele, colorProperty) {
  if (ele.data(colorProperty)) {
    if (colorProperty == 'background-color') { // special case, take in count the opacity
      if (ele.data('background-opacity')) {
        return getXmlValidColor(ele.data('background-color'), ele.data('background-opacity'));
      }
      else {
        return getXmlValidColor(ele.data('background-color'));
      }
    }
    else { // general case
      return getXmlValidColor(ele.data(colorProperty));
    }
  }
  else { // element don't have that property
    return undefined;
  }
};

/*
  returns: {
    xmlValid: id
  }
*/
appUtilities.getColorsFromElements = function (nodes, edges) {
  var colorHash = {};
  var colorID = 0;
  for(var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var bgValidColor = appUtilities.elementValidColor(node, 'background-color');
    if (!colorHash[bgValidColor]) {
      colorID++;
      colorHash[bgValidColor] = 'color_' + colorID;
    }

    var borderValidColor = appUtilities.elementValidColor(node, 'border-color');
    if (!colorHash[borderValidColor]) {
      colorID++;
      colorHash[borderValidColor] = 'color_' + colorID;
    }
  }
  for(var i=0; i<edges.length; i++) {
    var edge = edges[i];
    var lineValidColor = appUtilities.elementValidColor(edge, 'line-color');
    if (!colorHash[lineValidColor]) {
      colorID++;
      colorHash[lineValidColor] = 'color_' + colorID;
    }
  }
  return colorHash;
}

module.exports = appUtilities;
