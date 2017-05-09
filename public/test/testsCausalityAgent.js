QUnit = require('qunitjs');


module.exports = function(serverIp, modelManager){


    QUnit.module( "Agent API Tests" );

    var agent;
    var agentId = '103abc';
    var agentName = "testAgent";



    function testNewAgent() {
        QUnit.test('new Agent', function (assert) {
            var Agent = require("../../agent-interaction/CausalityAgent");
            agent = new Agent(agentName, agentId);
            assert.ok(agent, "Agent created.");
        });
    }



    function testLoadModel() {
        QUnit.test('Connect to server and load model', function (assert) {
            assert.expect(3);

            var done1 = assert.async();
            var done2 = assert.async();
            var done3 = assert.async();

            agent.connectToServer("http://localhost:3000/", function (socket) {

                assert.ok(socket, "Socket connection achieved");
                done1();



                agent.loadModel(function () {
                    assert.ok(agent.pageDoc, "Agent acquired pageDoc");
                    done2();

                    agent.loadOperationHistory(function () {

                        assert.ok(agent.opHistory, "Agent acquired opHistory");
                        done3();
                    });
                });

            });
        });
    }




    setTimeout(function() {
        testNewAgent();
    }, 100);




    setTimeout(function() {
        testLoadModel();
    }, 100);



    setTimeout(function() {
        testMessages();
    }, 100);


};