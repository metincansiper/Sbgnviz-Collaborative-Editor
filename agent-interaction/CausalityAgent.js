
/**
 * Created by durupina on 5/13/16.
 * Computer agent with the purpose of creating a model of causal relationships in ovarian cancer data
 */

CausalityAgent.prototype = new Agent();



function CausalityAgent(name, id) {
    this.agentName = name;
    this.agentId = id;

    this.pnnlDb;
    this.causality = {};
    this.allSifRelations = {};
    this.geneSig = {};

    this.geneNameArr = []; //all the relevant gene names for OV


    this.indCausal = -1;
    this.nextNonCausalCorr = -1000;
    this.currCorr = -1000;

    this.geneContext;


}
/***
 *
 */
CausalityAgent.prototype.init = function(){

    var self = this;
    var sifFilePath = "./CausalPath/PC.sif";
    var causalityFilePath = "./CausalPath/causative.sif";
    var mutSigFilePath = "./TCGA/OV/scores-mutsig.txt";

    // self.sendMessage({text:"Please wait while I am loading the phosphoproteomics dataset from PNNL."}, "*");


    //Clean the sbgnviz canvas
    this.sendRequest('agentNewFileRequest');




    //Read pnnl data from database
    //Read pnnl data from the server

    var dbName = "pnnl";
    self.pnnlDb = createPNNLDatabase(dbName);



   self.pnnlDb.init(dbName);


    this.readAllSifRelations(sifFilePath);
    this.readCausality(causalityFilePath);

    this.readMutSig(mutSigFilePath);


    //   window.indexedDB.deleteDatabase(dbName, 3);


   //
   //
   //  self.sendMessage({text:"Please wait while I'm getting the PNNL data from the server."}, "*");
   //
   //  self.sendRequest('agentPNNLRequest', null, function(pnnlArr) {
   //
   //      self.pnnlDb.init(dbName, pnnlArr);
   // });


    //
    // setTimeout(function(){
    //
    //
    //     self.findDemoGenes();
    // }, 1000);


    self.sendMessage("Let’s build a pathway model for ovarian cancer using the phosphoproteomics dataset from PNNL.", "*");

    self.listenToMessages();

  //  });

}

/***
 * Read the binary directed relationships between genes and store them in this.allSifRelations
 * @param sifFilePath: path to PC.sif
 */
CausalityAgent.prototype.readAllSifRelations = function(sifFilePath){
    var self = this;

    readTextFile(sifFilePath, function (fileContent) {
        var sifRels = fileContent.split("\n");

        sifRels.forEach(function(line){

            var vals = line.split("\t");
            var id1 = vals[2].toUpperCase(); //opposite order because of upstream checking
            var id2 = vals[0].toUpperCase();
            var rel = vals[1];

            if(self.allSifRelations[id1])
                self.allSifRelations[id1].push({rel:rel, id2: id2});
            else
                self.allSifRelations[id1] = [{rel:rel, id2: id2}];
        });
    });
}


var convertToOppositeRel = function(rel){

    var oppRel ="";

    if(rel === "phosphorylates")
        oppRel = "is-phosphorylated-by";
    else if(rel === "dephosphorylates")
        oppRel = "is-dephosphorylated-by";
    else if(rel === "upregulates-expression")
        oppRel = "expression-is-upregulated-by";
    else if(rel === "downregulates-expression")
        oppRel = "expression-is-downregulated-by";
    return oppRel;

}
/**
 * Read causal relationships and their PC links and store them in this.causality
 * * @param causalityFilePath: path to causative.sif
 */
