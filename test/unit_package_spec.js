const pkg = require('../')

describe('Unit::deployable-test', function(){

  describe('Package should load modules', function(){
  
    it('should load TestEnv', function(){
      expect( pkg.TestEnv ).to.be.ok
    })

  })

})
