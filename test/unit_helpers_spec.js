/* global expect */
const { array, arrayOnNil } = require('../lib/ensure_array')
const randomHex = require('../lib/random_hex')


describe('Unit::mhio::test::helpers', function(){

  describe('array', function(){

    it('should import array', function(){
      expect( array ).to.be.ok
    })

    it('should import arrayOnNil', function(){
      expect( arrayOnNil ).to.be.ok
    })

    it('should create array', function(){
      expect( array('1') ).to.eql(['1'])
    })

    it('should return array', function(){
      let arr = [1]
      expect( array(arr) ).to.equal( arr )
    })


    it('should return new array on undef', function(){
      expect( arrayOnNil() ).to.eql([])
    })

    it('should return new array on null', function(){
      expect( arrayOnNil(null) ).to.eql([])
    })

    it('should return new array', function(){
      expect( arrayOnNil('1') ).to.eql(['1'])
    })


    it('should return original array', function(){
      let arr = [1]
      expect( arrayOnNil(arr) ).to.equal( arr )
    })

  })

  describe('randomHex', function(){

    it('should import randomHex', function(){
      expect( randomHex ).to.be.ok
    })

    it('should create a string', function(){
      expect( randomHex(2) ).to.be.a('string')
    })

    it('should have the defined length of 3', function(){
      expect( randomHex(3) ).to.have.length( 3 )
    })

  })

})