CausalityAgent.prototype.readCausality = function(causalityFilePath, callback){
    var self = this;


    readTextFile(causalityFilePath, function (fileContent) {
        var causalRels = fileContent.split("\n"); //start from the second line

        causalRels.forEach(function(line){
            var vals = line.split("\t");
            var id1 = vals[0].toUpperCase();
            var id2 = vals[2].toUpperCase();

            var uriArr = [];


            if(vals[3]) {
                uriArr = vals[3].split(" ");

                if (!uriArr)
                    uriArr = [vals[3]];
            }

            var uriStr = "";
            uriArr.forEach(function(uri){
                uriStr += "uri= " + uri +"&"
            });




            if(self.causality[id1])
                self.causality[id1].push({rel: vals[1], id2: id2, uriStr: uriStr});
            else
                self.causality[id1] = [{rel: vals[1], id2: id2, uriStr: uriStr}];


            if(self.causality[id2])
                self.causality[id2].push({rel: convertToOppositeRel(vals[1]), id2: id1, uriStr: uriStr});
            else
                self.causality[id2] = [{rel: convertToOppositeRel(vals[1]), id2: id1, uriStr: uriStr}];



            //all the gene names we are working on
            if(self.geneNameArr.indexOf(id1)< 0)
                self.geneNameArr.push(id1);

            if(self.geneNameArr.indexOf(id2)< 0)
                self.geneNameArr.push(id2);
        });

        if(callback) callback();

    });
}

CausalityAgent.prototype.readMutSig = function (mutSigFilePath) {
    var self =  this;

    readTextFile(mutSigFilePath, function (fileContent) {
        var genes = fileContent.split("\n").slice(1); //start from the second line


        genes.forEach(function(gene){
            var geneInfo = gene.split("\t");
            var pVal = Number(geneInfo[17]);
            // var importance = (pVal== 0) ? 100 : -Math.log10(pVal);


            self.geneSig[geneInfo[1]] = pVal;


        });
    });
}

/***
 * Listen to messages from other actors and act accordingly
 * @param callback
 */
CausalityAgent.prototype.listenToMessages = function(callback){
    var self = this;
    this.socket.on('message', function(data){
        if(data.userId != self.agentId) {
            //convert every word to upper case and remove punctuation

            var sentence = (data.comment[0].text.toUpperCase()).replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g, "");
            var words = sentence.split(' ');

            if(sentence.indexOf("YES")>=0) {
                var agentMsg  = "OK, I am updating my model and the graph..."
                self.sendMessage(agentMsg, "*", function () {
                    self.updateAgentModel(data.comment[0].text, function(){


                        if (callback) callback();
                    });

                });


            }
            else if(sentence.indexOf("NO")>=0) {
                // setTimeout(function () {
                //     self.tellNextNonCausalityNonCausality(self.geneContext, callback);
                // }, 1000);


                self.tellCorrelation(self.geneContext, callback);
            }
            else {


                self.findRelevantGeneFromSentence(words, function (gene) {
                    if(self.geneContext !== gene){ //a new gene with different values
                        self.currCorr = -1000;
                        self.nextNonCausalCorr = -1000;

                        self.geneContext = gene;

                        self.tellMutSig(gene, callback);

                        self.tellCorrelation(gene, callback);
                    }




                });

                if (sentence.indexOf("RELATION") >= 0 ||sentence.indexOf("EXPLANATION") >= 0) {
                    if (self.indCausal > -1)
                        self.tellCausality(self.geneContext, callback);

                    setTimeout(function () {
                        self.tellNonCausality(self.geneContext, callback);
                    }, 1000);
                }
            }

        }
    });
}

CausalityAgent.prototype.updateAgentModel = function(text, callback){
    var self = this;



    self.socket.emit("REACHQuery", "indexcard", text, function (data) {

        var cards = JSON.parse(data).cards;

        cards.forEach(function(card){
            var jsonData = idxCardToJson.createJson({cards: [card]});

            try {
                var gene1 = card.extracted_information.participant_a.entity_text.toUpperCase();
                var gene2 = card.extracted_information.participant_b.entity_text.toUpperCase();
                var rel = card.extracted_information.interaction_type;





                if (gene1 && gene2 && rel) {
                    if(rel === "adds_modification")
                        rel = "phosphorylates";
                    else if(rel === "removes_modification")
                        rel = "dephosphorylates";


                    if(self.causality[gene1])
                        self.causality[gene1].push({id1: gene1, id2: gene2, rel: rel});
                    else
                        self.causality[gene1] = [{id1: gene1, id2: gene2, rel: rel}];

                    if(self.causality[gene2])
                        self.causality[gene2].push({id1: gene2, id2: gene1, rel: convertToOppositeRel(self.causality[gene1])});
                    else
                        self.causality[gene2] = [{id1: gene2, id2: gene1, rel: convertToOppositeRel(self.causality[gene1])}];
                }
            }
            catch(error){
                console.log(error);
            }

            self.sendRequest("agentMergeGraphRequest", {graph: jsonData, type:"json"}, function(){
                if (callback) callback();
            });

        });
    });
}

