var appUtilities = require('./app-utilities');
var inspectorUtilities = {};
var fillBioGeneContainer = require('./fill-biogene-container');

inspectorUtilities.fillInspectorStateAndInfos = function (nodes, stateAndInfos, width) {
  //first empty the state variables and infos data in inspector
  $("#inspector-state-variables").html("");
  $("#inspector-unit-of-informations").html("");
  
  for (var i = 0; i < stateAndInfos.length; i++) {
    (function(i){
      var state = stateAndInfos[i];
      if (state.clazz == "state variable") {
        $("#inspector-state-variables").append("<div><input type='text' id='inspector-state-variable-value" + i + "' class='inspector-input-box' style='width: "
                + width / 5 + "px;' value='" + (state.state.value || '') + "'/>"
                + "<span width='" + width / 5 + "'px>@</span>"
                + "<input type='text' id='inspector-state-variable-variable" + i + "' class='inspector-input-box' style='width: "
                + width / 2.5 + "px;' value='" + (state.state.variable || '')
                + "'/><img width='12px' height='12px' id='inspector-delete-state-and-info" + i + "' class='inspector-input-box' src='app/img/delete.png'></img></div>");

        $("#inspector-state-variable-value" + i).unbind('change').on('change', function () {
          chise.changeStateOrInfoBox(nodes, i, $(this).val(), 'value');
        });

        $("#inspector-state-variable-variable" + i).unbind('change').on('change', function () {
          chise.changeStateOrInfoBox(nodes, i, $(this).val(), 'variable');
        });
      }
      else if (state.clazz == "unit of information") {
        var total = width / 1.25;
        $("#inspector-unit-of-informations").append("<div><input type='text' id='inspector-unit-of-information-label" + i + "' class='inspector-input-box' style='width: "
                + total + "px;' value='" + (state.label.text || '')
                + "'/><img width='12px' height='12px' id='inspector-delete-state-and-info" + i + "' class='inspector-input-box' src='app/img/delete.png'></img></div>");

        $("#inspector-unit-of-information-label" + i).unbind('change').on('change', function () {
          chise.changeStateOrInfoBox(nodes, i, $(this).val());
        });
      }
      
      $("#inspector-delete-state-and-info" + i).unbind('click').click(function (event) {
        chise.removeStateOrInfoBox(nodes, i);
        inspectorUtilities.handleSBGNInspector();
      });
    })(i);
  }
  $("#inspector-state-variables").append("<img id='inspector-add-state-variable' src='app/img/add.png'/>");
  $("#inspector-unit-of-informations").append("<img id='inspector-add-unit-of-information' src='app/img/add.png'/>");

  $("#inspector-add-state-variable").click(function () {
    var obj = {};
    obj.clazz = "state variable";

    obj.state = {
      value: "",
      variable: ""
    };
    obj.bbox = {
      w: 30,
      h: 12
    };
    
    chise.addStateOrInfoBox(nodes, obj);
    inspectorUtilities.handleSBGNInspector();
  });

  $("#inspector-add-unit-of-information").click(function () {
    var obj = {};
    obj.clazz = "unit of information";
    obj.label = {
      text: ""
    };
    obj.bbox = {
      w: 30,
      h: 12
    };
    
    chise.addStateOrInfoBox(nodes, obj);
    inspectorUtilities.handleSBGNInspector();
  });
}

