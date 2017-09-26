
function addNodeTest(id, className, posX, posY) {
  // context('Add Node Tests', function(){
  //   beforeAll(function(){
  //     cy.window().should(function(window){
  //       cy.visit(window.location.href);
  //     });
  //   });
  //
  //   it('chise.addNode()', function () {
  //     cy.window().should(function(window){
  //       var chise = window.chise;
  //       chise.addNode(posX, posY, className, id);
  //
  //       performAssertions(window);
  //
  //       // cy.visit(window.location.href);
  //     });
  //   });
  //
  //   it('chise.addNode() modal', function () {
  //     // Test just opened modal here
  //     cy.window().should(function(window){
  //       performAssertions(window);
  //     });
  //   });
  // });
    var performAssertions = function(window) {
      var node = window.cy.getElementById(id);
      // expect(node, "A node with id: " + id + " is added.").to.be.ok;
      expect(node.length, "A node with id: " + id + " is added.").to.equal(1);
      expect(node.position('x'), 'x position of the node is as expected').to.equal(posX);
      expect(node.position('y'), 'y position of the node is as expected').to.equal(posY);
      expect(node.data('class'), 'the node has the expected sbgn class').to.equal(className);
    };

    it('chise.addNode()', function () {
      cy.window().should(function(window){
        var chise = window.chise;
        chise.addNode(posX, posY, className, id);

        performAssertions(window);

        // cy.visit(window.location.href);
        //
        // cy.window().should(function(window){
        //   performAssertions(window);
        // });
      });
    });

    // it('chise.addNode() - modal', function () {
    //   cy.window().should(function(window){
    //     cy.visit(window.location.href).then(function(contentWindow){
    //       cy.log(contentWindow.location.href);
    //       cy.wait(10000);
    //       performAssertions(contentWindow);
    //     });
    //   });
    // });

    // it('refresh page', function() {
    //   cy.window().should(function(window){
    //     cy.visit(window.location.href);
    //     // expect(window.cy.nodes().length).to.not.equal(0);
    //   });
    // });
    //
    // it('chise.addNode() modal', function () {
    //   // Test just opened modal here
    //   cy.window().should(function(window){
    //     performAssertions(window);
    //   });
    // });
}

describe('CWC Test', function(){
  it('Access global window object', function(){
    // https://on.cypress.io/visit
    cy.visit('http://localhost:3000')
    // cy.visit('/')

    cy.window().should(function(window){
      window.myVar = 'myVar';
    })

    cy.window().should(function(window){
      expect(window.myVar).to.be.ok
      expect(window.chise).to.be.ok
      expect(window.location.hostname).to.eq('localhost')
    })
  })

  addNodeTest('pdNode0', 'macromolecule', 100, 100);
  addNodeTest('pdNode1', 'process', 100, 200);
  addNodeTest('pdNode2', 'macromolecule', 200, 200);

  // addEdgeTest('pdEdge', 'pdNode1', 'pdNode2', 'necessary stimulation');
})