CausalityAgent.prototype.tellMutSig = function(gene, callback) {
    var self = this;
var agentMsg= "";
    var pVal = self.geneSig[gene];
    if(pVal < 0.01)
        agentMsg = gene + " is highly significantly mutated in ovarian cancer with a p value of "+ pVal + ". ";
    else if (pVal < 0.05)
        agentMsg = gene + " is significantly mutated in ovarian cancer with a p value of "+ pVal + ". ";
    else
        agentMsg = gene + " is not significantly mutated in ovarian cancer.";

    self.sendMessage(agentMsg, "*", function () {
        if (callback) callback();
    });

}


CausalityAgent.prototype.tellNonCausality = function(gene, callback) {
    var self = this;
    //Find non-causal but correlational genes
    var geneNonCausal;
    var corrVal;





    self.pnnlDb.getEntry("id1", gene, function(geneCorrArr) {

        var maxNonCausalCorr = -1000;
        var indCorr = -1;



        for (var j = 0; j < geneCorrArr.length; j++) {
            var geneCorr = geneCorrArr[j].id2;

            if (!self.hasCausalRelationship(gene, geneCorr)) {

                corrVal = Math.abs(geneCorrArr[j].correlation);

                if((corrVal > maxNonCausalCorr) && (corrVal < Math.abs(self.currCorr) ||self.currCorr < - 1 )){
                    maxNonCausalCorr = corrVal;
                    indCorr = j;
                    geneNonCausal = geneCorr;

                }


            }
        }

        if (geneNonCausal) {

            self.currCorr = geneCorrArr[indCorr].correlation;

            var agentMsg = "I am looking at the next highest correlation about " + gene + ". ";


            agentMsg += "I can't find any causal relationships between " + gene +" and " + geneNonCausal + " although they have a correlation of " + parseFloat(maxNonCausalCorr).toFixed(3) + ". ";

            agentMsg += "But the highest correlation " + toCorrelationDetailString(geneCorrArr, indCorr);


            var commonUpstreams = self.findCommonUpstreams(gene, geneNonCausal);

            agentMsg += makeUpstreamStr(commonUpstreams);

                self.sendMessage(agentMsg, "*", function () {

                    if (callback) callback();
            });
        }
    });

}


/***
 * Respond to queries from other actors to find explainable relationships around gene
 * @param gene: gene name
 * @param callback
 */
CausalityAgent.prototype.tellCausality = function(gene, callback) {

    var self = this;

    var relText = self.causality[gene][self.indCausal].rel.replace(/[-]/g, " ");

    var agentMsg = gene + " " + relText + " " + self.causality[gene][self.indCausal].id2 + ". Here's it's graph. ";


        self.sendMessage(agentMsg, "*", function () {

            if (callback) callback();
    });

    self.showCausality(gene, self.indCausal, callback);




}

/***
 * Corrects PC psite information
 * @param pSite
 * @param letter
 * @returns {*}
 */
function editPSite(pSite, letter){

    if(pSite && pSite.length > 0 ){
        if(pSite[0] === letter && pSite[pSite.length - 1] === letter)
            pSite = pSite.slice(0,pSite.length - 1  );
    }
    return pSite;

}

