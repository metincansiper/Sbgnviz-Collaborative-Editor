
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

    this.geneNames = {}; //all the relevant gene names for OV


    var indCausal = -1;
    var indCorr = -1;

    var geneContext;


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

    this.readAllSifRelations(sifFilePath);
    this.readCausality(causalityFilePath);

    this.readMutSig(mutSigFilePath);



    //Read pnnl data from database
    //Read pnnl data from the server

    var dbName = "pnnl";
    self.pnnlDb = createPNNLDatabase(dbName);



   self.pnnlDb.init(dbName);

 //   window.indexedDB.deleteDatabase(dbName, 3);


   //
   //
   //  self.sendMessage({text:"Please wait while I'm getting the PNNL data from the server."}, "*");
   //
   //  self.sendRequest('agentPNNLRequest', null, function(pnnlArr) {
   //
   //      self.pnnlDb.init(dbName, pnnlArr);
   // });



    setTimeout(function(){
        self.findDemoGenes();

    }, 2000);


    self.sendMessage({text:"Let’s build a pathway model for ovarian cancer using the phosphoproteomics dataset from PNNL."}, "*");

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

/**
 * Read causal relationships and their PC links and store them in this.causality
 * * @param causalityFilePath: path to causative.sif
 */
CausalityAgent.prototype.readCausality = function(causalityFilePath){
    var self = this;


    readTextFile(causalityFilePath, function (fileContent) {
        var causalRels = fileContent.split("\n").slice(1); //start from the second line

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
                self.causality[id2].push({rel: vals[1], id2: id1, uriStr: uriStr});
            else
                self.causality[id2] = [{rel: vals[1], id2: id1, uriStr: uriStr}];


            //all the gene names we are working on
            self.geneNames[id1]= true;
            self.geneNames[id2]= true;
        });

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

            var sentence = (data.comment.text.toUpperCase()).replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g, "");
            var words = sentence.split(' ');

            if(sentence.indexOf("YES")>=0) {
                var agentMsg  = "OK, I am updating my model."
                self.sendMessage({text: agentMsg}, "*", function () {
                    self.updateAgentModel(data.comment.text, function(){
                        if (callback) callback();
                    });

                });


            }
            else {


                self.findRelevantGeneFromSentence(words, function (gene) {
                    geneContext = gene;
                    console.log(gene);
                    self.tellMutSig(gene, callback);

                    self.tellCorrelation(gene, callback);


                });

                if (sentence.indexOf("RELATION") >= 0) {
                    if (indCausal > -1)
                        self.tellCausality(geneContext, callback);

                    setTimeout(function () {
                        self.tellNonCausality(geneContext, callback);
                    }, 2000);
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

            self.sendRequest("agentMergeGraphRequest", {graph: jsonData, type:"json"}, function(){
                if (callback) callback();
            });

        });
    });
}

CausalityAgent.prototype.tellMutSig = function(gene, callback) {
    var self = this;

    var pVal = self.geneSig[gene];
    if(pVal < 0.01)
        agentMsg = gene + " is highly significantly mutated in ovarian cancer with a p value of "+ pVal + ". ";
    else if (pVal < 0.05)
        agentMsg = gene + " is significantly mutated in ovarian cancer with a p value of "+ pVal + ". ";
    else
        agentMsg = gene + " is not significantly mutated in ovarian cancer.";

    self.sendMessage({text: agentMsg}, "*", function () {
        if (callback) callback();
    });


}
CausalityAgent.prototype.tellNonCausality = function(gene, callback) {
    var self = this;
    //Find non-causal but correlational genes
    var geneNonCausal;
    var corrVal;
    self.pnnlDb.getEntry("id1", gene, function(geneCorrArr) {
        for (var j = 0; j < geneCorrArr.length; j++) {
            var geneCorr = geneCorrArr[j].id2;
            if (self.causality[gene].indexOf(geneCorr) < 0) {
                geneNonCausal = geneCorr;
                corrVal = geneCorrArr[j].correlation;
            }


        }

        if (geneNonCausal) {
            var agentMsg = "I am looking at the explainable correlations about " + gene + ", but ";
            agentMsg += "I can't find any causal relationships between " + gene + " and " + geneNonCausal + " although they have a correlation of " + parseFloat(corrVal).toFixed(3) + ". ";

            var commonUpstreams = self.findCommonUpstreams(gene, geneNonCausal);

            agentMsg += makeUpstreamStr(commonUpstreams);

            self.sendMessage({text: agentMsg}, "*", function () {
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


    var agentMsg = gene + " " + self.causality[gene][indCausal].rel + " " + self.causality[gene][indCausal].id2 + ". Here's it's graph. ";


    self.sendMessage({text: agentMsg}, "*", function () {
        if (callback) callback();
    });

    self.showCausality(gene, indCausal, callback);



}



/***
 * Respond to queries from other actors to find explainable relationships around gene
 * @param gene: gene name
 * @param callback
 */
CausalityAgent.prototype.tellCorrelation = function(gene, callback){

    var self = this;
    indCausal = -1;
    indCorr = -1;
    var maxCorr = -1000;

    //get pnnl genes
    self.pnnlDb.getEntry("id1", gene, function(geneCorrArr) {


        if (self.causality[gene]) { //gene has causal relationships
            for (var j = 0; j < geneCorrArr.length; j++) {
                var geneCorr = geneCorrArr[j].id2;

                for (var i = 0; i < self.causality[gene].length; i++) {
                    var geneCausal = self.causality[gene][i].id2;
                    if (geneCausal === geneCorr && geneCorrArr[j].correlation > maxCorr) {
                        indCausal = i;
                        indCorr = j;
                        maxCorr = geneCorrArr[j].correlation;
                    }
                }
            }
        }

        if (indCausal > -1) {
            agentMsg = "The largest explainable correlation about  " + gene + " is the correlation with " + geneCorrArr[indCorr].id2 + " with a value of " + parseFloat(maxCorr).toFixed(3) + ". ";






        }
        else { //no causal explanation around gene

            agentMsg = "I can't find any causal relationships about " + gene + ". ";

            console.log(gene + " " + geneCorrArr[0]);
            var corr = geneCorrArr[0].correlation; //self.pnnl[gene] is sorted so take the first element
            if (corr)
                agentMsg += "But it has the highest correlation with " + geneCorrArr[0].id2 + " in PNNL data. ";

            //Search common upstreams of gene and its correlated
            var commonUpstreams = self.findCommonUpstreams(gene, geneCorrArr[0].id2);
            agentMsg += makeUpstreamStr(commonUpstreams);


        }
        self.sendMessage({text: agentMsg}, "*", function () {
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
 * Temporary method to find genes that don't have causal relationship but have a common upstream and high correlation
 */
CausalityAgent.prototype.findDemoGenes = function(){
    var self = this;
    var commonGenes = [];


    //self.pnnlDb.getColumn('id1',  function(res){

    for(var gene in self.geneNames){
        hasC
        var gene2 = self.causality[gene].id2;
            if(!self.causality[gene]) {
                self.pnnlDb.getEntry("id1", gene, function(geneEntry){
                    var upstreams = self.findCommonUpstreams(gene, self.pnnl[gene][0].id2);
                    if (upstreams && upstreams.length > 0) {
                        commonGenes.push(gene + "\t" + self.pnnl[gene][0].id2 + "\n");
                    }
                });


            }



        saveFile(commonGenes, "./CausalPath/noncausal.txt", "txt");
    }


}