inspectorUtilities.handleSBGNInspector = function () {
  var selectedEles = cy.elements(":selected");
  
  $("#sbgn-inspector-style-panel-group").html("");
  
  if(selectedEles.length == 0){
    return;
  }
  
  var width = $("#sbgn-inspector").width() * 0.45;
  
  var allNodes = chise.elementUtilities.trueForAllElements(selectedEles, function(ele) {
    return ele.isNode();
  });
  var allEdges = chise.elementUtilities.trueForAllElements(selectedEles, function(ele) {
    return ele.isEdge();
  });
  
  if (allNodes || allEdges) {
    var sbgnlabel = chise.elementUtilities.getCommonProperty(selectedEles, "label", "data");
    if (sbgnlabel == null) {
      sbgnlabel = "";
    } else if (sbgnlabel.includes("\n")) {
      sbgnlabel = sbgnlabel.replace(new RegExp("\n", "g"), " \\n ");
    }

    var classInfo = chise.elementUtilities.getCommonProperty(selectedEles, function(ele) {
      return ele.data('class').replace(' multimer', '');
    }) || "";
    if (classInfo == 'and' || classInfo == 'or' || classInfo == 'not') {
      classInfo = classInfo.toUpperCase();
    }
    else {
      classInfo = classInfo.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
      classInfo = classInfo.replace(' Of ', ' of ');
      classInfo = classInfo.replace(' And ', ' and ');
      classInfo = classInfo.replace(' Or ', ' or ');
      classInfo = classInfo.replace(' Not ', ' not ');
    }

    var title = classInfo=="" ? "Visual Properties":classInfo + " Visual Properties";

    var buttonwidth = width;
    if (buttonwidth > 50) {
      buttonwidth = 50;
    }

    var html = "";
    
    html += "<div  class='panel-heading' data-toggle='collapse' data-target='#inspector-style-properties-toggle'><p class='panel-title accordion-toggle'>" + title + "</p></div>"
    
    html += "<div id='inspector-style-properties-toggle' class='panel-collapse collapse in'>";
    html += "<div class='panel-body'>";
    html += "<table cellpadding='0' cellspacing='0' width='100%' align= 'center'>";
    var type;
    var fillStateAndInfos;
    var multimerCheck;
    var clonedCheck;
    var commonIsMultimer;
    var commonIsCloned;
    var commonStateAndInfos;
    var commonSBGNCardinality;
    
    if (allNodes) {
      type = "node";
      
      var borderColor = chise.elementUtilities.getCommonProperty(selectedEles, "border-color", "data");
      borderColor = borderColor?borderColor:'#FFFFFF';
      
      var backgroundColor = chise.elementUtilities.getCommonProperty(selectedEles, "background-color", "data");
      backgroundColor = backgroundColor?backgroundColor:'#FFFFFF';
      
      var borderWidth = chise.elementUtilities.getCommonProperty(selectedEles, "border-width", "data");
      
      var backgroundOpacity = chise.elementUtilities.getCommonProperty(selectedEles, "background-opacity", "data");
      backgroundOpacity = backgroundOpacity?backgroundOpacity:0.5;
      
      var nodeWidth = chise.elementUtilities.getCommonProperty(selectedEles, function(ele) {
        return ele.width();
      });

      var nodeHeight = chise.elementUtilities.getCommonProperty(selectedEles, function(ele) {
        return ele.height();
      });
      
      if (chise.elementUtilities.trueForAllElements(selectedEles, chise.elementUtilities.canHaveSBGNLabel)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Label</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-label' class='inspector-input-box' type='text' style='width: " + width / 1.25 + "px;' value='" + sbgnlabel
              + "'/>" + "</td></tr>";
      }
      
      // if at least one node is not a non-resizable parent node
      if( selectedEles.filter(':parent').length != selectedEles.length ) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Width</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-node-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";

        if (nodeWidth) {
          html += " value='" + nodeWidth + "'";
        }

        html += "/>" + "</td></tr>";

        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Height</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-node-height' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";

        if (nodeHeight) {
          html += " value='" + nodeHeight + "'";
        }

        html += "/>";
        
        if( chise.elementUtilities.someMustNotBeSquare(selectedEles) ) {
          var imageName;
          var title;
          if(appUtilities.nodeResizeUseAspectRatio) {
            imageName = "lock.png";
            title = "unlock aspect ratio";
          }
          else {
            imageName = "open-lock.png";
            title = "lock aspect ratio";
          }
          
          html += "<img id='inspector-node-sizes-aspect-ratio' style='vertical-align: top; margin-left: 5px;' src='app/img/";
          html += imageName;
          html += "'";
          
          html += "title='";
          html += title;
          html += "'";
          
          html += "></img>";
        }
        
        html += "</td></tr>";
      }
      
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Border Color</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-border-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + borderColor
              + "'/>" + "</td></tr>";
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-fill-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + backgroundColor
              + "'/>" + "</td></tr>";
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Border Width</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-border-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";
      
      if(borderWidth){
        html += " value='" + parseFloat(borderWidth) + "'";
      }
      
      html += "/>" + "</td></tr>";
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Opacity</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-background-opacity' class='inspector-input-box' type='range' step='0.01' min='0' max='1' style='width: " + buttonwidth + "px;' value='" + parseFloat(backgroundOpacity)
              + "'/>" + "</td></tr>"; 
      
      if (chise.elementUtilities.trueForAllElements(selectedEles, chise.elementUtilities.canHaveSBGNLabel)) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Font</font>" + "</td><td style='padding-left: 5px;'>"
              + "<label id='inspector-font' style='cursor: pointer;width: " + buttonwidth + "px;'>"
              + "..." + "<label/>" + "</td></tr>"; 
      }
      
      commonStateAndInfos = chise.elementUtilities.getCommonProperty(selectedEles, "statesandinfos", "data");
      
      if(commonStateAndInfos){
        if (chise.elementUtilities.trueForAllElements(selectedEles, chise.elementUtilities.canHaveStateVariable)) {
          fillStateAndInfos = true;
          
          html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
          html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>State Variables</font>" + "</td>"
                  + "<td id='inspector-state-variables' style='padding-left: 5px; width: '" + width + "'></td></tr>";
        }

        if (chise.elementUtilities.canHaveUnitOfInformation(selectedEles)) {
          fillStateAndInfos = true;
          
          html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
          html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Units of Information</font>" + "</td>"
                  + "<td id='inspector-unit-of-informations' style='padding-left: 5px; width: '" + width + "'></td></tr>";
        }
      }
      
      commonIsMultimer = chise.elementUtilities.getCommonProperty(selectedEles, function(ele){
        return ele.data('class').endsWith(' multimer');
      });
      commonIsCloned = chise.elementUtilities.getCommonProperty(selectedEles, function(ele){
        return ele.data('clonemarker') === true;
      });
      
      multimerCheck = chise.elementUtilities.trueForAllElements(selectedEles, chise.elementUtilities.canBeMultimer);
      clonedCheck = chise.elementUtilities.trueForAllElements(selectedEles, chise.elementUtilities.canBeCloned);
      
      multimerCheck = multimerCheck?multimerCheck:false;
      clonedCheck = clonedCheck?clonedCheck:false;

      if (multimerCheck || clonedCheck) {
        html += "<tr><td colspan='2'><hr class='inspector-divider'></td></tr>";
      }

      if (multimerCheck) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Multimer</font>" + "</td>"
                + "<td style='padding-left: 5px; width: '" + width + "'><input type='checkbox' id='inspector-is-multimer'></td></tr>";
      }

      if (clonedCheck) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Cloned</font>" + "</td>"
                + "<td style='padding-left: 5px; width: '" + width + "'><input type='checkbox' id='inspector-is-clone-marker'></td></tr>";
      }
      
      /*
       * If all selected elements can have ports add a selectbox to enable setting their ports ordering.
       */
      if ( chise.elementUtilities.trueForAllElements(selectedEles, chise.elementUtilities.canHavePorts.bind(chise.elementUtilities)) ) {
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Ports Ordering</font>" + "</td>"
                + "<td style='padding-left: 5px; width: '" + width + "'>"; 
        
        html += "<select id='inspector-ports-ordering-select' class='input-medium layout-text' name='inspector-ports-ordering-select'>";
        
        var optionsStr = "";
        
        // Get the common ordering of the nodes
        var commonOrdering = chise.elementUtilities.getCommonProperty(selectedEles, function(ele) {
          return chise.elementUtilities.getPortsOrdering(ele);
        });
        
        var commonOrderingVal = commonOrdering || "empty"; // If there is no common ordering we should use "empty" for common ordering value
        
        var orderings = ["", "none", "left to right", "right to left", "bottom to top", "top to bottom"];
        var values = ["empty", "none", "L-to-R", "R-to-L", "B-to-T", "T-to-B"];
    
        // For all possible values create an option str and append it to options str
        for ( var i = 0; i < orderings.length; i++ ) {
          var ordering = orderings[i];
          var optionVal = values[i];
          var optionId = "inspector-ports-ordering-" + optionVal; // Option id is generated from option value
          var optionStr = "<option id='" + optionId + "'" 
                  + " value='" + optionVal + "'";

          if ( optionVal === commonOrderingVal ) {
            optionStr += " selected";
          }

          optionStr += "> ";
          optionStr += ordering;
          optionStr += " </option>";

          optionsStr += optionStr;
        }

        html += optionsStr; // The string to represent this option in selectbox

        html += "</select>";
        
        html += "</td></tr>";
      }
    }
    else {
      type = "edge";
      
      var commonLineColor = chise.elementUtilities.getCommonProperty(selectedEles, "line-color", "data");
      commonLineColor = commonLineColor?commonLineColor:'#FFFFFF';
      
      var commonLineWidth = chise.elementUtilities.getCommonProperty(selectedEles, "width", "data");
      
      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Fill Color</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-line-color' class='inspector-input-box' type='color' style='width: " + buttonwidth + "px;' value='" + commonLineColor
              + "'/>" + "</td></tr>";

      html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Width</font>" + "</td><td style='padding-left: 5px;'>"
              + "<input id='inspector-edge-width' class='inspector-input-box float-input' type='text' min='0' style='width: " + buttonwidth + "px;'";
      
      if(commonLineWidth){
        html += " value='" + parseFloat(commonLineWidth) + "'";
      }
      
      html += "/>" + "</td></tr>";
      
      if (chise.elementUtilities.canHaveSBGNCardinality(selectedEles)) {
        var cardinality = chise.elementUtilities.getCommonProperty(selectedEles, "cardinality", "data");
        commonSBGNCardinality = cardinality;
        
        if (cardinality <= 0) {
          cardinality = undefined;
        }
        html += "<tr><td style='width: " + width + "px; text-align:right; padding-right: 5px;'>" + "<font class='sbgn-label-font'>Cardinality</font>" + "</td><td style='padding-left: 5px;'>"
                + "<input id='inspector-cardinality' class='inspector-input-box integer-input' type='text' min='0' style='width: " + buttonwidth + "px;'";
        
        if(cardinality != null) {
          html += "value='" + cardinality + "'/>";
        }
        
        html += "</td></tr>";
      }

    }
    html += "</table></div>";
    
    if(selectedEles.length == 1){
      var setAsDefaultTitle = "Set as Default for " + classInfo;
      html += "<div style='text-align: center; margin-top: 5px;'><button class='btn btn-default' style='align: center;' id='inspector-set-as-default-button'"
            + ">" + setAsDefaultTitle + "</button></div>";
    }
    
