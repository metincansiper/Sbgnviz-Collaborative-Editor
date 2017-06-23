var jquery = $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var appUtilities = require('./app-utilities');
var setFileContent = appUtilities.setFileContent.bind(appUtilities);

/**
 * Backbone view for the BioGene information.
 */
var BioGeneView = Backbone.View.extend({
  /*
   * Copyright 2013 Memorial-Sloan Kettering Cancer Center.
   *
   * This file is part of PCViz.
   *
   * PCViz is free software: you can redistribute it and/or modify
   * it under the terms of the GNU Lesser General Public License as published by
   * the Free Software Foundation, either version 3 of the License, or
   * (at your option) any later version.
   *
   * PCViz is distributed in the hope that it will be useful,
   * but WITHOUT ANY WARRANTY; without even the implied warranty of
   * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   * GNU Lesser General Public License for more details.
   *
   * You should have received a copy of the GNU Lesser General Public License
   * along with PCViz. If not, see <http://www.gnu.org/licenses/>.
   */

  render: function () {
    // pass variables in using Underscore.js template
    var variables = {
      geneDescription: this.model.geneDescription,
      geneAliases: this.parseDelimitedInfo(this.model.geneAliases, ":", ",", null),
      geneDesignations: this.parseDelimitedInfo(this.model.geneDesignations, ":", ",", null),
      geneLocation: this.model.geneLocation,
      geneMim: this.model.geneMim,
      geneId: this.model.geneId,
      geneUniprotId: this.extractFirstUniprotId(this.model.geneUniprotMapping),
      geneUniprotLinks: this.generateUniprotLinks(this.model.geneUniprotMapping),
      geneSummary: this.model.geneSummary
    };

    // compile the template using underscore
    var template = _.template($("#biogene-template").html());
    template = template(variables);

    // load the compiled HTML into the Backbone "el"
    this.$el.html(template);

    // format after loading
    this.format(this.model);

    return this;
  },
  format: function ()
  {
    // hide rows with undefined data
    if (this.model.geneDescription == undefined)
      this.$el.find(".biogene-description").hide();

    if (this.model.geneAliases == undefined)
      this.$el.find(".biogene-aliases").hide();

    if (this.model.geneDesignations == undefined)
      this.$el.find(".biogene-designations").hide();

    if (this.model.geneChromosome == undefined)
      this.$el.find(".biogene-chromosome").hide();

    if (this.model.geneLocation == undefined)
      this.$el.find(".biogene-location").hide();

    if (this.model.geneMim == undefined)
      this.$el.find(".biogene-mim").hide();

    if (this.model.geneId == undefined)
      this.$el.find(".biogene-id").hide();

    if (this.model.geneUniprotMapping == undefined)
      this.$el.find(".biogene-uniprot-links").hide();

    if (this.model.geneSummary == undefined)
      this.$el.find(".node-details-summary").hide();

    var expanderOpts = {slicePoint: 150,
      expandPrefix: ' ',
      expandText: ' (...)',
      userCollapseText: ' (show less)',
      moreClass: 'expander-read-more',
      lessClass: 'expander-read-less',
      detailClass: 'expander-details',
      // do not use default effects
      // (see https://github.com/kswedberg/jquery-expander/issues/46)
      expandEffect: 'fadeIn',
      collapseEffect: 'fadeOut'};

    $(".biogene-info .expandable").expander(expanderOpts);

    expanderOpts.slicePoint = 2; // show comma and the space
    expanderOpts.widow = 0; // hide everything else in any case
  },
  generateUniprotLinks: function (mapping) {
    var formatter = function (id) {
      return _.template($("#uniprot-link-template").html(), {id: id});
    };

    if (mapping == undefined || mapping == null)
    {
      return "";
    }

    // remove first id (assuming it is already processed)
    if (mapping.indexOf(':') < 0)
    {
      return "";
    }
    else
    {
      mapping = mapping.substring(mapping.indexOf(':') + 1);
      return ', ' + this.parseDelimitedInfo(mapping, ':', ',', formatter);
    }
  },
  extractFirstUniprotId: function (mapping) {
    if (mapping == undefined || mapping == null)
    {
      return "";
    }

    var parts = mapping.split(":");

    if (parts.length > 0)
    {
      return parts[0];
    }

    return "";
  },
  parseDelimitedInfo: function (info, delimiter, separator, formatter) {
    // do not process undefined or null values
    if (info == undefined || info == null)
    {
      return info;
    }

    var text = "";
    var parts = info.split(delimiter);

    if (parts.length > 0)
    {
      if (formatter)
      {
        text = formatter(parts[0]);
      }
      else
      {
        text = parts[0];
      }
    }

    for (var i = 1; i < parts.length; i++)
    {
      text += separator + " ";

      if (formatter)
      {
        text += formatter(parts[i]);
      }
      else
      {
        text += parts[i];
      }
    }

    return text;
  }
});