function toCorrelationDetailString(geneCorrArr, indCorr, maxCorr){

    var pMsg1 = "";
    var pMsg2 = "";
    var agentMsg;

    geneCorrArr[indCorr].pSite1= editPSite(geneCorrArr[indCorr].pSite1, "S");
    geneCorrArr[indCorr].pSite2=editPSite(geneCorrArr[indCorr].pSite2, "S");


    geneCorrArr[indCorr].pSite1= editPSite(geneCorrArr[indCorr].pSite1, "T");
    geneCorrArr[indCorr].pSite2=editPSite(geneCorrArr[indCorr].pSite2, "T");


    geneCorrArr[indCorr].pSite1= editPSite(geneCorrArr[indCorr].pSite1, "Y");
    geneCorrArr[indCorr].pSite2= editPSite(geneCorrArr[indCorr].pSite2, "Y");


    if(geneCorrArr[indCorr].pSite1)
        pMsg1 = "of " + geneCorrArr[indCorr].pSite1 + " phosphorylation of " + geneCorrArr[indCorr].id1;
    else
        pMsg1 = "of " + geneCorrArr[indCorr].id1 + " total protein";

    if(geneCorrArr[indCorr].pSite2)
        pMsg2 =  "with " + geneCorrArr[indCorr].pSite2 + " phosphorylation of " + geneCorrArr[indCorr].id2;
    else
        pMsg2 =  "with " + geneCorrArr[indCorr].id2 + " total protein";



    var corrVal = parseFloat(geneCorrArr[indCorr].correlation).toFixed(3);
    if(maxCorr)
        corrVal = parseFloat(maxCorr).toFixed(3);

    agentMsg =  pMsg1 + " is the correlation " +  pMsg2 + " with a value of " +  corrVal + ". ";

    return agentMsg;

}


/***
 * Respond to queries from other actors to find explainable relationships around gene
 * @param gene: gene name
 * @param callback
 */
CausalityAgent.prototype.tellCorrelation = function(gene, callback){

    var agentMsg ="";
    var self = this;
    var indCorr = -1;

    self.indCausal = -1;

    self.nonCausalCorr = -1000;
    var maxCorr = -1000;

    //get pnnl genes
    self.pnnlDb.getEntry("id1", gene, function(geneCorrArr) {


        if (self.causality[gene]) { //gene has causal relationships
            for (var j = 0; j < geneCorrArr.length; j++) {
                var geneCorr = geneCorrArr[j].id2;

                for (var i = 0; i < self.causality[gene].length; i++) {
                    var geneCausal = self.causality[gene][i].id2;
                    var corrVal = Math.abs(geneCorrArr[j].correlation);
                    if (geneCausal === geneCorr && corrVal> maxCorr && (self.currCorr < -1 ||  corrVal < Math.abs(self.currCorr))) {
                        self.indCausal = i;
                        indCorr = j;
                        maxCorr = Math.abs(geneCorrArr[j].correlation);
                    }
                }
            }
        }

        if (self.indCausal > -1) {

            self.currCorr = geneCorrArr[indCorr].correlation; //highest correlation
            agentMsg = "The largest explainable correlation " + toCorrelationDetailString(geneCorrArr, indCorr);



        }
        else { //no causal explanation around gene

            agentMsg = "I can't find any causal relationships about " + gene + ". ";

            //Find and assign maximum correlation

            var indCorr = -1;

            maxCorr = -1000;
            for (var j = 0; j < geneCorrArr.length; j++) {
                var corrVal = Math.abs(geneCorrArr[j].correlation );
                if(corrVal > maxCorr && (self.currCorr < -1  ||  corrVal < Math.abs(self.currCorr))){
                    indCorr = j;
                    maxCorr = Math.abs(geneCorrArr[j].correlation);
                }

            }


            if (indCorr > -1) {
                self.currCorr = geneCorrArr[indCorr].correlation;

                agentMsg += "But the highest unexplainable correlation " + toCorrelationDetailString(geneCorrArr, indCorr);


                //Search common upstreams of gene and its correlated
                var commonUpstreams = self.findCommonUpstreams(gene, geneCorr);
                agentMsg += makeUpstreamStr(commonUpstreams);

            }

        }
        self.sendMessage(agentMsg, "*", function () {

            if (callback) callback();
        });

    });

}
/***
 *
 * @param commonUpstreams: in an array
 * @returns {string}
 */
function makeUpstreamStr(commonUpstreams){
    var upstreamStr = "";
    for(var i = 0; i < commonUpstreams.length; i++)
        upstreamStr += commonUpstreams[i] + " ";

    var agentMsg;
    if(upstreamStr){

        if(commonUpstreams.length === 1)
            agentMsg = "They have a common upstream " + upstreamStr + ". Does that make sense? ";
        else
            agentMsg = "They have common upstreams " + upstreamStr + ". Do any of these make sense? ";

    }
    else
        agentMsg = "They don't have a common upstream. Do you have any explanation about the relationship between these?";

    return agentMsg;
}
/***
 * Send a PC query for the relationship between gene and its most correlated causal neighbor
 * @param gene
 * @param ind: Index of the highest correlated causal neighbor
 * @param callback
 */