//    html += "<hr class='inspector-divider' style='border-width: 3px;'>";
    html += "</div>";
    
    $('#sbgn-inspector-style-panel-group').append('<div id="sbgn-inspector-style-properties-panel" class="panel" ></div>');
    $("#sbgn-inspector-style-properties-panel").html(html);
    
    if (selectedEles.length === 1) {
      var geneClass = selectedEles[0]._private.data.class;
      
      if (geneClass === 'macromolecule' || geneClass === 'nucleic acid feature' ||
          geneClass === 'unspecified entity') {
          html = "";
    
          html += "<div  class='panel-heading collapsed' data-toggle='collapse' data-target='#biogene-collapsable'><p class='panel-title accordion-toggle'>Properties from EntrezGene</p></div>"
    
          html += "<div style='margin-top: 5px;align: center;text-align: center;' id='biogene-collapsable' class='panel-collapse collapse'>";
          html += "<div class='panel-body' style='padding-left: 3px;' id='biogene-title'></div>";
          html += "<div id='biogene-container'></div>";
          html += "</div>";
//          html += "<hr class='inspector-divider'>";
          
          $('#sbgn-inspector-style-panel-group').append('<div id="sbgn-inspector-style-entrezgene-panel" class="panel" ></div>');
          $("#sbgn-inspector-style-entrezgene-panel").html(html);
          fillBioGeneContainer(selectedEles[0]);
      }
    }

    if (type == "node") {
      if (fillStateAndInfos) {
        inspectorUtilities.fillInspectorStateAndInfos(selectedEles, commonStateAndInfos, width);
      }

      if (multimerCheck && commonIsMultimer) {
        $('#inspector-is-multimer').attr('checked', true);
      }

      if (clonedCheck && commonIsCloned) {
        $('#inspector-is-clone-marker').attr('checked', true);
      }

      $('#inspector-set-as-default-button').on('click', function () {
        var multimer;
        var selected = selectedEles[0];
        var sbgnclass = selected.data('class');
        if (sbgnclass.endsWith(' multimer')) {
          sbgnclass = sbgnclass.replace(' multimer', '');
          multimer = true;
        }
        if (chise.elementUtilities.defaultProperties[sbgnclass] == null) {
          chise.elementUtilities.defaultProperties[sbgnclass] = {};
        }

        if (appUtilities.undoable) {
          var ur = cy.undoRedo();
          var actions = [];
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'width', value: selected.width()}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'height', value: selected.height()}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'clonemarker', value: selected._private.data.clonemarker}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'multimer', value: multimer}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'border-width', value: selected.data('border-width')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'border-color', value: selected.data('border-color')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'background-color', value: selected.data('background-color')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'background-opacity', value: selected.data('background-opacity')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-size', value: selected.data('font-size')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-family', value: selected.data('font-family')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-weight', value: selected.data('font-weight')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'font-style', value: selected.data('font-style')}});
          ur.do("batch", actions);
        }
        else {
          var defaults = chise.elementUtilities.defaultProperties[sbgnclass];
          defaults['width'] = selected.width();
          defaults['height'] = selected.height();
          defaults['clonemarker'] = selected._private.data.clonemarker;
          defaults['multimer'] = multimer;
          defaults['border-width'] = selected.data('border-width');
          defaults['border-color'] = selected.data('border-color');
          defaults['background-color'] = selected.data('background-color');
          defaults['background-opacity'] = selected.data('background-opacity');
          defaults['font-size'] = selected.data('font-size');
          defaults['font-family'] = selected.data('font-family');
          defaults['font-weight'] = selected.data('font-weight');
          defaults['font-style'] = selected.data('font-style');
        }
      });

      $("#inspector-ports-ordering-select").on('change', function() {
        var ordering = this.value;
        chise.setPortsOrdering( selectedEles, ordering );
      });

      $("#inspector-node-width, #inspector-node-height").change( function () {
        var w = parseFloat($("#inspector-node-width").val());
        var h = parseFloat($("#inspector-node-height").val());
        
        if( $(this).attr('id') === 'inspector-node-width' ) {
          h = undefined;
        }
        else {
          w = undefined;
        }
        
        var useAspectRatio = appUtilities.nodeResizeUseAspectRatio;
        
        chise.resizeNodes(selectedEles, w, h, useAspectRatio);

        // if aspect ratio used, must correctly update the other side length
        if(useAspectRatio){
          if( $(this).attr('id') === 'inspector-node-width' ) {
            var nodeHeight = chise.elementUtilities.getCommonProperty(selectedEles, function(ele) {
              return ele.height();
            });
            $("#inspector-node-height").val(nodeHeight);
          }
          else {
            var nodeWidth = chise.elementUtilities.getCommonProperty(selectedEles, function(ele) {
              return ele.width();
            });
            $("#inspector-node-width").val(nodeWidth);
          }
        }


      });

      $('#inspector-node-sizes-aspect-ratio').on('click', function() {
        if(appUtilities.nodeResizeUseAspectRatio == null) {
          appUtilities.nodeResizeUseAspectRatio = false;
        }
        
        appUtilities.nodeResizeUseAspectRatio = !appUtilities.nodeResizeUseAspectRatio;
        
        // refresh image
        if (appUtilities.nodeResizeUseAspectRatio) {
          imageName = "lock.png";
          title = "unlock aspect ratio";
        }
        else {
          imageName = "open-lock.png";
          title = "lock aspect ratio";
        }
        
        $(this).attr('src', 'app/img/' + imageName);
        $(this).attr('title', title);
      });

      $('#inspector-is-multimer').on('click', function () {
        chise.setMultimerStatus(selectedEles, $('#inspector-is-multimer').prop('checked'));
      });

      $('#inspector-is-clone-marker').on('click', function () {
        chise.setCloneMarkerStatus(selectedEles, $('#inspector-is-clone-marker').prop('checked'));
      });

      $("#inspector-border-color").on('change', function () {
        chise.changeData(selectedEles, "border-color", $("#inspector-border-color").val());
      });

      $("#inspector-label").on('change', function () {
        var lines = $(this).val().trim();
        var current_label_data = selectedEles.data('label').replace(new RegExp("\n", "g"), " \\n ").trim();

        if (current_label_data !== lines){
          lines = lines.split("\\n");
          lines = $.map(lines, function(x) {
            x = x.trim();
            if (x) return (x);
          });
          lines = lines.join("\n");

          chise.changeNodeLabel(selectedEles, lines);
        }
      });

      $("#inspector-label").on('keydown', function (e) {
        var current_insp_lable = $(this).val();
        if (e.keyCode == 13 && e.shiftKey) {
          var cursor_position = $(this)[0].selectionStart;
          var tmp = $(this).val().substring(0, cursor_position) + " \\n " + $(this).val().substring(cursor_position);
          $(this).val(tmp);
        } else if (e.keyCode == 13 && !e.shiftKey) {
          $(this).trigger("change");
        }
      });

      $("#inspector-background-opacity").on('change', function () {
        chise.changeData(selectedEles, "background-opacity", $("#inspector-background-opacity").val());
      });

      $("#inspector-fill-color").on('change', function () {
        chise.changeData(selectedEles, "background-color", $("#inspector-fill-color").val());
      });

      $("#inspector-border-width").change( function () {
        chise.changeData(selectedEles, "border-width", $("#inspector-border-width").val());
      });
      
      // Open font properties dialog
      $("#inspector-font").on('click', function () {
        appUtilities.fontPropertiesView.render(selectedEles);
      });
    }
    else {
      $('#inspector-set-as-default-button').on('click', function () {
        var sbgnclass = selectedEles.data('class');
        if (chise.elementUtilities.defaultProperties[sbgnclass] == null) {
          chise.elementUtilities.defaultProperties[sbgnclass] = {};
        }

        if (appUtilities.undoable) {
          var ur = cy.undoRedo();
          var actions = [];
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'width', value: selectedEles.data('width')}});
          actions.push({name: "setDefaultProperty", param: {class: sbgnclass, name: 'line-color', value: selectedEles.data('line-color')}});
          ur.do("batch", actions);
        }
        else {
          var defaults = chise.elementUtilities.defaultProperties[sbgnclass];
          defaults['width'] = selectedEles.data('width');
          defaults['line-color'] = selectedEles.data('line-color');
        }
      });

      $("#inspector-line-color").on('change', function () {
        chise.changeData(selectedEles, "line-color", $("#inspector-line-color").val());
      });

      $("#inspector-cardinality").change( function () {
        var data = Math.round($("#inspector-cardinality").val());

        if (data < 0) {
          if (commonSBGNCardinality == 0) {
            inspectorUtilities.handleSBGNInspector();
            return;
          }
          data = 0;
        }
        
        chise.changeData(selectedEles, "cardinality", data);
      });

      $("#inspector-edge-width").change( function () {
        chise.changeData(selectedEles, "width", $("#inspector-edge-width").val());
      });
    }
  }
};

module.exports = inspectorUtilities;