/**
 * SBGN Layout view for the Sample Application.
 */
var LayoutPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.copyProperties();

    self.template = _.template($("#layout-settings-template").html());
    self.template = self.template(appUtilities.currentLayoutProperties);
  },
  copyProperties: function () {
    appUtilities.currentLayoutProperties = _.clone(appUtilities.defaultLayoutProperties);
  },
  applyLayout: function (preferences, notUndoable) {
    if (preferences === undefined) {
      preferences = {};
    }
    var options = $.extend({}, appUtilities.currentLayoutProperties, preferences);
    var verticalPaddingPercent = options.tilingPaddingVertical;
    var horizontalPaddingPercent = options.tilingPaddingHorizontal;
    // In dialog properties we keep tiling padding vertical/horizontal percentadges to be displayed
    // in dialog, in layout options we use a function using these values
    options.tilingPaddingVertical = function () {
      return chise.calculatePaddings(verticalPaddingPercent);
    };
    options.tilingPaddingHorizontal = function () {
      return chise.calculatePaddings(horizontalPaddingPercent);
    };
    chise.performLayout(options, notUndoable);
  },
  render: function () {
    var self = this;

    self.template = _.template($("#layout-settings-template").html());
    self.template = self.template(appUtilities.currentLayoutProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#save-layout").on("click", "#save-layout", function (evt) {
      appUtilities.currentLayoutProperties.nodeRepulsion = Number(document.getElementById("node-repulsion").value);
      appUtilities.currentLayoutProperties.idealEdgeLength = Number(document.getElementById("ideal-edge-length").value);
      appUtilities.currentLayoutProperties.edgeElasticity = Number(document.getElementById("edge-elasticity").value);
      appUtilities.currentLayoutProperties.nestingFactor = Number(document.getElementById("nesting-factor").value);
      appUtilities.currentLayoutProperties.gravity = Number(document.getElementById("gravity").value);
      appUtilities.currentLayoutProperties.numIter = Number(document.getElementById("num-iter").value);
      appUtilities.currentLayoutProperties.tile = document.getElementById("tile").checked;
      appUtilities.currentLayoutProperties.animate = document.getElementById("animate").checked ? 'during' : 'end';
      appUtilities.currentLayoutProperties.randomize = !document.getElementById("incremental").checked;
      appUtilities.currentLayoutProperties.gravityRangeCompound = Number(document.getElementById("gravity-range-compound").value);
      appUtilities.currentLayoutProperties.gravityCompound = Number(document.getElementById("gravity-compound").value);
      appUtilities.currentLayoutProperties.gravityRange = Number(document.getElementById("gravity-range").value);
      appUtilities.currentLayoutProperties.tilingPaddingVertical = Number(document.getElementById("tiling-padding-vertical").value);
      appUtilities.currentLayoutProperties.tilingPaddingHorizontal = Number(document.getElementById("tiling-padding-horizontal").value);
    
	
      $(self.el).modal('toggle');
      $(document).trigger('saveLayout');
    });

    $(document).off("click", "#default-layout").on("click", "#default-layout", function (evt) {
      self.copyProperties();

      self.template = _.template($("#layout-settings-template").html());
      self.template = self.template(appUtilities.currentLayoutProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});


var ColorSchemeMenuView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#color-scheme-menu-template").html());
    $(document).on("click", "a.map-color-scheme", function (evt) {
      var raw_id = $(this).attr('id');
      var scheme_id = raw_id.replace("map-color-scheme_", "");
      appUtilities.applyMapColorScheme(scheme_id);
    });
  },
  render: function () {
    var self = this;
    self.template = _.template($("#color-scheme-menu-template").html());
    $(self.el).html(self.template);
    return this;
  }
});

