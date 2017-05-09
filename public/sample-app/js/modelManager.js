/*
 *	Shared model handling operations.
 *  Clients call these commands to update the model
 *	Author: Funda Durupinar Babur<f.durupinar@gmail.com>
 */


module.exports =  function(model, docId, userId, userName) {

    var user = model.at('users.' + userId);


    model.ref('_page.doc', 'documents.' + docId);

    return ModelManager = { //global reference for testing



        getModel: function(){
            return model;
        },

        addImage: function(data, user , noHistUpdate){
            model.pass({user:user}).push('_page.doc.images', data);
            if(!noHistUpdate)
                this.updateHistory({opName:'add', opTarget:'image', opAttr: data.filePath});
        },

        setName: function(userName){

           model.fetch('users', userId, function(err){
               user.set('name', userName);
           });
        },

        getName: function(){
            return model.get('users.' + userId +'.name');
        },

        setSampleInd: function(ind, user, noHistUpdate){
            model.pass({user:user}).set('_page.doc.sampleInd', ind);

            if(!noHistUpdate) {
                if (ind == -1)
                    this.updateHistory({opName:'load', opTarget:'model'});
                else
                    this.updateHistory({opName:'open', opTarget: 'sample', elId: ind});
            }
        },
        getSampleInd: function(user, noHistUpdate){
            var ind = model.get('_page.doc.sampleInd');
            if(ind == null)
                ind = "0";
            if(!noHistUpdate)
                this.setSampleInd(ind, user, noHistUpdate);

            if(!noHistUpdate) {
                if (ind == -1)
                    this.updateHistory({opName:'load', opTarget:'model'});
                else
                    this.updateHistory({opName:'open', opTarget: 'sample', elId: ind});
            }
            return ind;

        },


        updateLayoutProperties: function(layoutProperties, noHistUpdate){

            var currentLayoutProperties;
            var lp =  model.get('_page.doc.layoutProperties');

            if(lp == null)
                currentLayoutProperties = _.clone(layoutProperties);
            else
                currentLayoutProperties = _.clone(lp);


            model.set('_page.doc.layoutProperties', currentLayoutProperties); //synclayout

            if(!noHistUpdate)
                this.updateHistory({opName:'set',opTarget:'layout', opAttr: JSON.stringify(currentLayoutProperties)});
            return currentLayoutProperties;
        },
        setLayoutProperties: function(layoutProperties, noHistUpdate){
            model.set('_page.doc.layoutProperties', layoutProperties); //synclayout
            if(!noHistUpdate)
                this.updateHistory({opName:'set', opTarget:'layout', opAttr: JSON.stringify(layoutProperties)});
        },




        /***
         *
         * @param cmd  {opName, opTarget,  elType, elId, opAttr,param, prevParam}
         * opName: set, load, open, add, select, unselect
         * opTarget: element, element group,  model, sample,
         * elType: node, edge
         * opAttr: highlightColor, lineColor, borderColor etc.
         */

        updateHistory: function(cmd){
            var command = {userName: userName, date: new Date, opName: cmd.opName, opTarget: cmd.opTarget, elType: cmd.elType, opAttr: cmd.opAttr, elId: cmd.elId, param: cmd.param, prevParam: cmd.prevParam};


            if(cmd!=null) {

                var ind = model.push('_page.doc.history', command) - 1;

                model.set('_page.doc.undoIndex', ind);
            }

        },

        getHistory: function(){
            return model.get('_page.doc.history');
        },

        getUndoActionStr: function(){

            var undoIndex = model.get('_page.doc.undoIndex');
            var cmd =  model.get('_page.doc.history.' + undoIndex);


            var cmdStr = cmd.opName + " " + cmd.opTarget;

            if(cmd.opAttr != null)
                cmdStr += " " + cmd.opAttr;
        //    if(cmd.elId != null)
          //      cmdStr += " " + cmd.elId;

            return cmdStr;

        },

        getRedoActionStr: function(){
            var undoIndex = model.get('_page.doc.undoIndex');
            var cmd =  model.get('_page.doc.history.'+ (undoIndex+1));

            var cmdStr = cmd.opName + " " + cmd.opTarget;
            if(cmd.opAttr != null)
                cmdStr += " " + cmd.opAttr;
          //  if(cmd.elId != null)
            //    cmdStr += " " + cmd.elId;

            return cmdStr;
        },
        isUndoPossible: function(){
            return(model.get('_page.doc.undoIndex') > 0)
        },
        isRedoPossible: function(){
            return(model.get('_page.doc.undoIndex') + 1 < model.get('_page.doc.history').length)
        },

        undoCommand: function(){
            var undoInd = model.get('_page.doc.undoIndex');
            var cmd = model.get('_page.doc.history.' + undoInd); // cmd: opName, opTarget, opAttr, elId, param

            if(cmd.opName == "set"){
                if(cmd.opTarget == "element" && cmd.elType == "node")
                    this.changeModelNodeAttribute(cmd.opAttr,cmd.elId, cmd.prevParam, null); //user is null to enable updating in the editor

                else if(cmd.opTarget == "element" && cmd.elType == "edge")
                    this.changeModelEdgeAttribute(cmd.opAttr,cmd.elId, cmd.prevParam, null);
                else if(cmd.opTarget == "element group")
                    this.changeModelElementGroupAttribute(cmd.opAttr, cmd.elId, cmd.prevParam, null);

            }
            else if(cmd.opName == "add"){
                if(cmd.opTarget == "element" && cmd.elType == "node")
                    this.deleteModelNode(cmd.elId);
                else if(cmd.opTarget == "element" && cmd.elType == "edge")
                    this.deleteModelEdge(cmd.elId);
                else if(cmd.opTarget == "compound")
                    this.removeModelCompound(cmd.elId, cmd.param.childrenList, cmd.prevParam);
            }
            else if(cmd.opName == "delete"){
                if(cmd.opTarget == "element")
                    this.restoreModelElement(cmd.elType, cmd.elId, cmd.prevParam);
                else if(cmd.opTarget == "element group")
                    this.restoreModelElementGroup(cmd.elId, cmd.prevParam);
                else if(cmd.opTarget == "compound")
                        this.addModelCompound(cmd.elId, cmd.prevParam.compoundAtts, cmd.prevParam.childrenList, cmd.param);

            }
            else if(cmd.opName == "init"){
                this.newModel();
            }
            else if(cmd.opName == "new"){ //delete all
                this.restoreModel(cmd.prevParam);

            }
            else if(cmd.opName == "merge"){
                this.newModel("me", true);
                this.restoreModel(cmd.prevParam);

            }


            undoInd = undoInd > 0 ? undoInd - 1 : 0;
            model.set('_page.doc.undoIndex', undoInd);

        },

        redoCommand: function(){
            var undoInd = model.get('_page.doc.undoIndex');
            var cmd = model.get('_page.doc.history.' + (undoInd+ 1)); // cmd: opName, opTarget, opAttr, elId, param

            if(cmd.opName == "set"){
                if(cmd.opTarget == "element" && cmd.elType == "node")
                    this.changeModelNodeAttribute(cmd.opAttr,cmd.elId, cmd.param, null); //user is null to enable updating in the editor
                else if(cmd.opTarget == "element" && cmd.elType == "edge")
                    this.changeModelEdgeAttribute(cmd.opAttr,cmd.elId, cmd.param, null);
                else if(cmd.opTarget == "element group") {
                    this.changeModelElementGroupAttribute(cmd.opAttr, cmd.elId, cmd.param);

                }


            }
            else if(cmd.opName == "add"){
                if(cmd.opTarget == "element")
                    this.restoreModelElement(cmd.elType, cmd.elId, cmd.param, null);
                else if(cmd.opTarget == "compound")
                    this.addModelCompound(cmd.elId, cmd.param.compoundAtts, cmd.param.childrenList, cmd.param);


            }
            else if(cmd.opName == "delete"){
                if(cmd.opTarget == "element" && cmd.elType == "node")
                    this.deleteModelNode(cmd.elId);
                else if(cmd.opTarget == "element" && cmd.elType == "edge")
                    this.deleteModelEdge(cmd.elId);
                else if(cmd.opTarget == "element group")
                    this.deleteModelElementGroup(cmd.elId);
                else if(cmd.opTarget == "compound")
                    this.removeModelCompound(cmd.elId, cmd.param.childrenList, cmd.param);

            }
            else if(cmd.opName == "init"){
                this.restoreModel(cmd.param);
            }
            else if(cmd.opName == "new"){ //delete all
                this.newModel();
            }
            else if(cmd.opName == "merge"){ //delete all
                this.restoreModel(cmd.param);

            }


            undoInd = undoInd <  model.get('_page.doc.history').length -1 ? undoInd + 1  : model.get('_page.doc.history').length -1;

            model.set('_page.doc.undoIndex', undoInd);

        },


        getModelNode: function(id){
            var nodePath = model.at('_page.doc.cy.nodes.'  + id);
            return nodePath.get();
        },

        getModelEdge: function(id){

            var edgePath = model.at('_page.doc.cy.edges.'  + id);

            return edgePath.get();
        },

        selectModelNode: function(node, noHistUpdate){

            var nodePath = model.at('_page.doc.cy.nodes.'  +node.id());
            if(nodePath.get() == null)
                return "Node id not found";
            if(user)
                nodePath.set('highlightColor' , user.get('colorCode'));


            return "success";

        },


        selectModelEdge: function(edge, noHistUpdate){
            var user = model.at('users.' + userId);
            var edgePath = model.at('_page.doc.cy.edges.'  +edge.id());
            if(edgePath.get() == null)
                return "Edge id not found";
            if( user) {
                edgePath.set('highlightColor', user.get('colorCode'));


            }

            return "success";

        },
        unselectModelNode: function(node, noHistUpdate){

            var nodePath = model.at('_page.doc.cy.nodes.'  +node.id());

            if(nodePath.get() == null)
                return "Node id not found";

            nodePath.set('highlightColor' , null);

            return "success";

        },




        unselectModelEdge: function(edge, noHistUpdate){

            var edgePath = model.at('_page.doc.cy.edges.'  +edge.id());
            if(edgePath.get() == null)
                return "Edge id not found";

            edgePath.set('highlightColor', null);

            return "success";


        },

        getSelectedModelNodes: function(){
            var nodes = model.get('_page.doc.cy.nodes');
            var selectedNodes = [];

           for(var att in nodes) {
               if (nodes.hasOwnProperty(att)) {
                   var node = nodes[att];
                   if (node.highlightColor != null) //could be selected by anyone
                       selectedNodes.push(node);
               }
           }

            return selectedNodes;
        },

        addModelNode: function(nodeId,  param, user, noHistUpdate){


            if(model.get("_page.doc.cy.nodes." + nodeId + '.id') != null)
                return "Node cannot be duplicated";

            model.pass({user:user}).set('_page.doc.cy.nodes.' +nodeId +'.id', nodeId);
            model.pass({user:user}).set('_page.doc.cy.nodes.' +nodeId +'.position', {x: param.x, y: param.y});
            model.pass({user:user}).set('_page.doc.cy.nodes.' + nodeId+'.sbgnclass', param.sbgnclass);
            model.pass({user:user}).set('_page.doc.cy.nodes.' + nodeId+'.sbgnlabel', param.sbgnlabel);

            //adding the node in cytoscape
            model.pass({user:user}).set('_page.doc.cy.nodes.' +nodeId+'.addedLater', true);

            

            if(!noHistUpdate)
                //We don't want all the attributes of the param to be printed
                this.updateHistory({opName:'add',opTarget:'element', elType:'node', elId: nodeId, param:{x: param.x, y: param.y, sbgnclass: param.sbgnclass}});



            return "success";

        },

        addModelEdge: function(edgeId, param, user, noHistUpdate){

            if(model.get("_page.doc.cy.edges." + edgeId + '.id') != null)
                return "Edge cannot be duplicated";

            model.pass({user:user}).set('_page.doc.cy.edges.' + edgeId +'.id', edgeId);
            model.pass({user:user}).set('_page.doc.cy.edges.' + edgeId +'.sbgnclass', param.sbgnclass);

            model.pass({user:user}).set('_page.doc.cy.edges.' + edgeId +'.source', param.source);
            model.pass({user:user}).set('_page.doc.cy.edges.' + edgeId +'.target', param.target);

            //adding the edge...other operations should be called after this
            model.pass({user:user}).set('_page.doc.cy.edges.' +edgeId+'.addedLater', true);



            if(!noHistUpdate)
                this.updateHistory({opName:'add',opTarget:'element', elType:'edge', elId: edgeId, param:param});

            return "success";

        },

        //change children's parents to their old parents
        removeModelCompound: function(compoundId, childrenList, prevParentList, user, noHistUpdate){

            var nodePath = model.at('_page.doc.cy.nodes.'  + compoundId);
            var compoundAtts = {id: compoundId, sbgnclass: nodePath.get('sbgnclass'), x: nodePath.get('position.x'), y: nodePath.get('position.y'), width: nodePath.get('width'), height: nodePath.get('height')};

            //isolate the compound first, then delete
            this.changeModelElementGroupAttribute("parent", childrenList, prevParentList, null, true);
            this.deleteModelNode(compoundId, user, true);



            if(!noHistUpdate)
                this.updateHistory({opName:'delete',opTarget:'compound', elId: compoundId, prevParam:{childrenList: childrenList, compoundAtts: compoundAtts}, param:prevParentList});

        },
        /***
         *
         * @param compoundId : new compound's id
         * @param compoundAtts: new compounds id, size, sbgnclass, position
         * @param childrenList: in the format {id:, isNode} for do/undo
         * @param prevParentList: children's old parents
         * @param user
         * @param noHistUpdate
         */
        addModelCompound: function(compoundId, compoundAtts, childrenList, prevParentList, user, noHistUpdate){

            this.addModelNode(compoundId, compoundAtts, user, true);


            this.changeModelNodeAttribute('width', compoundId, compoundAtts.width, user, true);
            this.changeModelNodeAttribute('height', compoundId, compoundAtts.height, user, true );


            var parentList = [];
            var nodeIds = [];
            childrenList.forEach(function(el){
                nodeIds.push(el.id);
                parentList.push(compoundId);
            });


            this.changeModelElementGroupAttribute("parent", childrenList, parentList, user, true);




            if(!noHistUpdate)
                this.updateHistory({opName:'add',opTarget:'compound', elId: compoundId, param:{childrenList: childrenList, compoundAtts: compoundAtts}, prevParam:prevParentList});

        },


        //attStr: attribute namein the model
        //historyData is for  sbgnStatesAndInfos only
        changeModelElementGroupAttribute: function(attStr, elList, paramList,  user, noHistUpdate) { //historyData){

            var prevParamList = [];
            var self = this;

            if (!noHistUpdate) {

                elList.forEach(function (el) {
                    var prevAttVal;
                    if (el.isNode)
                        prevAttVal = model.get('_page.doc.cy.nodes.' + el.id + '.' + attStr);
                    else
                        prevAttVal = model.get('_page.doc.cy.edges.' + el.id + '.' + attStr);

                    prevParamList.push(prevAttVal);
                });


                this.updateHistory({
                    opName: 'set',
                    opTarget: 'element group',
                    elId: elList,
                    opAttr: attStr,
                    param: paramList,
                    prevParam: prevParamList
                });

            }

            var ind = 0;
            elList.forEach(function(el){
                var currAttVal = paramList[ind++];

                if(el.isNode)
                    self.changeModelNodeAttribute(attStr, el.id, currAttVal, null, true); //don't update individual histories
                else
                    self.changeModelEdgeAttribute(attStr, el.id, currAttVal, null, true);

            });

            return "success";

        },
        //attStr: attribute namein the model
        //historyData is for  sbgnStatesAndInfos only
        changeModelNodeAttribute: function(attStr, nodeId, attVal,  user, noHistUpdate){ //historyData){

            var status = "Node id not found";
            var nodePath = model.at('_page.doc.cy.nodes.'  + nodeId);


            var prevAttVal = nodePath.get(attStr);


            nodePath.pass({user:user}).set(attStr,attVal);


            if(attStr == "expandCollapseStatus") {
                if (attVal == "expand")
                    prevAttVal = "collapse";
                if (attVal == "collapse")
                    prevAttVal = "expand";
            }



            if(attStr != 'interactionCount') {
                model.increment('_page.doc.cy.nodes.' + nodeId + '.interactionCount', 1);

                if (!noHistUpdate) {

                    this.updateHistory({
                        opName: 'set',
                        opTarget: 'element',
                        elType: 'node',
                        elId: nodeId,
                        opAttr: attStr,
                        param: attVal,
                        prevParam: prevAttVal
                    });
                }
            }
            status = "success";


            return status;

        },
        changeModelEdgeAttribute: function(attStr, edgeId, attVal,  user, noHistUpdate){
            var status = "Edge id not found";
            var edgePath = model.at('_page.doc.cy.edges.'  + edgeId);
            var prevAttVal = edgePath.get(attStr);
            edgePath.pass({user:user}).set(attStr, attVal);


            var sourceId = edgePath.get('source');
            var targetId = edgePath.get('target');
            if(sourceId)
                model.increment('_page.doc.cy.nodes.'  + sourceId + '.interactionCount',1);
            if(targetId)
                model.increment('_page.doc.cy.nodes.'  + targetId + '.interactionCount',1);


            if(!noHistUpdate) {

                this.updateHistory({
                    opName: 'set',
                    opTarget: 'element',
                    elType: 'edge',
                    elId: edgeId,
                    opAttr: attStr,
                    param: attVal,
                    prevParam: prevAttVal
                });

            }

            status = "success";



            return status;
        },

        //willUpdateHistory: Depending on the parent command, history will be updated or not
        deleteModelNode: function(nodeId, user, noHistUpdate){
            var nodePath = model.at('_page.doc.cy.nodes.'  + nodeId);

            if(nodePath.get() == null)
                return "Node id not found";

            if(!noHistUpdate){
                var pos = nodePath.get('position');
                var sbgnclass = nodePath.get('sbgnclass');
                var borderColor = nodePath.get('borderColor');
                var borderWidth = nodePath.get('borderWidth');
                var backgroundColor = nodePath.get('backgroundColor');
                var width = nodePath.get('width');
                var height = nodePath.get('height');
                var parent = nodePath.get('parent');
                var sbgnlabel = nodePath.get('sbgnlabel');
                var isCloneMarker = nodePath.get('isCloneMarker');
                var isMultimer = nodePath.get('isMultimer');
                var sbgnStatesAndInfos = nodePath.get('sbgnStatesAndInfos');
                var highlightColor = nodePath.get('highlightColor');
                var ports = nodePath.get('ports');
                var interactionCount = nodePath.get('interactionCount');


                prevParam = {x: pos.x , y: pos.y , sbgnclass:sbgnclass, width: width, height: height,
                             borderColor: borderColor, borderWidth: borderWidth, sbgnlabel: sbgnlabel,
                             sbgnStatesAndInfos:sbgnStatesAndInfos, parent:parent, isCloneMarker: isCloneMarker,
                             isMultimer: isMultimer, highlightColor: highlightColor, ports: ports, interactionCount: interactionCount};



                this.updateHistory({opName:'delete',opTarget:'element', elType:'node', elId: nodeId, prevParam: prevParam});

            }

            model.pass({user: user}).del(('_page.doc.cy.nodes.' + nodeId));



            return "success";

        },


        deleteModelEdge: function(edgeId, user, noHistUpdate){

            var edgePath = model.at('_page.doc.cy.edges.'  + edgeId);
            if(edgePath.get() == null)
                return "Edge id not found";


                if(!noHistUpdate) {
                    var source = edgePath.get('source');
                    var target = edgePath.get('target');
                    var sbgnClass = edgePath.get('sbgnclass');
                    var lineColor = edgePath.get('lineColor');
                    var width = edgePath.get('width');
                    var sbgncardinality = edgePath.get('sbgncardinality');
                    var portsource = edgePath.get('portsource');
                    var porttarget = edgePath.get('porttarget');
                    var bendPointPositions= edgePath.get('bendPointPositions');
                    var highlightColor = edgePath.get('highlightColor');

                    prevParam = {source: source , target:target , sbgnclass:sbgnClass, lineColor: lineColor,
                    width: width, sbgncardinality: sbgncardinality, portsource: portsource, porttarget:porttarget, bendPointPositions: bendPointPositions, highlightColor:highlightColor};

                    this.updateHistory({opName:'delete',opTarget:'element', elType:'edge', elId: edgeId, prevParam: prevParam});

                }

                model.pass({user:user}).del(('_page.doc.cy.edges.'  + edgeId));

            return "success";

        },


        deleteModelElementGroup: function(selectedEles, user, noHistUpdate){
            var prevParamsNodes = [];
            var prevParamsEdges = [];
            var self = this;

            selectedEles.edges.forEach(function(edge){
                var edgePath = model.at('_page.doc.cy.edges.' + edge.id);

                var source = edgePath.get('source');
                var target = edgePath.get('target');
                var sbgnclass = edgePath.get('sbgnclass');
                var lineColor = edgePath.get('lineColor');
                var width = edgePath.get('width');
                var sbgncardinality = edgePath.get('sbgncardinality');
                var portsource = edgePath.get('portsource');
                var porttarget = edgePath.get('porttarget');
                var bendPointPositions= edgePath.get('bendPointPositions');

                prevParamsEdges.push( {source: source , target:target , sbgnclass:sbgnclass, lineColor: lineColor,
                    width: width, sbgncardinality: sbgncardinality, portsource: portsource, porttarget:porttarget, bendPointPositions: bendPointPositions});
            });


            selectedEles.edges.forEach(function(edge){
                self.deleteModelEdge(edge.id, user, true); //will not update children history
            });

            selectedEles.nodes.forEach(function(node){
                var nodePath = model.at('_page.doc.cy.nodes.'  + node.id);

                var pos = nodePath.get('position');
                var sbgnclass = nodePath.get('sbgnclass');


                var borderColor = nodePath.get('borderColor');
                var borderWidth = nodePath.get('borderWidth');
                var backgroundColor = nodePath.get('backgroundColor');
                var width = nodePath.get('width');
                var height = nodePath.get('height');
                var parent = nodePath.get('parent');
                var sbgnlabel = nodePath.get('sbgnlabel');
                var isCloneMarker = nodePath.get('isCloneMarker');
                var isMultimer = nodePath.get('isMultimer');
                var sbgnStatesAndInfos = nodePath.get('sbgnStatesAndInfos');
                var highlightColor = nodePath.get('highlightColor');
                var ports = nodePath.get('ports');

                prevParamsNodes.push({x: pos.x , y: pos.y , sbgnclass:sbgnclass, width: width, height: height,
                    borderColor: borderColor, borderWidth: borderWidth, sbgnlabel: sbgnlabel,
                    sbgnStatesAndInfos:sbgnStatesAndInfos, parent:parent, isCloneMarker: isCloneMarker,
                    isMultimer: isMultimer,  highlightColor: highlightColor, backgroundColor: backgroundColor, ports:ports } );
            });


            selectedEles.nodes.forEach(function(node){
                self.deleteModelNode(node.id, user, true); //will not update children history
            });
            if(!noHistUpdate)
                this.updateHistory({opName:'delete',opTarget:'element group',  elId: selectedEles, prevParam: {nodes: prevParamsNodes, edges: prevParamsEdges}});


        },

        restoreModelElementGroup: function(elList, param, user, noHistUpdate){
            var self = this;
            //Restore nodes first

            for (var i = 0; i < elList.nodes.length; i++) {
                self.restoreModelNode(elList.nodes[i].id, param.nodes[i], user, true);
            }

            //restore edges later
            for (var i = 0; i < elList.edges.length; i++) {
                self.restoreModelEdge(elList.edges[i].id, param.edges[i], user, true);
            }

            //change parents after adding them all
            for (var i = 0; i < elList.nodes.length; i++) {

                self.changeModelNodeAttribute('parent', elList.nodes[i].id, param.nodes[i].parent, null, false);
            };


            if(!noHistUpdate)
                self.updateHistory({opName:'restore', opTarget:'element group', elId:elList});
        },
        /**
         * Restore operations for global undo/redo
         */
        restoreModelNode: function(nodeId, param, user, noHistUpdate){

            this.addModelNode(nodeId, param, user, noHistUpdate);


            this.changeModelNodeAttribute('interactionCount', nodeId,param.interactionCount,user, noHistUpdate );
            this.changeModelNodeAttribute('ports', nodeId,param.ports,user, noHistUpdate );
            this.changeModelNodeAttribute('highlightColor', nodeId,param.highlightColor,user, noHistUpdate );
            this.changeModelNodeAttribute('sbgnclass', nodeId,param.sbgnclass,user, noHistUpdate );
            this.changeModelNodeAttribute('width', nodeId,param.width,user, noHistUpdate );
            this.changeModelNodeAttribute('height', nodeId,param.height,user , noHistUpdate);
            this.changeModelNodeAttribute('sbgnlabel', nodeId,param.sbgnlabel,user, noHistUpdate );
            this.changeModelNodeAttribute('backgroundColor', nodeId,param.backgroundColor,user, noHistUpdate );
            this.changeModelNodeAttribute('borderColor', nodeId,param.borderColor,user , noHistUpdate);
            this.changeModelNodeAttribute('borderWidth', nodeId,param.borderWidth,user , noHistUpdate);
            this.changeModelNodeAttribute('sbgnStatesAndInfos', nodeId, param.sbgnStatesAndInfos,user, noHistUpdate );
            this.changeModelNodeAttribute('parent', nodeId,param.parent,user, noHistUpdate );
            this.changeModelNodeAttribute('isCloneMarker', nodeId,param.isCloneMarker,user , noHistUpdate);
            this.changeModelNodeAttribute('isMultimer', nodeId, param.isMultimer,user, noHistUpdate );

            if(!noHistUpdate)
                this.updateHistory({opName:'restore', opTarget:'element', elType:'node',  elId:nodeId});
        },

        restoreModelEdge: function(edgeId, param, user, noHistUpdate){

            this.addModelEdge(edgeId, param, user, noHistUpdate);

            
            this.changeModelEdgeAttribute('lineColor', edgeId,param.lineColor,user, noHistUpdate );
            this.changeModelEdgeAttribute('width', edgeId,param.width,user, noHistUpdate );
            this.changeModelEdgeAttribute('sbgncardinality', edgeId,param.sbgncardinality,user , noHistUpdate);
            this.changeModelEdgeAttribute('portsource', edgeId,param.portsource,user , noHistUpdate);
            this.changeModelEdgeAttribute('porttarget', edgeId,param.porttarget,user , noHistUpdate);
            this.changeModelEdgeAttribute('bendPointPositions', edgeId,param.bendPointPositions,user , noHistUpdate);
            this.changeModelEdgeAttribute('highlightColor', edgeId,param.highlightColor,user, noHistUpdate );


            if(!noHistUpdate)
                this.updateHistory({opName:'restore', opTarget:'element', elType:'edge',  elId:edgeId});
        },


        restoreModelElement: function(elType, elId, param, user, noHistUpdate){

            if(elType == "node")
                this.restoreModelNode(elId, param, user, noHistUpdate);
            else
                this.restoreModelEdge(elId, param, user, noHistUpdate);



        },





        /**
         * This function is used to undo newModel and redo initModel
         * @param modelCy : nodes and edges to be restored
         * @param user
         * @param noHistUpdate
         */
        restoreModel: function(modelCy, user, noHistUpdate){
            var prevParam = model.get('_page.doc.cy');
            model.set('_page.doc.cy', modelCy);

            this.setSampleInd(-1,null, true); //to get a new container

            if(!noHistUpdate)
                this.updateHistory({opName:'restore', prevParam: prevParam, param: modelCy, opTarget:'model'});

        },

        //should be called before loading a new graph to prevent id confusion
        newModel: function(user, noHistUpdate){

            var self = this;
            var prevModelCy = model.get('_page.doc.cy');

            if(!noHistUpdate)
                this.updateHistory({opName:'new', prevParam: prevModelCy, opTarget:'model'});

            var edges = model.get('_page.doc.cy.edges');
            var nodes = model.get('_page.doc.cy.nodes');


            for(var att in edges) {
                if (edges.hasOwnProperty(att)) {
                    self.deleteModelEdge(edges[att].id, user, true);
                }
            }

            for(var att in nodes) {
                if (nodes.hasOwnProperty(att)) {
                    self.deleteModelNode(nodes[att].id, user, true);
                }
            }


        },

        //convert model to json structure
        getJsonFromModel: function(){

            var nodes = model.get('_page.doc.cy.nodes');


            if(nodes == null)
                return null;

            var edges = model.get('_page.doc.cy.edges');

            var jsonNodes = [];
            var jsonEdges = [];



            for(var att in nodes){

                if(nodes.hasOwnProperty(att)) {
                    var node = nodes[att];
                    var jsonNode = {
                        data: {
                            backgroundOpacity: node.backgroundOpacity,
                            borderColor: node.borderColor,
                            id: node.id,
                            parent: node.parent,
                            ports: node.ports,
                            sbgnbbox: {x: node.position.x, y: node.position.y, w: node.width, h: node.height},
                            sbgnclass: node.sbgnclass,
                            sbgnclonemarker: node.isCloneMarker,
                            sbgnlabel: node.sbgnlabel,
                            sbgnstatesandinfos: node.sbgnStatesAndInfos,
                            height: node.height,
                            width: node.width
                        }
                    };

                    jsonNodes.push(jsonNode);
                }
            };


            for(var att in edges) {
                if (edges.hasOwnProperty(att)) {
                    var edge = edges[att];

                    var jsonEdge = {
                        data: {
                            bendPointPositions: edge.bendPointPositions,
                            id: edge.id,
                            lineColor: edge.lineColor,
                            portsource: edge.portsource,
                            porttarget: edge.porttarget,
                            source: edge.source,
                            target: edge.target,
                            sbgncardinality: edge.sbgncardinality,
                            sbgnclass: edge.sbgnclass,
                            parent: edge.parent
                        }
                    };

                    jsonEdges.push(jsonEdge);
                }
            }


            return{nodes:jsonNodes, edges:jsonEdges};
        },



        initModelNode: function(node, user, noHistUpdate){


            var nodePath = model.at('_page.doc.cy.nodes.' + node.id());

            if(!noHistUpdate)
                this.updateHistory({opName:'init', opTarget:'element', elType:'node', elId: node.id()});



            nodePath.set('id', node.id());


            var interactionCount = nodePath.get('interactionCount');

            if (interactionCount == null) //this is not stored in cy
                this.changeModelNodeAttribute('interactionCount', node.id(),0, user, true); //don't update history


            var backgroundOpacity= nodePath.get('backgroundOpacity');

            if (backgroundOpacity != null)
                node.data('backgroundOpacity', backgroundOpacity );

            else
                this.changeModelNodeAttribute('backgroundOpacity', node.id(),node.data('backgroundOpacity'), user, noHistUpdate);



            var ports= nodePath.get('ports');

            if (ports != null)
                node.data('ports', ports );

            else
                this.changeModelNodeAttribute('ports', node.id(),node.data('ports'), user, noHistUpdate);


            
            var sbgnclass = nodePath.get('sbgnclass');

            if (sbgnclass != null)
                node.data('sbgnclass', sbgnclass );

            else
                this.changeModelNodeAttribute('sbgnclass', node.id(),node.data('sbgnclass'), user, noHistUpdate);

            var borderColor = nodePath.get('borderColor');

            if (borderColor != null)
                node.data('borderColor', borderColor);
            else
                this.changeModelNodeAttribute('borderColor', node.id(),node.css('border-color'), user, noHistUpdate); //initially css is active, it is then loaded to data('borderColor')

            var borderWidth = nodePath.get('borderWidth');
            if (borderWidth != null)
                node.css('border-width', borderWidth);
            else
                this.changeModelNodeAttribute('borderWidth', node.id(),node.css('border-width'), user, noHistUpdate);




            var backgroundColor = nodePath.get('backgroundColor');

            if (backgroundColor != null)
                node.css('background-color', backgroundColor);
            else
                this.changeModelNodeAttribute('backgroundColor', node.id(),node.css('background-color'), user, noHistUpdate);


            //SBGN properties are stored in the data component


            var sbgnlabel = nodePath.get('sbgnlabel');

            if (sbgnlabel != null)
                node.data('sbgnlabel', sbgnlabel );

            else
                this.changeModelNodeAttribute('sbgnlabel', node.id(),node.data('sbgnlabel'), user, noHistUpdate);



            var isCloneMarker = nodePath.get('isCloneMarker');



            if (isCloneMarker != null) {
                node._private.data.sbgnclonemarker = isCloneMarker ? true : undefined;
                node.data('sbgnclonemarker', isCloneMarker ? true : undefined);
            }

            else
                this.changeModelNodeAttribute('isCloneMarker', node.id(),node._private.data.sbgnclonemarker, user, noHistUpdate);
                   //this.changeModelNodeAttribute('isCloneMarker', node.id(),node.data('sbgnclonemarker'), user, noHistUpdate);

            //todo: restore doesn't get correct

            var isMultimer = nodePath.get('isMultimer');

            if (isMultimer != null) {

                var sbgnclass = node.data('sbgnclass');
                if (isMultimer) {
                    //if not multimer already
                    if (sbgnclass.indexOf(' multimer') <= -1) //todo funda changed
                        node.data('sbgnclass', sbgnclass + ' multimer');
                }
                else {
                    node.data('sbgnclass', sbgnclass.replace(' multimer', ''));
                }
            }

            else {
                //nodePath.pass({user: user}).set('isMultimer', false);
                var nodeIsMultimer = node.data('sbgnclass').indexOf(' multimer') > 0 ;
                this.changeModelNodeAttribute('isMultimer', node.id(), nodeIsMultimer, user, noHistUpdate);
            }


            var sbgnStatesAndInfos = nodePath.get('sbgnStatesAndInfos');



            if(sbgnStatesAndInfos != null)
                node.data('sbgnstatesandinfos',sbgnStatesAndInfos);

            else {

                var si = node.data('sbgnstatesandinfos');
                if(!si) si = [];
                this.changeModelNodeAttribute('sbgnStatesAndInfos', node.id(), si, user, noHistUpdate);
            }

            var parent = nodePath.get('parent');

            if (parent != null)
                node.data('parent', parent);
            else
                this.changeModelNodeAttribute('parent', node.id(),node.data('parent'), user, noHistUpdate);



            var height = nodePath.get('height');

            if (height != null){
                node.data('height', height);
                node._private.data.sbgnbbox.h = height;
            }
            else {
                this.changeModelNodeAttribute('height', node.id(), node._private.data.sbgnbbox.h , user, noHistUpdate);
            }


            var width = nodePath.get('width');

            if (width != null) {
                node.data('width', width);
                node._private.data.sbgnbbox.w = width;
            }
            else
                this.changeModelNodeAttribute('width', node.id(),node._private.data.sbgnbbox.w, user, noHistUpdate);




            //IMPORTANT!!!!! Calling width height updates causes node moving errors



        },
        initModelEdge: function(edge, user, noHistUpdate){
            edge.addClass('changeLineColor');



            var edgePath = model.at('_page.doc.cy.edges.' + edge.id());


            if(!noHistUpdate)
                this.updateHistory({opName:'init', opTarget: 'element', elType:'edge', elId: edge.id()});


            edgePath.set('id', edge.id());




            // if (parent != null)
            //     edge.data('parent', edge);
            // else
            //     this.changeModelEdgeAttribute('parent', edge.id(),edge.data('parent'), user, noHistUpdate);

            var bendPointPositions = edgePath.get('bendPointPositions');


            if (bendPointPositions != null)
                edge.data('bendPointPositions', bendPointPositions);
            else {
                var bp = edge.data('bendPointPositions');
                if(!bp) bp = [];

                this.changeModelEdgeAttribute('bendPointPositions', edge.id(), bp, user, noHistUpdate);
            }




            var sbgnclass = edgePath.get('sbgnclass');

            if (sbgnclass != null)
                edge.data('sbgnclass', sbgnclass);
            else
                this.changeModelEdgeAttribute('sbgnclass', edge.id(),edge.data('sbgnclass'), user, noHistUpdate);

            var sbgncardinality = edgePath.get('sbgncardinality');

            if (sbgncardinality != null)
                edge.data('sbgncardinality', sbgncardinality);
            else {
                var cardinality = edge.data('sbgncardinality');
                if(!cardinality)
                    cardinality = 0;

                this.changeModelEdgeAttribute('sbgncardinality', edge.id(), cardinality, user, noHistUpdate);
            }

            var lineColor = edgePath.get('lineColor');

            if (lineColor != null)
                edge.data('lineColor', lineColor);
            else
                this.changeModelEdgeAttribute('lineColor', edge.id(),edge.css('line-color'), user, noHistUpdate);


            var width = edgePath.get('width');

            if (width != null)
                edge.css('width', width);
            else
                this.changeModelEdgeAttribute('width', edge.id(),edge.css('width'), user, noHistUpdate);



            var source = edgePath.get('source');

            if(source != null)
                edge.data('source', source);
            else
                this.changeModelEdgeAttribute('source', edge.id(),edge._private.data.source, user, noHistUpdate);


            var target = edgePath.get('target');
            if(target != null)
                edge.data('target', target);
            else
                this.changeModelEdgeAttribute('target', edge.id(),edge._private.data.target, user, noHistUpdate);




            var portsource = edgePath.get('portsource');

            if(portsource != null)
                edge.data('portsource', portsource);
            else
                this.changeModelEdgeAttribute('portsource', edge.id(),edge.data('portsource'), user, noHistUpdate);


            var porttarget = edgePath.get('porttarget');
            if(porttarget != null)
                edge.data('porttarget', porttarget);
            else
                this.changeModelEdgeAttribute('porttarget', edge.id(),edge.data('porttarget'), user, noHistUpdate);



        },


        //nodes and edges are cytoscape objects. they have css and data properties
        initModel: function(jsonObj, nodes, edges, user, noHistUpdate){

            var elIds = "";
            var elTypes = [];




//FUNDA??????ndoe.data.sbgnbbox????
            jsonObj.nodes.forEach(function(node){
                //do not set id here: it means node addition
                model.pass({user:user}).set('_page.doc.cy.nodes.' + node.data.id + '.position', {x: node.data.sbgnbbox.x, y: node.data.sbgnbbox.y}); //initialize position

              //  model.pass({user:user}).set('_page.doc.cy.nodes.' + node.data.id + '.id', node.data.id);
                elIds += node.data.id + " ";
                elTypes.push("node");

            });


            jsonObj.edges.forEach(function(edge){
            //    model.pass({user:user}).set('_page.doc.cy.edges.' + edge.data.id + '.source', edge.data.source); //initialize position
                elIds += edge.data.id + " ";
                elTypes.push("edge");
            });

            var self = this;





            nodes.forEach(function (node) {
                self.initModelNode(node, user, true);

            });

            edges.forEach(function (edge) {
                self.initModelEdge(edge, user, true);
            });



            var newModelCy = model.get('_page.doc.cy');

            if(!noHistUpdate){
                this.updateHistory({opName:'init',  param: newModelCy,  opTarget:'model'});
            }


        },


        setRollbackPoint: function(){
            var modelCy = this.getModelCy();
            model.set('_page.doc.prevCy',modelCy);
        },

        getModelCy: function(){
            return model.get('_page.doc.cy');
        },

        //for undo/redo only
        mergeJsons: function( user, noHistUpdate){
            var modelCy = model.get('_page.doc.cy');
            var prevModelCy = model.get('_page.doc.prevCy');

            if(!noHistUpdate){

                this.updateHistory({opName:'merge',  prevParam: prevModelCy, param: modelCy, opTarget:'model'});
            }

        },

        updateFactoidModel: function(factoidModel, user, noHistUpdate){
            model.pass({user:user}).set('_page.doc.factoid', factoidModel);

            if(!noHistUpdate){
                var prevFactoidModel = model.get('_page.doc.factoid');
                this.updateHistory({opName:'factoid',  prevParam: prevFactoidModel, param: factoidModel, opTarget:'model'});
            }

        },

        getFactoidModel: function(){
            return model.get('_page.doc.factoid');
        }


    }
}