CausalityAgent.prototype.showCausality = function(gene, ind, callback){
    var self = this;


    var geneRelationshipArr = self.causality[gene];

    if(geneRelationshipArr[ind].uriStr.length >0) {

        self.mergePCQuery(geneRelationshipArr[ind].uriStr, function (result) {
            if (ind >= geneRelationshipArr.length - 1 && callback)
                callback();

        });
    }

}

/***
 * Send PC query and merge with the current graph
 * @param uriStr
 * @param callback
 */

CausalityAgent.prototype.mergePCQuery = function(uriStr, callback){
    var pc2URL = "http://www.pathwaycommons.org/pc2/get?";
    var format = "format=SBGN";

    pc2URL = pc2URL + uriStr + format;

    this.socket.emit('MergePCQuery', {url: pc2URL, type: "sbgn"}, function(data){

        if(callback) callback(data);
    });

}




/***
 * @param gene1
 * @param gene2
 * @returns An array of names of common upstream genes for gene1 and gene2
 */
CausalityAgent.prototype.findCommonUpstreams = function(gene1, gene2){

    var gene1Rels = this.allSifRelations[gene1];
    var gene2Rels = this.allSifRelations[gene2];
    var upstreams = [];

    if(!gene1Rels || !gene2Rels)
        return upstreams;

    for(var i = 0; i < gene1Rels.length; i++) {
        if(gene1Rels[i].rel === "controls-state-change-of"){
            for (var j = 0; j < gene2Rels.length; j++) {
                if(gene2Rels[j].rel === "controls-state-change-of" && gene1Rels[i].id2 === gene2Rels[j].id2){
                    upstreams.push(gene1Rels[i].id2);
                }
            }
        }
    }

    return upstreams;
}

/***
 * @param words: sentence organized as a words array
 * @callback returns the gene name in a sentence
 */

CausalityAgent.prototype.findRelevantGeneFromSentence = function(words, callback){
    var self = this;


    words.forEach(function(word){
        self.pnnlDb.getEntry("id1", word, function(res){
            if(res.length > 0){
                if(callback) callback(word); //word is a gene
            }

        });

    });


}
/***
 *
 * @param gene1
 * @param gene2
 * @returns {boolean}
 */
CausalityAgent.prototype.hasCausalRelationship = function(gene1, gene2){

    var self = this;
    var res = false;

    if(self.causality[gene1]) {
        self.causality[gene1].forEach(function (gene) {
            if (gene.id2 === gene2)
                res = true;
        });
    }
    return res;
}


/***
 *
 * @param gene1
 * @param gene2
 * @returns {boolean}
 */
CausalityAgent.prototype.hasCorrelationalRelationship = function(gene1, gene2, callback){

    var self = this;
    var res = false;

    self.pnnlDb.getEntry("id1", gene1, function(corrArr) {
        for (var i = 0; i < corrArr.length; i++) {
            if (corrArr[i].id2 === gene2)
                callback("true");
        }
    });

}


/***
 * Temporary method to find genes that don't have causal relationship but have a common upstream and high correlation
 */
CausalityAgent.prototype.findDemoGenes = function(){
    var self = this;
    var commonGenes = [];

    self.geneNameArr.forEach(function(gene1) {

        self.geneNameArr.forEach(function(gene2) {
            if (gene2 !== gene1 && !self.hasCausalRelationship(gene1, gene2)) {
                self.hasCorrelationalRelationship(gene1, gene2, function (val) {
                    var upstreams = self.findCommonUpstreams(gene1, gene2);
                    if (upstreams && upstreams.length > 0) {
                        commonGenes.push(gene1 + "\t" + gene2 + "\n");
                    }
                });
            }
        });
    });


    setTimeout(function(){
        saveFile(commonGenes, "./CausalPath/noncausal.txt", "txt");
    },240000);

}