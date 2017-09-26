
describe('CWC Test', function(){
  it('Access global window object', function(){
    // https://on.cypress.io/visit
    cy.visit('http://localhost:3000')

    expect([1, 2]).to.deep.eq([
      1,
      2
    ])

    // cy.window().then(function(win){
    //   expect(win.location).to.contain('')
    //   // expect(win.location).to.be.empty
    // })

    cy.window().should(function(window){
      expect(window.chise).to.be.ok
      expect(window.location.hostname).to.eq('localhost')
    })

    // Here we've made our first assertion using a '.should()' command.
    // An assertion is comprised of a chainer, subject, and optional value.

    // https://on.cypress.io/should
    // https://on.cypress.io/and

    // https://on.cypress.io/title
    // cy.title().should('include', 'Kitchen Sink')
    //   ↲               ↲            ↲
    // subject        chainer      value
  })
})