/**
 * SBGN Properties view for the Sample Application.
 */
var GeneralPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#general-properties-template").html());
    self.template = self.template(appUtilities.currentGeneralProperties);
  },
  copyProperties: function () {
    appUtilities.currentGeneralProperties = _.clone(appUtilities.defaultGeneralProperties);
  },
  render: function () {
    var self = this;
    self.template = _.template($("#general-properties-template").html());
    self.template = self.template(appUtilities.currentGeneralProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#save-sbgn").on("click", "#save-sbgn", function (evt) {
      appUtilities.currentGeneralProperties.compoundPadding = Number(document.getElementById("compound-padding").value);
      appUtilities.currentGeneralProperties.dynamicLabelSize = $('select[name="dynamic-label-size"] option:selected').val();
      appUtilities.currentGeneralProperties.fitLabelsToNodes = document.getElementById("fit-labels-to-nodes").checked;
      appUtilities.currentGeneralProperties.rearrangeAfterExpandCollapse =
              document.getElementById("rearrange-after-expand-collapse").checked;
      appUtilities.currentGeneralProperties.animateOnDrawingChanges =
              document.getElementById("animate-on-drawing-changes").checked;
      appUtilities.currentGeneralProperties.adjustNodeLabelFontSizeAutomatically =
          document.getElementById("adjust-node-label-font-size-automatically").checked;
      appUtilities.currentGeneralProperties.enablePorts =
          document.getElementById("enable-ports").checked;

      chise.refreshPaddings(); // Refresh/recalculate paddings
      if (appUtilities.currentGeneralProperties.enablePorts) {
        chise.enablePorts();
      }
      else {
        chise.disablePorts();
      }
      cy.style().update();
      
      $(self.el).modal('toggle');
      $(document).trigger('saveGeneralProperties');
    });

    $(document).off("click", "#default-sbgn").on("click", "#default-sbgn", function (evt) {
      self.copyProperties();
      self.template = _.template($("#general-properties-template").html());
      self.template = self.template(appUtilities.currentGeneralProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});

/**
 * Paths Between Query view for the Sample Application.
 */
var PathsBetweenQueryView = Backbone.View.extend({
  defaultQueryParameters: {
    geneSymbols: "",
    lengthLimit: 1
  },
  currentQueryParameters: null,
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#query-pathsbetween-template").html());
    self.template = self.template(self.currentQueryParameters);
  },
  copyProperties: function () {
    this.currentQueryParameters = _.clone(this.defaultQueryParameters);
  },
  render: function () {
    var self = this;
    self.template = _.template($("#query-pathsbetween-template").html());
    self.template = self.template(self.currentQueryParameters);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#save-query-pathsbetween").on("click", "#save-query-pathsbetween", function (evt) {

      self.currentQueryParameters.geneSymbols = document.getElementById("query-pathsbetween-gene-symbols").value;
      self.currentQueryParameters.lengthLimit = Number(document.getElementById("query-pathsbetween-length-limit").value);

      if (self.currentQueryParameters.geneSymbols.length === 0) {
        document.getElementById("query-pathsbetween-gene-symbols").focus();
        return;
      }

      var queryURL = "http://www.pathwaycommons.org/pc2/graph?format=SBGN&kind=PATHSBETWEEN&limit="
              + self.currentQueryParameters.lengthLimit;
      
      var sources = "";
      var filename = "";
      var geneSymbolsArray = self.currentQueryParameters.geneSymbols.replace("\n", " ").replace("\t", " ").split(" ");
      
      for (var i = 0; i < geneSymbolsArray.length; i++) {
        var currentGeneSymbol = geneSymbolsArray[i];
        if (currentGeneSymbol.length == 0 || currentGeneSymbol == ' '
                || currentGeneSymbol == '\n' || currentGeneSymbol == '\t') {
          continue;
        }
        sources = sources + "&source=" + currentGeneSymbol;
        if (filename == '') {
          filename = currentGeneSymbol;
        } else {
          filename = filename + '_' + currentGeneSymbol;
        }
      }
      filename = filename + '_PATHSBETWEEN.sbgnml';
      setFileContent(filename);

      chise.startSpinner('paths-between-spinner');

      queryURL = queryURL + sources;
      $.ajax({
        url: queryURL,
        type: 'GET',
        success: function (data) {
          chise.updateGraph(chise.convertSbgnmlToJson(data));
          chise.endSpinner('paths-between-spinner');
        }
      });

      $(self.el).modal('toggle');
    });

    $(document).off("click", "#cancel-query-pathsbetween").on("click", "#cancel-query-pathsbetween", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

/**
 * Paths By URI Query view for the Sample Application.
 */
var PathsByURIQueryView = Backbone.View.extend({
    defaultQueryParameters: {
        URI: ""
    },
    currentQueryParameters: null,
    initialize: function () {
        var self = this;
        self.copyProperties();
        self.template = _.template($("#query-pathsbyURI-template").html());
        self.template = self.template(self.currentQueryParameters);
    },
    copyProperties: function () {
        this.currentQueryParameters = _.clone(this.defaultQueryParameters);
    },
    render: function () {
        var self = this;
        self.template = _.template($("#query-pathsbyURI-template").html());
        self.template = self.template(self.currentQueryParameters);
        $(self.el).html(self.template);

        $(self.el).modal('show');

        $(document).off("click", "#save-query-pathsbyURI").on("click", "#save-query-pathsbyURI", function (evt) {

            self.currentQueryParameters.URI = document.getElementById("query-pathsbyURI-URI").value;

            if (self.currentQueryParameters.URI.length === 0) {
                document.getElementById("query-pathsbyURI-gene-symbols").focus();
                return;
            }

            var queryURL = "http://www.pathwaycommons.org/pc2/get?uri="
                + self.currentQueryParameters.URI + "&format=SBGN";
          /*var queryURL = "http://www.pathwaycommons.org/pc2/get?uri=http://identifiers.org/uniprot/"
           + self.currentQueryParameters.URI + "&format=SBGN";*/
            var filename = "";
            var uri = self.currentQueryParameters.URI;

            if (filename == '') {
                filename = uri;
            } else {
                filename = filename + '_' + uri;
            }

            filename = filename + '_URI.sbgnml';
            setFileContent(filename);

            chise.startSpinner('paths-between-spinner');

            $.ajax({
                url: queryURL,
                type: 'GET',
                success: function (data) {
                    chise.updateGraph(chise.convertSbgnmlToJson(data));
                    chise.endSpinner('paths-between-spinner');
                }
            });

            $(self.el).modal('toggle');
        });

        $(document).off("click", "#cancel-query-pathsbyURI").on("click", "#cancel-query-pathsbyURI", function (evt) {
            $(self.el).modal('toggle');
        });

        return this;
    }
});

/*
  There was a side effect of using this modal prompt when clicking on New.
  If the user would click on save, then the save box asking for the filename (FileSaveView) would appear
  but the map was already wiped at this point, so after setting the filename and clicking on save
  the user would end up saving an empty map.
  So this PromptSaveView isn't used for now, replaced by PromptConfirmationView.
*/
var PromptSaveView = Backbone.View.extend({
  
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-save-template").html());
  },
  render: function (afterFunction) {
    var self = this;
    self.template = _.template($("#prompt-save-template").html());
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#prompt-save-accept").on("click", "#prompt-save-accept", function (evt) {
      $("#save-as-sbgnml").trigger('click');
      afterFunction();
      $(self.el).modal('toggle');
    });
    
    $(document).off("click", "#prompt-save-reject").on("click", "#prompt-save-reject", function (evt) {
      afterFunction();
      $(self.el).modal('toggle');
    });
    
    $(document).off("click", "#prompt-save-cancel").on("click", "#prompt-save-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

/*
  Ask for filename before saving and triggering the actual browser download popup.
*/
var FileSaveView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#file-save-template").html());
  },
  render: function () {
    var self = this;
    self.template = _.template($("#file-save-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    var filename = document.getElementById('file-name').innerHTML;
    $("#file-save-filename").val(filename);

    $(document).off("click", "#file-save-accept").on("click", "#file-save-accept", function (evt) { 
      filename = $("#file-save-filename").val();
      appUtilities.setFileContent(filename);
      var renderInfo = appUtilities.getAllStyles();
      chise.saveAsSbgnml(filename, renderInfo);
      $(self.el).modal('toggle');
    });

    $(document).off("click", "#file-save-cancel").on("click", "#file-save-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

/*
  Simple Yes/No confirmation modal box. See PromptSaveView.
*/
var PromptConfirmationView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.template = _.template($("#prompt-confirmation-template").html());
  },
  render: function (afterFunction) {
    var self = this;
    self.template = _.template($("#prompt-confirmation-template").html());

    $(self.el).html(self.template);
    $(self.el).modal('show');

    $(document).off("click", "#prompt-confirmation-accept").on("click", "#prompt-confirmation-accept", function (evt) { 
      afterFunction();
      $(self.el).modal('toggle');
    });

    $(document).off("click", "#prompt-confirmation-cancel").on("click", "#prompt-confirmation-cancel", function (evt) {
      $(self.el).modal('toggle');
    });

    return this;
  }
});

var ReactionTemplateView = Backbone.View.extend({
  addMacromolecule: function (i) {
    var html = "<tr><td>"
        + "<input type='text' class='template-reaction-textbox sbgn-input-medium layout-text' name='"
        + i + "' value=''></input>"
        + "</td><td><img style='vertical-align: text-bottom; margin-bottom:2px; margin-top:2px;' class='template-reaction-delete-button' width='12px' height='12px' name='" + i + "' src='app/img/delete.png'/></td></tr>";

    $('#template-reaction-dissociated-table :input.template-reaction-textbox').last().closest('tr').after(html);
    return html;
  },
  removeMacromolecule: function (i) {
    $('#template-reaction-dissociated-table :input.template-reaction-textbox[name="'+i+'"]').closest('tr').remove();
  },
  switchInputOutput: function () {
    var saveHtmlContent = $("#reaction-template-left-td").html();
    $("#reaction-template-left-td").html($("#reaction-template-right-td").html());
    $("#reaction-template-right-td").html(saveHtmlContent);
  },
  getAllParameters: function () {
    var templateType = $('#reaction-template-type-select').val();
    var templateReactionComplexName = $('#template-reaction-complex-name').val();
    var macromoleculeList = $('#template-reaction-dissociated-table :input.template-reaction-textbox').map(function(){
        return $(this).val()
      }).toArray();
    // enable complex name only if the user provided something
    var templateReactionEnableComplexName = $.trim(templateReactionComplexName).length != 0;

    return {
      templateType: templateType,
      templateReactionComplexName: templateReactionComplexName,
      macromoleculeList: macromoleculeList,
      templateReactionEnableComplexName: templateReactionEnableComplexName
    }
  },
  disableDeleteButtonStyle: function () {
    $("img.template-reaction-delete-button").css("opacity", 0.2);
    $("img.template-reaction-delete-button").css("cursor", "default");
  },
  enableDeleteButtonStyle: function() {
    $("img.template-reaction-delete-button").css("opacity",1);
    $("img.template-reaction-delete-button").css("cursor", "pointer");
  },
  initialize: function() {
    var self = this;
    self.template = _.template($("#reaction-template-template").html());

    $(document).on('change', '#reaction-template-type-select', function (e) {
      var valueSelected = $(this).val();
      self.switchInputOutput();
    });

    $(document).on("change", "#template-reaction-complex-name", function(e){
      var value = $(this).val();
      $(this).attr('value', value); // set the value in the html tag, so it is remembered when switched
    });

    $(document).on("click", "#template-reaction-add-button", function (event) {
      // get the last input name and add 1
      var nextIndex = parseInt($('#template-reaction-dissociated-table :input.template-reaction-textbox').last().attr('name')) + 1;
      self.addMacromolecule(nextIndex);
      self.enableDeleteButtonStyle();
    });

    $(document).on('change', ".template-reaction-textbox", function () {
      var value = $(this).val();
      $(this).attr('value', value); // set the value in the html tag, so it is remembered when switched
    });

    $(document).on("click", ".template-reaction-delete-button", function (event) {
      if($('#template-reaction-dissociated-table :input.template-reaction-textbox').length <= 2){
        return;
      }
      var index = parseInt($(this).attr('name'));
      self.removeMacromolecule(index);
      if($('#template-reaction-dissociated-table :input.template-reaction-textbox').length <= 2){
        self.disableDeleteButtonStyle();
      }
    });

    $(document).on("click", "#create-template", function (evt) {
      var params = self.getAllParameters();

      var templateType = params.templateType;
      var macromoleculeList = params.macromoleculeList;
      var complexName = params.templateReactionEnableComplexName ? params.templateReactionComplexName : undefined;
      var tilingPaddingVertical = chise.calculatePaddings(appUtilities.currentLayoutProperties.tilingPaddingVertical);
      var tilingPaddingHorizontal = chise.calculatePaddings(appUtilities.currentLayoutProperties.tilingPaddingHorizontal);

      chise.createTemplateReaction(templateType, macromoleculeList, complexName, undefined, tilingPaddingVertical, tilingPaddingHorizontal);

      $(self.el).modal('toggle');
    });

    $(document).on("click", "#cancel-template", function (evt) {
      $(self.el).modal('toggle');
    });
  },
  render: function() {
    var self = this;
    self.template = _.template($("#reaction-template-template").html());
    $(self.el).html(self.template);
    self.disableDeleteButtonStyle();

    $(self.el).modal('show');

    return this;
  }
});

var GridPropertiesView = Backbone.View.extend({
  initialize: function () {
    var self = this;
    self.copyProperties();
    self.template = _.template($("#grid-properties-template").html());
    self.template = self.template(appUtilities.currentGridProperties);
  },
  copyProperties: function () {
    appUtilities.currentGridProperties = _.clone(appUtilities.defaultGridProperties);
  },
  render: function () {
    var self = this;
    self.template = _.template($("#grid-properties-template").html());
    self.template = self.template(appUtilities.currentGridProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');
	
	// Enable Show Grid when Snap to Grid is enabled
	$(document).ready(function(){
	  $("#snap-to-grid").change(function(){
		$("#show-grid").prop('checked', true);
	  });
	});

    $(document).off("click", "#save-grid").on("click", "#save-grid", function (evt) {
      appUtilities.currentGridProperties.showGrid = document.getElementById("show-grid").checked;
      appUtilities.currentGridProperties.snapToGrid = document.getElementById("snap-to-grid").checked;
      appUtilities.currentGridProperties.snapToAlignmentLocation = document.getElementById("snap-to-alignment-location").checked;
      appUtilities.currentGridProperties.gridSize = Number(document.getElementById("grid-size").value);
      appUtilities.currentGridProperties.discreteDrag = document.getElementById("discrete-drag").checked;
      appUtilities.currentGridProperties.autoResizeNodes = document.getElementById("auto-resize-nodes").checked;
      appUtilities.currentGridProperties.showGeometricGuidelines = document.getElementById("show-geometric-guidelines").checked;
      appUtilities.currentGridProperties.showDistributionGuidelines = document.getElementById("show-distribution-guidelines").checked;
      appUtilities.currentGridProperties.showInitPosAlignment = document.getElementById("show-init-Pos-Alignment").checked;
      appUtilities.currentGridProperties.guidelineTolerance = Number(document.getElementById("guideline-tolerance").value);
      appUtilities.currentGridProperties.guidelineColor = document.getElementById("geometric-guideline-color").value;
      appUtilities.currentGridProperties.horizontalGuidelineColor = document.getElementById("horizontal-guideline-color").value;
      appUtilities.currentGridProperties.verticalGuidelineColor = document.getElementById("vertical-guideline-color").value;
      appUtilities.currentGridProperties.initPosAlignmentColor = document.getElementById("init-Pos-Alignment-Color").value;
      appUtilities.currentGridProperties.geometricAlignmentRange = Number(document.getElementById("geometric-alignment-range").value);
      appUtilities.currentGridProperties.distributionAlignmentRange = Number(document.getElementById("distribution-alignment-range").value);

	  // Line styles for guidelines
      appUtilities.currentGridProperties.initPosAlignmentLine = $('select[name="init-Pos-Alignment-Line"] option:selected').val().split(',').map(Number);
      appUtilities.currentGridProperties.lineDash = $('select[id="geometric-Alignment-Line"] option:selected').val().split(',').map(Number),
      appUtilities.currentGridProperties.horizontalDistLine = $('select[name="horizontal-Dist-Alignment-Line"] option:selected').val().split(',').map(Number);
      appUtilities.currentGridProperties.verticalDistLine = $('select[name="vertical-Dist-Alignment-Line"] option:selected').val().split(',').map(Number);
      cy.gridGuide({
        drawGrid: appUtilities.currentGridProperties.showGrid,
        snapToGrid: appUtilities.currentGridProperties.snapToGrid,
		snapToAlignmentLocation: appUtilities.currentGridProperties.snapToAlignmentLocation,
        gridSpacing: appUtilities.currentGridProperties.gridSize,
        discreteDrag: appUtilities.currentGridProperties.discreteDrag,
        resize: appUtilities.currentGridProperties.autoResizeNodes,
        geometricGuideline: appUtilities.currentGridProperties.showGeometricGuidelines,
        distributionGuidelines: appUtilities.currentGridProperties.showDistributionGuidelines,
        initPosAlignment: appUtilities.currentGridProperties.showInitPosAlignment,
        guidelinesTolerance: appUtilities.currentGridProperties.guidelineTolerance,
        guidelinesStyle: {
		  initPosAlignmentLine: appUtilities.currentGridProperties.initPosAlignmentLine,
		  lineDash: appUtilities.currentGridProperties.lineDash,
		  horizontalDistLine: appUtilities.currentGridProperties.horizontalDistLine,
		  verticalDistLine: appUtilities.currentGridProperties.verticalDistLine,
          strokeStyle: appUtilities.currentGridProperties.guidelineColor,
		  horizontalDistColor: appUtilities.currentGridProperties.horizontalGuidelineColor,
		  verticalDistColor: appUtilities.currentGridProperties.verticalGuidelineColor,
		  initPosAlignmentColor: appUtilities.currentGridProperties.initPosAlignmentColor,
          geometricGuidelineRange: appUtilities.currentGridProperties.geometricAlignmentRange,
          range: appUtilities.currentGridProperties.distributionAlignmentRange
        }
      });
      
      $(self.el).modal('toggle');
      $(document).trigger('saveGridProperties');
    });

    $(document).off("click", "#default-grid").on("click", "#default-grid", function (evt) {
      self.copyProperties();
      self.template = _.template($("#grid-properties-template").html());
      self.template = self.template(appUtilities.currentGridProperties);
      $(self.el).html(self.template);
    });

    return this;
  }
});

var FontPropertiesView = Backbone.View.extend({
  defaultFontProperties: {
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    fontStyle: ""
  },
  currentFontProperties: undefined,
  copyProperties: function () {
    this.currentFontProperties = _.clone(this.defaultFontProperties);
  },
  fontFamilies: ["", "Helvetica", "Arial", "Calibri", "Cambria", "Comic Sans MS", "Consolas", "Corsiva"
    ,"Courier New" ,"Droid Sans", "Droid Serif", "Georgia", "Impact" 
    ,"Lato", "Roboto", "Source Sans Pro", "Syncopate", "Times New Roman"
    ,"Trebuchet MS", "Ubuntu", "Verdana"],
  getOptionIdByFontFamily: function(fontfamily) {
    var id = "font-properties-font-family-" + fontfamily;
    return id;
  },
  getFontFamilyByOptionId: function(id) {
    var lastIndex = id.lastIndexOf("-");
    var fontfamily = id.substr(lastIndex + 1);
    return fontfamily;
  },
  getFontFamilyHtml: function(self) {
    if(self == null){
      self = this;
    }
    
    var fontFamilies = self.fontFamilies;
    
    var html = "";
    html += "<select id='font-properties-select-font-family' class='input-medium layout-text' name='font-family-select'>";
    
    var optionsStr = "";
    
    for ( var i = 0; i < fontFamilies.length; i++ ) {
      var fontFamily = fontFamilies[i];
      var optionId = self.getOptionIdByFontFamily(fontFamily);
      var optionStr = "<option id='" + optionId + "'" 
              + " value='" + fontFamily + "' style='" + "font-family: " + fontFamily + "'";
      
      if (fontFamily === self.currentFontProperties.fontFamily) {
        optionStr += " selected";
      }
      
      optionStr += "> ";
      optionStr += fontFamily;
      optionStr += " </option>";
      
      optionsStr += optionStr;
    }
    
    html += optionsStr;
    
    html += "</select>";
    
    return html;
  },
  initialize: function () {
    var self = this;
    self.defaultFontProperties.getFontFamilyHtml = function(){
      return self.getFontFamilyHtml(self);
    };
    self.copyProperties();
    self.template = _.template($("#font-properties-template").html());
    self.template = self.template(self.defaultFontProperties);
  },
  extendProperties: function (eles) {
    var self = this;
    var commonProperties = {};
    
    // Get common properties. Note that we check the data field for labelsize property and css field for other properties.
    var commonFontSize = parseInt(chise.elementUtilities.getCommonProperty(eles, "font-size", "data"));
    var commonFontWeight = chise.elementUtilities.getCommonProperty(eles, "font-weight", "data");
    var commonFontFamily = chise.elementUtilities.getCommonProperty(eles, "font-family", "data");
    var commonFontStyle = chise.elementUtilities.getCommonProperty(eles, "font-style", "data");
    
    if( commonFontSize != null ) {
      commonProperties.fontSize = commonFontSize;
    }
    
    if( commonFontWeight != null ) {
      commonProperties.fontWeight = commonFontWeight;
    }
    
    if( commonFontFamily != null ) {
      commonProperties.fontFamily = commonFontFamily;
    }
    
    if( commonFontStyle != null ) {
      commonProperties.fontStyle = commonFontStyle;
    }
    
    self.currentFontProperties = $.extend({}, this.defaultFontProperties, commonProperties);
  },
  render: function (eles) {
    var self = this;
    self.extendProperties(eles);
    self.template = _.template($("#font-properties-template").html());
    self.template = self.template(self.currentFontProperties);
    $(self.el).html(self.template);

    $(self.el).modal('show');

    $(document).off("click", "#set-font-properties").on("click", "#set-font-properties", function (evt) {
      var data = {};
      
      var fontsize = $('#font-properties-font-size').val();
      var fontfamily = $('select[name="font-family-select"] option:selected').val();
      var fontweight = $('select[name="font-weight-select"] option:selected').val();
      var fontstyle = $('select[name="font-style-select"] option:selected').val();
      
      if ( fontsize != '' ) {
        data['font-size'] = parseInt(fontsize);
      }
      
      if ( fontfamily != '' ) {
        data['font-family'] = fontfamily;
      }
      
      if ( fontweight != '' ) {
        data['font-weight'] = fontweight;
      }
      
      if ( fontstyle != '' ) {
        data['font-style'] = fontstyle;
      }
      
      var keys = Object.keys(data);
      
      if(keys.length === 0) {
        return;
      }
      
      var validAction = false; // If there is nothing to change the action is not valid
      
      for ( var i = 0; i < eles.length; i++ ) {
        var ele = eles[i];
        
        keys.forEach(function(key, idx) {
          // If there is some property to change signal that the action is valid.
          if (data[key] != ele.data(key)){
            validAction = true;
          }
        }); 
        
        if ( validAction ) {
          break;
        }
      }
      
      if ( validAction === false ) {
        $(self.el).modal('toggle');
        return;
      }
      
      chise.changeFontProperties(eles, data);
      
      self.copyProperties();
	    
     
      $(self.el).modal('toggle');
	    $(document).trigger('saveFontProperties');
    });

    return this;
  }
});

module.exports = {
  BioGeneView: BioGeneView,
  LayoutPropertiesView: LayoutPropertiesView,
  ColorSchemeMenuView: ColorSchemeMenuView,
  GeneralPropertiesView: GeneralPropertiesView,
  PathsBetweenQueryView: PathsBetweenQueryView,
  PathsByURIQueryView: PathsByURIQueryView,
  PromptSaveView: PromptSaveView,
  FileSaveView: FileSaveView,
  PromptConfirmationView: PromptConfirmationView,
  ReactionTemplateView: ReactionTemplateView,
  GridPropertiesView: GridPropertiesView,
  FontPropertiesView: FontPropertiesView
};
