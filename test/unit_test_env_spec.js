const { TestEnv } = require('../')
const path = require('path')

describe('Unit::deployable-test::TestEnv', function(){

  describe('Class', function(){
   
    it('should get the right fixture path when provided', function(){
      TestEnv.init(__dirname)
      let testpath = path.join(__dirname, 'fixture', 'somesubdir')
      expect( TestEnv.fixturePath('somesubdir') ).to.equal( testpath )
    })

    it('should guess at a path when not (taking node_modules/deployable-test into consideration)', function(){
      TestEnv.init()
      let parentpath = path.resolve(__dirname, '..', '..')
      expect( TestEnv.fixturePath('somesubdir') ).to.equal( path.join(parentpath, 'test', 'fixture', 'somesubdir') )
    })

  })

})
