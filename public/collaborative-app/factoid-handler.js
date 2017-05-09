/**
 * Created by durupina on 11/14/16.
 */





module.exports =  function(app, modelManager) {

    var idxcardjson = require('./reach-functions/idxcardjson-to-json-converter.js');

    var socket = io();
    var idxCardView = require('./reach-functions/idxCard-info.js');
    var jsonGraphs;
    var nodeMap;
    var text= 'We introduce a new method. MDM2 phosphorylates TP53.  MDM2 deactivates RAF. A Sos-1-E3b1 complex directs Rac activation by entering into a tricomplex with Eps8.';
    var pmcID = "PMC2797771";


    return   {




        initialize: function(){



            $('#factoidBox')[0].value = text;

            var factoidModel = modelManager.getFactoidModel();


            if(factoidModel != null){

                jsonGraphs = factoidModel.jsonGraphs;
                nodeMap = factoidModel.nodeMap;

                this.updateTextBox(jsonGraphs);

            }


            this.listenToEvents();


        },

        updateTextBox: function(jsonGraphs){
            var textFromJsons = "";
            for(var i = 0; i < jsonGraphs.length; i++)
                textFromJsons+= jsonGraphs[i].sentence + '. ';

            text = textFromJsons;
            $('#factoidBox')[0].value = text = textFromJsons;
        },
        loadFactoidModel: function(inputStr){


            //parse each input sentence one by one


            var self = this;
            var jsonGraphs = [];



            var notyView = noty({layout: "bottom",text: "Sending REACH queries"});


            var p = new Promise(function (resolve) {
                socket.emit("REACHQuery", "indexcard", inputStr, function (data) {
                        //      console.log(line);


                        var cards = JSON.parse(data).cards;
                        // console.log(cards);

                        cards.forEach(function(card){
                            var jsonData = idxcardjson.createJson({cards: [card]});

                                jsonGraphs.push({sentence: card.evidence[0], json: jsonData, idxCard:card});


                        });



                     notyView.setText( "Merging graphs...");



                        //TODO: merge will be implemented
                        //nodeMap = modelManager.mergeJsons(jsonGraphs); //mapping between sentences and node labels
                    nodeMap = app.mergeJsons(jsonGraphs); //mapping between sentences and node labels


                     console.log(jsonGraphs);


                        //save it to the model
                        modelManager.updateFactoidModel({jsonGraphs: jsonGraphs, nodeMap: nodeMap, text: text}, "me");



                     notyView.close();





                    });
                });
        },



        highlightSentenceInText: function(nodeId, highlightColor){

            var el  = $('#factoidBox');



            console.log(nodeId);


            if(highlightColor == null){
                el.highlightTextarea('destroy');
                return;
            }



            var sentences = nodeMap.sentences[nodeId];

            var idxCards = nodeMap.idxCards[nodeId];
            console.log(nodeMap);

            // console.log(idxCards);


            cy.$(('#' + nodeId)).qtip({
                content: {
                    text: function (event, api) {

                        var info = (new idxCardView(idxCards)).render();
                        var html = $('#idxCard-container').html();


                        api.set('content.text', html);

                        return html;


                    }
                },
                show: {
                    ready: true
                },
                position: {
                    my: 'top center',
                    at: 'top middle',
                    adjust: {
                        cyViewport: true
                    },
                    effect: false
                },
                style: {
                    classes: 'qtip-bootstrap',
                    tip: {
                        width: 20,
                        height: 20
                    }
                }
            });




            if(sentences) {

                var ranges = [];

                for(var i = 0; i < sentences.length; i++) {
                    var startInd = el[0].value.indexOf(sentences[i]);
                    var endInd = startInd + sentences[i].length;
                    ranges.push([startInd, endInd]);
                }
                console.log(ranges);

                el.highlightTextarea({
                    ranges: [{
                        color: highlightColor,//('#FFFF0'),
                        ranges: ranges
                    }]
                });


            }
        },
        setFactoidModel: function(factoidModel){

            nodeMap = factoidModel.nodeMap;
            jsonGraphs = factoidModel.jsonGraphs;
            text = factoidModel.text;


        },


        loadFactoidPMC: function() {



            var link = "https://www.ncbi.nlm.nih.gov/pmc/articles/" + $('#pmcBox').val() ;
            socket.emit("HTTPRequest", link,  function(result){
                //console.log(result);

                $('#factoidBox')[0].value = result;
            });
            // loadFactoidModel($(, menu);
        },

        loadFactoidFile: function(e){


            var extension = $("#factoid-file-input")[0].files[0].name.split('.').pop().toLowerCase();


            if(extension == "pdf") {

                var reader = new FileReader();
                reader.onload = function (e) {

                    socket.emit('pdfConvertRequest',this.result, function(pages){

                        //Combine pages
                        var txt  = "";
                        pages.forEach(function(page){

                            page.forEach(function(el){

                                txt += el + " ";
                            });
                            // txt += '\n';
                        });



                        //TODO txtData needs some kind of cleaning
                        $('#factoidBox')[0].value = txt;

                    });



                };
                reader.readAsArrayBuffer($("#factoid-file-input")[0].files[0]);



            }
            else{
                var reader = new FileReader();
                reader.onload = function (e) {

                    $('#factoidBox')[0].value =  this.result; //change text

                };
                reader.readAsText($("#factoid-file-input")[0].files[0]);



            }

        },


        listenToEvents: function(){
            var self = this;

            $('#factoid-text-submit-button').click(function () {
                self.loadFactoidModel($('#factoidBox').val());

            });

            $('#factoid-text-clear-button').click(function () {
                self.text = '';
                $('#factoidBox')[0].value = '';

            });


            $('#factoid-file-input').change(function (e) {
                self.loadFactoidFile(e);

            });

            $('#pmc-id-submit-button').click(function (e) {
                self.loadFactoidPMC();

            });

        }


    };
}



// if( typeof module !== 'undefined' && module.exports){ // expose as a nodejs module
//     module.exports = new FactoidInput();