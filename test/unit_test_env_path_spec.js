/* global expect */
const debug = require('debug')('dply:test:unit:test_env_path')
const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const path = require('path')

const { TestEnv, TestEnvPath } = require('../')

// This is the stuff that `TestEnv` does for you!
let test_path = path.join(__dirname, 'output')
let test_fixture_path = path.join(__dirname, 'fixture')
let output_path = path.join(test_path, require('crypto').randomBytes(2).toString('hex') )
let output_fixture_path = path.join(output_path, 'fixture')
let output_output_path = path.join(output_path, 'output')


describe('Unit::deployable::test::TestEnvPath', function(){

  describe('Class', function(){

    let test_env

    before(function(){
      test_env = new TestEnv( output_path )
    })

    it('should create a new TestEnvPath', function(){
      expect( new TestEnvPath(test_env,'some') ).to.be.ok
    })

  })

})
