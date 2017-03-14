/* global expect */
const debug = require('debug')('dply:test:unit:test_env_path')
const path = require('path')
const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
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

    it('should throw on new TestEnvPath with not path', function(){
      let fn = ()=> new TestEnvPath(test_env)
      expect( fn ).to.throw()
    })

    it('should throw on new TestEnvPath with no args', function(){
      let fn = ()=> new TestEnvPath()
      expect( fn ).to.throw()
    })


    describe('Class', function(){

      let tep

      before(function(){
        tep = new TestEnvPath(test_env,'some')
      })

      it('should create a new TestEnvPath', function(){
        expect(tep.dir).to.equal('some')
      })

      it('should create a new TestEnvPath', function(){
        expect(tep.dirname).to.contain( __dirname + '/output/'  )
      })

    })

    describe('Output', function(){

      let test_env, out

      before('Copy `files` from fixtures', function(){
        test_env = TestEnv.setupTestDir(__dirname)
        out = test_env.output('newdir')
        return out.copyFrom('files', 'subdir')
      })

      after('Cleanup', function(){
        return out.clean()
      })

      it('should now have fixtures in the output directory', function(){
        let dir = out.path('subdir')
        expect( dir ).to.contain( __dirname )
        expect( dir ).to.be.a.directory().with.contents(['firstfile'])
      })

      it('should write a file to output', function(){
        let file = out.path('subdir', 'testfile')
        return fse.writeFileAsync(file, 'data\n').then( ()=> {
          expect( path.join(__dirname,'output','newdir','subdir','testfile') ).to.be.a.file()
        })
      })

      it('should copyFrom a generic dir to TestEnvPath', function(){
        let dir = path.join(__dirname, 'output', 'tepout')
        let tepout = test_env.output('tepout')
        return out.copyFrom('files', tepout).then( ()=> {
          expect( dir ).to.contain( __dirname )
          expect( dir ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

      it('should copyFrom a TestEnvPath to a TestEnvPath', function(){
        let dir = path.join(__dirname, 'output', 'tepout2')
        let tepout = test_env.output('tepout2')
        let tepfix = test_env.fixture('files')
        return out.copyFrom(tepfix, tepout).then( ()=> {
          expect( dir ).to.contain( __dirname )
          expect( dir ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

    })

    describe('Fixture', function(){

      let test_env, fixture

      before('Copy `files` from fixtures', function(){
        test_env = TestEnv.setupTestDir(__dirname)
        fixture = test_env.fixture('files')
        return fixture.copyTo(undefined, 'output_subdir')
      })

      after('Cleanup', function(){
        return test_env.cleanAllOutputAsync()
      })

      it('should now have fixtures in the output_subdir directory', function(){
        let dir = path.join(__dirname, 'output', 'output_subdir')
        expect( dir ).to.contain( __dirname )
        expect( dir ).to.be.a.directory().with.contents(['firstfile'])
      })

      it('should copyTo a generic dir', function(){
        let dir = path.join(__dirname, 'output', 'output_subdir')
        return fixture.copyTo(null, 'output_subdir').then( res => {
          expect( res ).to.equal( dir )
          expect( res ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

      it('should copyTo a TestEnvPath dir', function(){
        let dir = path.join(__dirname, 'output', 'tepout3')
        let tepout = test_env.output('tepout3')
        return fixture.copyTo(null, tepout).then( ()=> {
          expect( dir ).to.contain( __dirname )
          expect( dir ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

      it('should copyToTmp a fixture to tmp dir', function(){
        return fixture.copyToTmp(fixture, 'one').then( res => {
          expect( res ).to.contain( __dirname )
          expect( res ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

      it('should copyToTmp this fixture to tmp dir', function(){
        return fixture.copyToTmp(null, 'one').then( res => {
          expect( res ).to.contain( __dirname )
          expect( res ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

      it('should copyTo from a different TestEnvPath', function(){
        let dir = path.join(__dirname, 'output', 'tepout4')
        let tepfix = test_env.fixture('files')
        return fixture.copyTo(tepfix, 'tepout4').then( ()=> {
          expect( dir ).to.contain( __dirname )
          expect( dir ).to.be.a.directory().with.contents(['firstfile'])
        })
      })

      it('shouldn\'t clean a fixture dir', function(){
        expect( ()=>fixture.clean() ).to.throw(/Can't clean a non writeable path/)
      })

    })

  })

})
