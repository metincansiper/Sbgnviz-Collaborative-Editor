/*
 *	Shared model handling operations.
 *  Clients call these commands to update the model
 *	Author: Funda Durupinar Babur<f.durupinar@gmail.com>
 */

var _ = require('underscore');

module.exports = function (model, docId) {



    console.log("ModelManager " + docId);

    model.ref('_page.doc', 'documents.' + docId);



    return {


        getModel: function () {
            return model;
        },

        getPageDoc: function(){
            return model.get('_page.doc');
        },


        addImage: function (data, user, noHistUpdate) {

            var images = model.get('_page.doc.images');
            if(images) {
                for (var i = 0; i < images.length; i++){
                    if(images[i].tabIndex === data.tabIndex) { //overwrite
                        images[i] = data;
                        if (!noHistUpdate)
                            this.updateHistory({opName: 'overwrite', opTarget: 'image', opAttr: data.fileName});

                        //overwrite images
                        model.set('_page.doc.images', images);
                        return;

                    }

                }

            }

            //if no such tab exists, insert a new tab
            model.pass({user: user}).push('_page.doc.images', data);

            if (!noHistUpdate)
                this.updateHistory({opName: 'add', opTarget: 'image', opAttr: data.fileName});
        },

        setName: function (userId, userName) {

            model.set('_page.doc.users.' + userId +'.name', userName);

        },

        getName: function (userId) {
            return model.get('_page.doc.users.' + userId + '.name');
        },

        getMessages: function(){
            return model.get('_page.doc.messages');
        },

        getUsers: function(){
            return model.get('_page.doc.users');
        },
        getUserIds: function(){
            return model.get('_page.doc.userIds');
        },


        addUser: function(userId){


            var userIds = model.get('_page.doc.userIds');

            if(!userIds || userIds.indexOf(userId) < 0) //user not in the list
                model.at('_page.doc.userIds').push(userId);


        },

        deleteUser: function(userId){
            // console.log("user deleted");
         //   model.del('_page.doc.users.'+ userId);
            var userIds = model.get('_page.doc.userIds');

            for(var i = 0; i < userIds.length; i++){

                if(userIds[i] == userId ){
                    model.remove('_page.doc.userIds', i) ; //remove from the index
                    break;
                }
            }
        },



        updateLayoutProperties: function (layoutProperties, user, noHistUpdate) {

            var currentLayoutProperties;
            var lp = model.get('_page.doc.cy.layoutProperties');


            currentLayoutProperties = _.clone(layoutProperties);



            model.pass({user: user}).set('_page.doc.cy.layoutProperties',  currentLayoutProperties); //synclayout

            if (!noHistUpdate)
                this.updateHistory({
                    opName: 'update',
                    opTarget: 'layout properties',
                    opAttr: JSON.stringify(currentLayoutProperties),
                    param: currentLayoutProperties,
                    prevParam: lp

                });
            return currentLayoutProperties;
        },

        getLayoutProperties: function (layoutProperties, user, noHistUpdate) {
           return model.get('_page.doc.cy.layoutProperties');

        },

        updateGeneralProperties: function (generalProperties, user, noHistUpdate) {

            var currentGeneralProperties;
            var lp = model.get('_page.doc.cy.generalProperties');


            currentGeneralProperties = _.clone(generalProperties);


            model.pass({user: user}).set('_page.doc.cy.generalProperties',  currentGeneralProperties); //synclayout

            if (!noHistUpdate)
                this.updateHistory({
                    opName: 'update',
                    opTarget: 'general properties',
                    opAttr: JSON.stringify(currentGeneralProperties),
                    param:currentGeneralProperties,
                    prevParam:lp
                });
            return currentGeneralProperties;
        },

        getGeneralProperties: function (generalProperties, user, noHistUpdate) {
            return model.get('_page.doc.cy.generalProperties');

        },

        updateGridProperties: function (gridProperties, user, noHistUpdate) {

            var currentGridProperties;
            var lp = model.get('_page.doc.cy.gridProperties');


            currentGridProperties = _.clone(gridProperties);


            model.pass({user: user}).set('_page.doc.cy.gridProperties',  currentGridProperties); //synclayout

            if (!noHistUpdate)
                this.updateHistory({
                    opName: 'update',
                    opTarget: 'grid properties',
                    opAttr: JSON.stringify(currentGridProperties),
                    param:currentGridProperties,
                    prevParam:lp
                });
            return currentGridProperties;
        },

        getGridProperties: function (gridProperties, user, noHistUpdate) {
            return model.get('_page.doc.cy.gridProperties');

        },

        /***
         *
         * @param cmd  {opName, opTarget,  elType, elId, opAttr,param, prevParam}
         * opName: set, load, open, add, select, unselect
         * opTarget: element, element group,  model, sample,
         * elType: node, edge
         * opAttr: highlightColor, lineColor, borderColor etc.
         */

        updateHistory: function (cmd) {
            var command = {
                // userName: userName,
                date: new Date,
                opName: cmd.opName,
                opTarget: cmd.opTarget,
                elType: cmd.elType,
                opAttr: cmd.opAttr,
                elId: cmd.elId,
                param: cmd.param,
                prevParam: cmd.prevParam
            };


            if (cmd != null) {

                var ind = model.push('_page.doc.history', command) - 1;



                model.set('_page.doc.undoIndex', ind);
            }

        },

        getHistory: function () {
            return model.get('_page.doc.history');
        },

        printHistory: function(){
            console.log("HISTORY:");
            var hist = model.get('_page.doc.history');
            for(var i = 0 ; i <hist.length;i++)
                console.log(i + " " + hist[i].opName);
        },

        getUndoActionStr: function () {

            var undoIndex = model.get('_page.doc.undoIndex');
            var cmd = model.get('_page.doc.history.' + undoIndex);


            var cmdStr = cmd.opName + " " + cmd.opTarget;

            if (cmd.opAttr != null)
                cmdStr += " " + cmd.opAttr;
            //    if(cmd.elId != null)
            //      cmdStr += " " + cmd.elId;

            return cmdStr;

        },

        getRedoActionStr: function () {
            var undoIndex = model.get('_page.doc.undoIndex');
            var cmd = model.get('_page.doc.history.' + (undoIndex + 1));

            var cmdStr = cmd.opName + " " + cmd.opTarget;
            if (cmd.opAttr != null)
                cmdStr += " " + cmd.opAttr;
            //  if(cmd.elId != null)
            //    cmdStr += " " + cmd.elId;

            return cmdStr;
        },
        isUndoPossible: function () {
            return (model.get('_page.doc.undoIndex') > 0)
        },
        isRedoPossible: function () {
            return (model.get('_page.doc.undoIndex') + 1 < model.get('_page.doc.history').length)
        },

        undoCommand: function () {
            var undoInd = model.get('_page.doc.undoIndex');
            var cmd = model.get('_page.doc.history.' + undoInd); // cmd: opName, opTarget, opAttr, elId, param


            if (cmd.opName == "set") {
                if (cmd.opTarget == "element" && cmd.elType == "node")
                    this.changeModelNodeAttribute(cmd.opAttr, cmd.elId, cmd.prevParam, null); //user is null to enable updating in the editor

                else if (cmd.opTarget == "element" && cmd.elType == "edge")
                    this.changeModelEdgeAttribute(cmd.opAttr, cmd.elId, cmd.prevParam, null);
                else if (cmd.opTarget == "element group")
                    this.changeModelElementGroupAttribute(cmd.opAttr, cmd.elId, cmd.prevParam, null);

            }
            else if (cmd.opName == "add") {
                if (cmd.opTarget == "element" && cmd.elType == "node")
                    this.deleteModelNode(cmd.elId);
                else if (cmd.opTarget == "element" && cmd.elType == "edge")
                    this.deleteModelEdge(cmd.elId);
                else if (cmd.opTarget == "compound")
                    this.removeModelCompound(cmd.elId, cmd.param.childrenList, cmd.prevParam);
            }
            else if (cmd.opName == "delete") {
                if (cmd.opTarget == "element")
                    this.restoreModelElement(cmd.elType, cmd.elId, cmd.prevParam);
                else if (cmd.opTarget == "element group"){

                    this.restoreModelElementGroup(cmd.elId, cmd.prevParam);
                }
                else if (cmd.opTarget == "compound")
                    this.addModelCompound(cmd.elId, cmd.prevParam.compoundAtts, cmd.prevParam.childrenList, cmd.prevParam.paramList);

            }
            else if(cmd.opName === "update"){ //properties
                if(cmd.opTarget.indexOf('general') >= 0)
                    this.updateGeneralProperties(cmd.prevParam);
                else if(cmd.opTarget.indexOf('layout') >= 0)
                    this.updateLayoutProperties(cmd.prevParam);
                else if(cmd.opTarget.indexOf('grid') >= 0)
                    this.updateGridProperties(cmd.prevParam);

            }
            else if (cmd.opName == "init") {
                this.newModel("me", true);
            }
            else if (cmd.opName == "new") { //delete all
                this.restoreModel(cmd.prevParam);

            }
            else if (cmd.opName == "merge") {
                this.newModel("me", true);
                this.restoreModel(cmd.prevParam);
            }


            undoInd = undoInd > 0 ? undoInd - 1 : 0;
            model.set('_page.doc.undoIndex', undoInd);

        },

        redoCommand: function () {
            var undoInd = model.get('_page.doc.undoIndex');
            var cmd = model.get('_page.doc.history.' + (undoInd + 1)); // cmd: opName, opTarget, opAttr, elId, param

            if (cmd.opName == "set") {
                if (cmd.opTarget == "element" && cmd.elType == "node")
                    this.changeModelNodeAttribute(cmd.opAttr, cmd.elId, cmd.param, null); //user is null to enable updating in the editor
                else if (cmd.opTarget == "element" && cmd.elType == "edge")
                    this.changeModelEdgeAttribute(cmd.opAttr, cmd.elId, cmd.param, null);
                else if (cmd.opTarget == "element group") {
                    this.changeModelElementGroupAttribute(cmd.opAttr, cmd.elId, cmd.param);

                }


            }
            else if (cmd.opName == "add") {
                if (cmd.opTarget == "element")
                    this.restoreModelElement(cmd.elType, cmd.elId, cmd.param, null);
                else if (cmd.opTarget == "compound")
                    this.addModelCompound(cmd.elId, cmd.param.compoundAtts, cmd.param.childrenList, cmd.param.paramList);


            }
            else if (cmd.opName == "delete") {
                if (cmd.opTarget == "element" && cmd.elType == "node")
                    this.deleteModelNode(cmd.elId);
                else if (cmd.opTarget == "element" && cmd.elType == "edge")
                    this.deleteModelEdge(cmd.elId);
                else if (cmd.opTarget == "element group")
                    this.deleteModelElementGroup(cmd.elId);
                else if (cmd.opTarget == "compound")
                    this.removeModelCompound(cmd.elId, cmd.prevParam.childrenList, cmd.param);

            }
            else if(cmd.opName === "update"){ //properties
                if(cmd.opTarget.indexOf('general') >= 0)
                    this.updateGeneralProperties(cmd.param);
                else if(cmd.opTarget.indexOf('layout') >= 0)
                    this.updateLayoutProperties(cmd.param);
                else if(cmd.opTarget.indexOf('grid') >= 0)
                    this.updateGridProperties(cmd.param);

            }
            else if (cmd.opName == "init") {
                this.restoreModel(cmd.param);
            }
            else if (cmd.opName == "new") { //delete all
                this.newModel();
            }
            else if (cmd.opName == "merge") { //delete all
                this.restoreModel(cmd.param);

            }


            undoInd = undoInd < model.get('_page.doc.history').length - 1 ? undoInd + 1 : model.get('_page.doc.history').length - 1;

            model.set('_page.doc.undoIndex', undoInd);

        },


        getModelNode: function (id) {
            var nodePath = model.at('_page.doc.cy.nodes.' + id);
            return nodePath.get();
        },

        getModelEdge: function (id) {

            var edgePath = model.at('_page.doc.cy.edges.' + id);

            return edgePath.get();
        },

        selectModelNode: function (node, userId, user,  noHistUpdate) {

            var nodePath = model.at('_page.doc.cy.nodes.' + node.id());
            if (nodePath.get() == null)
                return "Node id not found";

            var userPath = model.at('_page.doc.users.' + userId);



            model.pass({user: user}).set('_page.doc.cy.nodes.' + node.id()+ '.highlightColor', userPath.get('colorCode'));


            return "success";

        },


        selectModelEdge: function (edge, userId, user,  noHistUpdate) {

            var edgePath = model.at('_page.doc.cy.edges.' + edge.id());
            if (edgePath.get() == null)
                return "Edge id not found";
            var userPath = model.at('_page.doc.users.' + userId);
            model.pass({user: user}).set('_page.doc.cy.edges.' + edge.id()+ '.highlightColor', userPath.get('colorCode'));




            return "success";

        },
        unselectModelNode: function (node,  user, noHistUpdate) {

            var nodePath = model.at('_page.doc.cy.nodes.' + node.id());

            if (nodePath.get() == null)
                return "Node id not found";

            model.pass({user: user}).set('_page.doc.cy.nodes.' + node.id() + '.highlightColor', null);

            return "success";

        },


        unselectModelEdge: function (edge,  user, noHistUpdate) {

            var edgePath = model.at('_page.doc.cy.edges.' + edge.id());
            if (edgePath.get() == null)
                return "Edge id not found";

            model.pass({user: user}).set('_page.doc.cy.edges.' + edge.id() + '.highlightColor', null);

            return "success";


        },


        addModelNode: function (nodeId, param, user, noHistUpdate) {


            if (model.get("_page.doc.cy.nodes." + nodeId + '.id') != null)
                return "Node cannot be duplicated";

            model.pass({user: user}).set('_page.doc.cy.nodes.' + nodeId + '.data.id', nodeId);
            model.pass({user: user}).set('_page.doc.cy.nodes.' + nodeId + '.position', {x: param.x, y: param.y});
            model.pass({user: user}).set('_page.doc.cy.nodes.' + nodeId + '.data.class', param.class);

            //adding the node in cytoscape
            model.pass({user: user}).set('_page.doc.cy.nodes.' + nodeId + '.addedLater', true);


            if (!noHistUpdate)
            //We don't want all the attributes of the param to be printed
                this.updateHistory({
                    opName: 'add',
                    opTarget: 'element',
                    elType: 'node',
                    elId: nodeId,
                    param: {x: param.x, y: param.y, class: param.class}
                });


            return "success";

        },

        addModelEdge: function (edgeId, param, user, noHistUpdate) {

            if (model.get("_page.doc.cy.edges." + edgeId + '.id') != null)
                return "Edge cannot be duplicated";

            model.pass({user: user}).set('_page.doc.cy.edges.' + edgeId + '.data.id', edgeId);
            model.pass({user: user}).set('_page.doc.cy.edges.' + edgeId + '.data.class', param.class);

            model.pass({user: user}).set('_page.doc.cy.edges.' + edgeId + '.data.source', param.source);
            model.pass({user: user}).set('_page.doc.cy.edges.' + edgeId + '.data.target', param.target);

            //adding the edge...other operations should be called after this
            model.pass({user: user}).set('_page.doc.cy.edges.' + edgeId + '.addedLater', true);


            if (!noHistUpdate)
                this.updateHistory({opName: 'add', opTarget: 'element', elType: 'edge', elId: edgeId, param: param});

            return "success";

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
        addModelCompound: function (compoundId, compoundAtts, elList, paramList, user, noHistUpdate) {


            var prevParentList = [];
            paramList.forEach(function(param){
                prevParentList.push(paramList.parent);
            });
            this.addModelNode(compoundId, compoundAtts, user, true);


            this.changeModelElementGroupAttribute("data", elList, paramList, user, true);



            if (!noHistUpdate)
                this.updateHistory({
                    opName: 'add',
                    opTarget: 'compound',
                    elId: compoundId,
                    param: {paramList: paramList, childrenList: elList, compoundAtts: compoundAtts},
                    prevParam:  prevParentList //TODO
                });

        },

        //change children's parents to their old parents
        removeModelCompound: function (compoundId, childrenList, prevParentList, user, noHistUpdate) {

            var nodePath = model.at('_page.doc.cy.nodes.' + compoundId);

            var compoundAtts = {
                id: compoundId,
                class: nodePath.get('class'),
                x: nodePath.get('position.x'),
                y: nodePath.get('position.y')

            };

            var paramList = [];
            childrenList.forEach(function(child){
                var data = model.get('_page.doc.cy.nodes.'+child.id + '.data');
                paramList.push(data);
            });

            //isolate the compound first, then delete
            this.changeModelElementGroupAttribute("data.parent", childrenList, prevParentList, user, true);
            this.deleteModelNode(compoundId, user, true);




            if (!noHistUpdate)
                this.updateHistory({
                    opName: 'delete',
                    opTarget: 'compound',
                    elId: compoundId,
                    prevParam: {childrenList: childrenList, compoundAtts: compoundAtts, paramList: paramList},
                    param: prevParentList
                });

        },



        //attStr: attribute namein the model
        //historyData is for  sbgnStatesAndInfos only
        changeModelElementGroupAttribute: function (attStr, elList, paramList, user, noHistUpdate) { //historyData){

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
            elList.forEach(function (el) {
                var currAttVal = paramList[ind++];

                if (el.isNode)
                    self.changeModelNodeAttribute(attStr, el.id, currAttVal, user, true); //don't update individual histories
                else
                    self.changeModelEdgeAttribute(attStr, el.id, currAttVal, user, true);

            });

            return "success";

        },

        getModelNodeAttribute:function(attStr, nodeId){
            var nodePath = model.at('_page.doc.cy.nodes.' + nodeId);

            return nodePath.get(attStr);
        },

        getModelEdgeAttribute:function(attStr, edgeId){
            var edgePath = model.at('_page.doc.cy.edges.' + edgeId);

            return edgePath.get(attStr);
        },
        //attStr: attribute namein the model
        //historyData is for  sbgnStatesAndInfos only
        changeModelNodeAttribute: function (attStr, nodeId, attVal, user, noHistUpdate) { //historyData){

            var status = "Node id not found";
            var nodePath = model.at('_page.doc.cy.nodes.' + nodeId);


            var prevAttVal = nodePath.get(attStr);


            if(attStr === "width") //as we read this directly from cy.data
                attStr = "borderWidth";



            nodePath.pass({user: user}).set(attStr, attVal);


            if (attStr == "expandCollapseStatus") {
                if (attVal == "expand")
                    prevAttVal = "collapse";
                else //if null or collapse
                    prevAttVal = "expand";
            }



            if (attStr != 'interactionCount') {
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


        changeModelEdgeAttribute: function (attStr, edgeId, attVal, user, noHistUpdate) {
            var status = "Edge id not found";
            var edgePath = model.at('_page.doc.cy.edges.' + edgeId);
            var prevAttVal = edgePath.get(attStr);
            edgePath.pass({user: user}).set(attStr, attVal);


            var sourceId = edgePath.get('source');
            var targetId = edgePath.get('target');
            if (sourceId)
                model.increment('_page.doc.cy.nodes.' + sourceId + '.interactionCount', 1);
            if (targetId)
                model.increment('_page.doc.cy.nodes.' + targetId + '.interactionCount', 1);


            if (!noHistUpdate) {

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
        deleteModelNode: function (nodeId, user, noHistUpdate) {
            var nodePath = model.at('_page.doc.cy.nodes.' + nodeId);

            if (nodePath.get() == null)
                return "Node id not found";

            if (!noHistUpdate) {


                prevParam = nodePath.get();

                this.updateHistory({
                    opName: 'delete',
                    opTarget: 'element',
                    elType: 'node',
                    elId: nodeId,
                    prevParam: prevParam
                });

            }

            model.pass({user: user}).del(('_page.doc.cy.nodes.' + nodeId));


            return "success";

        },


        deleteModelEdge: function (edgeId, user, noHistUpdate) {

            var edgePath = model.at('_page.doc.cy.edges.' + edgeId);
            if (edgePath.get() == null)
                return "Edge id not found";


            if (!noHistUpdate) {

                prevParam = edgePath.get();

                this.updateHistory({
                    opName: 'delete',
                    opTarget: 'element',
                    elType: 'edge',
                    elId: edgeId,
                    prevParam: prevParam
                });

            }

            model.pass({user: user}).del(('_page.doc.cy.edges.' + edgeId));

            return "success";

        },


        deleteModelElementGroup: function (selectedEles, user, noHistUpdate) {
            var prevParamsNodes = [];
            var prevParamsEdges = [];
            var self = this;


            if(selectedEles.edges!= null){
                selectedEles.edges.forEach(function (edge) {
                    var edgePath = model.at('_page.doc.cy.edges.' + edge.id);
                    prevParamsEdges.push(edgePath.get());
                });


                selectedEles.edges.forEach(function (edge) {
                    self.deleteModelEdge(edge.id, user, true); //will not update children history
                });
            }

            if(selectedEles.nodes!= null) {
                selectedEles.nodes.forEach(function (node) {
                    var nodePath = model.at('_page.doc.cy.nodes.' + node.id);

                    prevParamsNodes.push(nodePath.get());
                });


                selectedEles.nodes.forEach(function (node) {
                    self.deleteModelNode(node.id, user, true); //will not update children history
                });
            }
            if (!noHistUpdate)
                this.updateHistory({
                    opName: 'delete',
                    opTarget: 'element group',
                    elId: selectedEles,
                    prevParam: {nodes: prevParamsNodes, edges: prevParamsEdges}
                });


        },

        restoreModelElementGroup: function (elList, param, user, noHistUpdate) {
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
            }



            if (!noHistUpdate)
                self.updateHistory({opName: 'restore', opTarget: 'element group', elId: elList});
        },
        /**
         * Restore operations for global undo/redo
         */
        restoreModelNode: function (nodeId, param, user, noHistUpdate) {

            this.addModelNode(nodeId, {x: param.position.x, y: param.position.y, class:param.data.class}, user, noHistUpdate);

            //No need to init -- data and position are updated in the next steps


            for(att in param){
                if(param.hasOwnProperty(att) && att !== "addedLater"){


                    console.log(att);
                    console.log(param[att]);


                    console.log(user);
                    model.pass({user:user}).set(('_page.doc.cy.nodes.' + nodeId + '.' + att), param[att]);
                }
            }

            if (!noHistUpdate)
                this.updateHistory({opName: 'restore', opTarget: 'element', elType: 'node', elId: nodeId});
        },

        restoreModelEdge: function (edgeId, param, user, noHistUpdate) {

            this.addModelEdge(edgeId, {source: param.data.source, target:param.data.target, class: param.data.class}, user, noHistUpdate);
            //No need to init -- data and position are updated in the next steps


            for(att in param){
                if(param.hasOwnProperty(att) && att !== "addedLater"){
                    model.pass({user:user}).set(('_page.doc.cy.edges.' + edgeId + '.' + att), param[att]);
                }
            }


            if (!noHistUpdate)
                this.updateHistory({opName: 'restore', opTarget: 'element', elType: 'edge', elId: edgeId});
        },


        restoreModelElement: function (elType, elId, param, user, noHistUpdate) {

            if (elType == "node")
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
        restoreModel: function (modelCy, user, noHistUpdate) {
            var prevParam = model.get('_page.doc.cy');
            model.set('_page.doc.cy', modelCy);

            // this.setSampleInd(-1, null, true); //to get a new container

            if (!noHistUpdate)
                this.updateHistory({opName: 'restore', prevParam: prevParam, param: modelCy, opTarget: 'model'});

        },

        //should be called before loading a new graph to prevent id confusion
        newModel: function (user, noHistUpdate) {

            var self = this;
            var prevModelCy = model.get('_page.doc.cy');


            if (!noHistUpdate)
                this.updateHistory({opName: 'new', prevParam: prevModelCy, opTarget: 'model'});

            var edges = model.get('_page.doc.cy.edges');
            var nodes = model.get('_page.doc.cy.nodes');


            for (var att in edges) {
                if (edges.hasOwnProperty(att)) {
                    self.deleteModelEdge(edges[att].id, user, true);
                }
            }

            for (var att in nodes) {
                if (nodes.hasOwnProperty(att)) {
                    self.deleteModelNode(nodes[att].id, user, true);
                }
            }


        },


        //should be called before loading a new graph to prevent id confusion
        deleteAll: function (nodes, edges, user, noHistUpdate) {

            var self = this;

            if (!noHistUpdate)
                this.updateHistory({opName: 'new', opTarget: 'model'});


            edges.forEach(function (edge) {
                self.deleteModelEdge(edge.id(), user, noHistUpdate);
            });

            nodes.forEach(function (node) {
                self.deleteModelNode(node.id(), user, noHistUpdate);
            });


        },

        //convert model to array
        getJsonFromModel: function () {

            var nodes = model.get('_page.doc.cy.nodes');


            if (nodes == null)
                return null;

            var edges = model.get('_page.doc.cy.edges');

            var jsonNodes = [];
            var jsonEdges = [];


            for (var att in nodes) {

                if (nodes.hasOwnProperty(att)) {
                    var node = nodes[att];
                    var jsonNode = {
                        data: node.data
                    };

                    jsonNodes.push(jsonNode);
                }
            }


            for (var att in edges) {
                if (edges.hasOwnProperty(att)) {
                    var edge = edges[att];

                    var jsonEdge = {
                        data: edge.data
                    };

                    jsonEdges.push(jsonEdge);
                }
            }


            return {nodes: jsonNodes, edges: jsonEdges};


    },


        /***
         *
         * @param node: Cytoscape node
         * @param user: to make sure we don't update the data of same client
         * @param noHistUpdate
         */
        initModelNode: function (node, user, noHistUpdate) {


            var nodePath = model.at('_page.doc.cy.nodes.' + node.id());

            if (!noHistUpdate)
                this.updateHistory({opName: 'init', opTarget: 'element', elType: 'node', elId: node.id()});


            nodePath.set('id', node.id());


            var interactionCount = nodePath.get('interactionCount');

            if (interactionCount == null) //this is not stored in cy
                this.changeModelNodeAttribute('interactionCount', node.id(), 0, user, true); //don't update history

            var data = nodePath.get('data');
            //bbox is a random data parameter to make sure all data parts are already in the model
            //if the only data parameters are id and class, it means it has just been added without initialization
            if (data != null && data.bbox!=null) //it means data has been added before
                node.data(data);

            else {
                //correct the labels from PC queries
                var nodeData = node.data();
                if(nodeData == null)
                    nodeData = node._private.data;

                if(nodeData.statesandinfos) {

                    for (var i = 0; i < nodeData.statesandinfos.length; i++) {

                        if (nodeData.statesandinfos[i].clazz === "state variable") {
                            if (nodeData.statesandinfos[i].state.value === "opthr") {
                                nodeData.statesandinfos[i].state.value = "p";
                                nodeData.statesandinfos[i].state.variable = "T" + nodeData.statesandinfos[i].state.variable;
                            }
                            else if (nodeData.statesandinfos[i].state.value === "opser") {
                                nodeData.statesandinfos[i].state.value = "p";
                                nodeData.statesandinfos[i].state.variable = "S" + nodeData.statesandinfos[i].state.variable;
                            }
                            else if (nodeData.statesandinfos[i].state.value === "optyr") {
                                nodeData.statesandinfos[i].state.value = "p";
                                nodeData.statesandinfos[i].state.variable = "Y" + nodeData.statesandinfos[i].state.variable;
                            }
                        }

                    }
                    node._private.data.statesandinfos = nodeData.statesandinfos;
                }
                this.changeModelNodeAttribute('data', node.id(), nodeData, user, noHistUpdate);
            }

            //make this initially unselected
        //    nodePath.set('highlightColor', null);


            var pos = nodePath.get('position');
            if (pos != null)
                node.position(pos);

            else {
                var nodePosition = node.position();
                if(nodePosition == null)
                    nodePosition = node._private.position;
                this.changeModelNodeAttribute('position', node.id(), nodePosition, user, noHistUpdate);
            }

            //Initializing css properties causes bypass problems!!




        },
        initModelEdge: function (edge, user, noHistUpdate) {


            var edgePath = model.at('_page.doc.cy.edges.' + edge.id());


            if (!noHistUpdate)
                this.updateHistory({opName: 'init', opTarget: 'element', elType: 'edge', elId: edge.id()});


            edgePath.set('id', edge.id());



            //make this initially unselected
            //edgePath.set('highlightColor', null);

            var data = edgePath.get('data');
            //cardinality is a random data parameter to make sure all data parts are already in the model
            //if the only data parameters are id and class, it means it has just been added without initialization
            if (data != null && data.cardinality != null)
                edge.data(data);

            else {
                var edgeData = edge.data();
                if(edgeData == null)
                    edgeData = edge._private.data;
                this.changeModelEdgeAttribute('data', edge.id(), edgeData, user, noHistUpdate);
            }



        },




        /***
         *
         * @param nodes: cy elements
         * @param edges: cy elements
         * @param appUtilities: to update properties
         * @param user
         * @param noHistUpdate
         */
        initModel: function ( nodes, edges, appUtilities, user, noHistUpdate) {

            var self = this;

            console.log("inited");

            nodes.forEach(function (node) {
                self.initModelNode(node, user, true);

            });

            edges.forEach(function (edge) {
                self.initModelEdge(edge, user, true);
            });


            var newModelCy = model.get('_page.doc.cy');


            if(newModelCy) {
                if (newModelCy.layoutProperties == null)
                    model.set('_page.doc.cy.layoutProperties', _.clone(appUtilities.defaultLayoutProperties));

                if (newModelCy.generalProperties == null)
                    model.set('_page.doc.cy.generalProperties', _.clone(appUtilities.defaultGeneralProperties));

                if (newModelCy.gridProperties == null)
                    model.set('_page.doc.cy.gridProperties', _.clone(appUtilities.defaultGridProperties));
            }


            if (!noHistUpdate) {
                this.updateHistory({opName: 'init', param: newModelCy, opTarget: 'model'});
            }

            //notifies other clients to update their cy graphs
           model.pass({user:"me"}).set('_page.doc.cy.initTime', new Date());

        },



        setRollbackPoint: function () {
            var modelCy = this.getModelCy();
            model.set('_page.doc.prevCy', modelCy);
        },

        getModelCy: function () {
            return model.get('_page.doc.cy');
        },

        //for undo/redo only
        mergeJsons: function (user, noHistUpdate) {
            var modelCy = model.get('_page.doc.cy');
            var prevModelCy = model.get('_page.doc.prevCy');

            if (!noHistUpdate) {

                this.updateHistory({opName: 'merge', prevParam: prevModelCy, param: modelCy, opTarget: 'model'});
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