/* global expect */
const debug = require('debug')('mhio:test:unit:TestEnv')
const Promise = require('bluebird')
const path = require('path')
//const mockfs = require('mock-fs')
const fse = require('fs-extra')
const fs = require('fs')

//const mockfsLoad = require('./fixture/mockfsLoad')
const { TestEnv } = require('../')

let test_output_path    = path.join(__dirname, 'output')
let test_fixture_path   = path.join(__dirname, 'fixture')

let output_path         = path.join(test_output_path, require('crypto').randomBytes(2).toString('hex') )
let output_test_path    = path.join(output_path, 'test')
let output_fixture_path = path.join(output_test_path, 'fixture')
let output_output_path  = path.join(output_test_path, 'output')



describe('Unit::mhio-test::TestEnv', function(){

  //let mockfs_config = null

  // before('mockfs', function(){
  //   return mockfsLoad(test_fixture_path).then(config => {
  //     debug('mockfsconfig', JSON.stringify(config['/Users']['matt']['clones']))
  //     mockfs_config = config
  //     //expect(config).to.eql({})
  //     mockfs(mockfs_config, { createCwd: false })
  //     let tpath = test_fixture_path + '/copy'
  //     expect( fs.existsSync(tpath), tpath ).to.be.true
  //     expect( require('fs').existsSync(tpath), tpath ).to.be.true
  //     expect( fse.pathExistsSync(tpath), tpath ).to.be.true
  //     expect( tpath ).to.be.a.directory()
  //     expect( test_fixture_path+'/copy/test1' ).to.be.a.file()
  //     mockfs.restore()
  //   })
  // })

  describe('Static', function(){

    beforeEach(function(){
      TestEnv.init( output_path )
    })

    it('should expose path.join as join', function(){
      expect( TestEnv.join('test','a') ).to.equal( `test${path.sep}a` )
    })

    it('should expose path.resolve as resolve', function(){
      expect( TestEnv.resolve(test_output_path,'a') ).to.equal( `${test_output_path}${path.sep}a` )
    })

    it('should trimDirNameFromPath', function(){
      expect( TestEnv.trimDirNameFromPath('/one/two', 'two') ).to.equal('/one')
    })

    it('should not trimDirNameFromPath', function(){
      expect( TestEnv.trimDirNameFromPath('/one/three', 'two') ).to.equal('/one/three')
    })

    it('should trimUpToDirNameFromPath', function(){
      expect( TestEnv.trimUpToDirNameFromPath('/one/two', 'two') ).to.equal('/one')
    })

    it('should trimUpToDirNameFromPath', function(){
      expect( TestEnv.trimUpToDirNameFromPath('/one/two/three', 'two') ).to.equal('/one')
    })

    it('should trimUpToTwoDirNamesFromPath with no subdirs', function(){
      expect( TestEnv.trimUpToTwoDirNamesFromPath('/one/two', 'two') ).to.equal('/one')
    })

    it('should trimUpToTwoDirNamesFromPath with 1 subdir', function(){
      expect( TestEnv.trimUpToTwoDirNamesFromPath('/one/two/three', 'two') ).to.equal('/one')
    })

    it('should not trimUpToTwoDirNamesFromPath with 2 subdirecties', function(){
      expect( TestEnv.trimUpToTwoDirNamesFromPath('/one/two/three/four', 'two') ).to.equal('/one/two/three/four')
    })



    xdescribe('fs', function(){

      // before(function(){
      //   mockfs(mockfs_config, { createCwd: false })
      // })

      // after(function(){
      //   mockfs.restore()
      // })

      describe('copies', function(){

        it('should copy fixture files to a tmp output dir', function(){
          return TestEnv.copyAsync(test_fixture_path, output_fixture_path)
          .then(res => {
            // use res as the tmp path is random
            expect( output_fixture_path ).to.be.a.directory()
            expect( path.join(output_fixture_path,'copy' )).to.be.a.directory()
            expect( path.join(output_fixture_path,'copy','test1' )).to.be.a.file()
          })
        })

      })

    })
  })


  describe('Class', function(){

    let test_env = null

    beforeEach(function(){
      test_env = TestEnv.setup({ base_path: output_path })
    })

    it('should expose path.join as join', function(){
      expect( test_env.join('test','a') ).to.equal( `test${path.sep}a` )
    })

    it('should expose path.resolve as resolve', function(){
      expect( test_env.resolve(test_output_path,'a') )
        .to.equal( `${test_output_path}${path.sep}a` )
    })

    it('should guess at a path when not given (taking node_modules/@mhio/test/lib into consideration)', function(){
      test_env = TestEnv.setup()
      let parentpath = path.resolve(__dirname, '..', '..', '..', '..')
      let testpath = path.join(parentpath, 'test', 'fixture', 'somesubdir')
      expect( test_env.fixturePath('somesubdir') ).to.equal( testpath )
    })

    it('should return the base path as without `test/`', function(){
      let testpath = path.resolve(output_path, 'bp')
      expect( test_env.basePath('bp') ).to.equal( testpath )
    })

    it('should return the test path as `test/`', function(){
      let testpath = path.resolve(output_test_path, 'bp')
      expect( test_env.testPath('bp') ).to.equal( testpath )
    })

    it('should generate a fixture path in `test/fixture`', function(){
      let testpath = path.join(output_test_path, 'fixture', 'fp')
      expect( test_env.fixturePath('fp') ).to.equal( testpath )
    })

    it('should generate an output path in `test/output`', function(){
      let testpath = path.resolve(output_test_path, 'output', 'op')
      expect( test_env.outputPath('op') ).to.equal( testpath )
    })

    it('should generate a random tmp path `test/output/tmp-xxxxx`', function(){
      let testpath = path.resolve(output_test_path, 'output', 'tmp-')
      let restpath_re = new RegExp(testpath)
      expect( test_env.outputTmpPath() ).to.match( restpath_re )
      expect( test_env.outputTmpPath() ).to.match( /[0-9a-f]{5}$/ )
    })

    it('should generate a fixed tmp path `test/output/tmp-ab`', function(){
      let testpath = path.resolve(output_test_path, 'output', 'tmp-ab')
      expect( test_env.outputTmpPath('ab') ).to.equal( testpath )
    })

    it('should return the same path if not a test path', function(){
      expect( test_env.removeTmpPrefixFromPath('ab') ).to.equal('ab')
    })

    it('should return a tmp path without the tmp-', function(){
      let tmppath = test_env.outputTmpPath()
      expect( test_env.removeTmpPrefixFromPath(tmppath) ).to.match(/^[0-9a-f]{5}$/)
    })

    it('should discard the last dir if it matches test_dir', function(){
      test_env = TestEnv.setupTestDir( output_path + path.sep + 'test' )
      expect( test_env.base_path ).to.equal( output_path )
    })

    it('should discard the last dir if it matches test_dir', function(){
      test_env = TestEnv.setupTestDir( output_path + path.sep + 'atest' )
      expect( test_env.base_path ).to.equal( output_path + path.sep + 'atest' )
    })

    it('should join a base_path array for you', function(){
      let arr_path = output_path.split(path.sep)
      arr_path[0] = '/'
      let te = TestEnv.setup({ base_path: arr_path })
      expect( te.base_path ).to.equal( output_path )
    })


    describe('test env path objects', function(){

      let tep

      it('should create a fixture path', function(){
        tep =  test_env.fixture()
        expect( tep ).to.be.ok
        expect( tep.base_path ).to.equal(output_fixture_path)
      })

      it('should create a fixture path', function(){
        tep = test_env.fixture('subdir')
        expect( tep ).to.be.ok
        expect( tep.base_path ).to.equal(output_fixture_path + '/subdir')
      })

      it('should create an output path', function(){
        tep = test_env.output()
        expect( tep ).to.be.ok
        expect( tep.base_path ).to.equal(output_output_path)
      })

      it('should create an output path', function(){
        tep = test_env.output('subdir')
        expect( tep ).to.be.ok
        expect( tep.base_path ).to.equal(output_output_path + '/subdir')
      })

      it('should create a output tmp path', function(){
        tep = test_env.outputTmp()
        expect( tep ).to.be.ok
        expect( tep.base_path ).to.contain(output_output_path + '/tmp-')
      })

      it('should create a output tmp path', function(){
        tep = test_env.outputTmp('subdir')
        expect( tep ).to.be.ok
        expect( tep.base_path ).to.contain(output_output_path + '/tmp-')
      })

    })


    describe('fs DEBUG_CLEAN', function(){

      let orig = process.env.DEBUG_CLEAN

      // before(function(){
      //   mockfs(mockfs_config, { createCwd: false })
      // })

      // after(function(){
      //   mockfs.restore()
      // })

      before('override DEBUG_CLEAN', function(){
        process.env.DEBUG_CLEAN = 'true'
      })

      after('reset DEBUG_CLEAN', function(){
        ( orig === undefined )
          ? delete process.env.DEBUG_CLEAN
          : process.env.DEBUG_CLEAN = orig
      })

      it('should clean an output directory `output/test2` via .cleanOutputAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'test2')
        expect(testpath).to.not.be.a.path('before')
        return test_env.cleanOutputAsync('test2').then(file => {
          expect(file).to.equal(testpath)
          expect(testpath).to.not.be.a.path('after')
        })
      })

      it('should remove an output directory `output/test3` via .removeOutputAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'test3')
        expect(testpath).to.not.be.a.path('before')
        return test_env.removeOutputAsync('test3').then(file => {
          expect(file).to.equal(testpath)
          expect(testpath).to.not.be.a.path('after')
        })
      })

      it('should fail to clean something outside our path', function(){
        let p = test_env.cleanAsync('/tmp/non-existant-thing/134a24z94r24U1')
        return expect( p ).to.be.rejectedWith(/clean outside of project without force/)
        //return p.catch(err => expect( err.message ).to.be.match(/clean outside of project without force/))
      })

      xit('should fail to clean no path', function(){
        let p = test_env.cleanAsync()
        return expect( p ).to.be.rejectedWith(/No dir to clean/)
      })

      it('should fail to clean a path that\'s not a string via .cleanAsync', function(){
        let p = test_env.cleanAsync([])
        return expect( p ).to.be.rejectedWith(/directory must be a string/)
      })

      it('should fail to clean output without an arg to cleanOutputAsync', function(){
        let p = test_env.cleanOutputAsync()
        return expect( p ).to.be.rejectedWith(/No subdir to clean/)
      })

      it('should clean the whole output dir with cleanAllOutputAsync', function(){
        let p = test_env.cleanAllOutputAsync()
        return expect( p ).to.be.become( path.join(output_test_path, 'output') )
        //return p.then(res => expect( res ).to.equal( path.join(output_test_path, 'output') ))
      })

    })


    describe('fs', function(){

      // before(function(){
      //   mockfs(mockfs_config, { createCwd: false })
      // })

      // after(function(){
      //   mockfs.restore()
      // })

      after(function(){
        // clean up output `output_path`
        if ( process.env.DEBUG_CLEAN ) return output_path
        //if ( output_test_path.match(__dirname) ) return fse.removeAsync( output_test_path )
      })

      it('should make an output directory `output/test1` with mkdirOutputAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'test1')
        return test_env.mkdirOutputAsync('test1').then(()=> {
          expect(testpath).to.be.a.directory().and.empty
        })
      })

      it('should clean an output directory `output/test2` with cleanOutputAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'test2')
        expect(testpath).to.not.be.a.path('before')
        return test_env.mkdirOutputAsync('test2')
          .then(()=>{
            expect(testpath).to.be.a.directory()
            return test_env.mkdirOutputAsync('test2/contents')
          })
          .then(()=> test_env.cleanOutputAsync('test2') )
          .then(()=> expect(testpath).to.be.a.directory('after').and.empty )
      })

      it('should remove an output directory `output/test3` with removeOutputAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'test3')
        expect(testpath).to.not.be.a.path('before')
        return test_env.mkdirOutputAsync('test3')
          .then(()=>{
            expect(testpath).to.be.a.directory()
            return test_env.removeOutputAsync('test3')
          })
          .then(()=> expect(testpath).to.not.be.a.path('after') )
      })


      it('should make a tmp output directory with mkdirOutputTmpAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'tmp-cd')
        expect(testpath).to.not.be.a.path()
        return test_env.mkdirOutputTmpAsync('cd').then(()=>{
            expect(testpath).to.be.a.directory()
          })
      })

      it('should clean a tmp output directory with cleanOutputTmpAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'tmp-ef')
        expect(testpath).to.not.be.a.path('before')
        return test_env.mkdirOutputTmpAsync('ef').then(temp_file => {
          debug('temp_file',temp_file)
          expect(testpath).to.be.a.directory()
          return test_env.cleanOutputTmpAsync('ef')
        }).then(()=> {
          expect(testpath).to.be.a.directory('after').and.empty
        })
      })

      it('should remove a tmp output directory with cleanOutputTmpAsync', function(){
        let testpath = path.resolve(output_test_path, 'output', 'tmp-eg')
        expect(testpath).to.not.be.a.path('before')
        return test_env.mkdirOutputTmpAsync('eg').then(temp_file => {
          debug('temp_file',temp_file)
          expect(testpath).to.be.a.directory()
          return test_env.removeOutputTmpAsync('eg')
        }).then(()=> {
          expect(testpath).to.not.be.a.path('after')
        })
      })

      it('should remove all tmp output directories with cleanAllOutputTmpAsync', function(){
        let testpath_whatever = path.resolve(output_test_path, 'output', 'whatever')
        let testtmppath = path.resolve(output_test_path, 'output', 'tmp-gh')
        return Promise.all([
          test_env.mkdirOutputAsync('whatever'),
          test_env.mkdirOutputTmpAsync(),
          test_env.mkdirOutputTmpAsync('gh')
        ])
        .then(res => {
          expect( testpath_whatever ).to.be.a.directory()
          expect( res[1].path() ).to.be.a.directory()
          expect( testtmppath ).to.be.a.directory()
          return test_env.removeAllOutputTmpAsync()
        })
        .then(()=> {
          expect(testpath_whatever).to.be.a.directory('whatever stays')
          expect(testtmppath).to.not.be.a.path('cleaned')
        })
      })


      describe('copies', function(){

        before('copies before copy', function(){
          debug('copies before copy', test_fixture_path, output_fixture_path)
          return fse.copy(test_fixture_path, output_fixture_path)
            .then(()=>{
              debug('copies before copy in copy', test_fixture_path, output_fixture_path)
              expect(output_fixture_path).to.be.a.directory()
              expect(output_fixture_path+'/copy').to.be.a.directory()
              debug('output_fixture_path',output_fixture_path)
            })
            .catch(err => { console.error(err); throw err })
        })

        it('should copy fixture files to a tmp output dir', function(){
          expect(output_fixture_path+'/copy').to.be.a.directory()
          expect(output_fixture_path+'/copy/test1').to.be.a.file()
          debug(output_fixture_path+'/copy')
          return test_env.copyFixtureToTmpOutputAsync('copy').then(res => {
            // use res as the tmp path is random
            expect( res ).to.be.a.directory()
            expect( path.join(res,'test1' )).to.be.a.file()
          })
        })

        it('should copy fixture files to an output dir', function(){
        let copied_file = path.join(output_output_path, 'copyoutsuf', 'test1')
          return test_env.copyFixtureToOutputAsync('copy', 'copyoutsuf').then(() => {
            expect(copied_file).to.be.a.file()
          })
        })

      })

      describe('removeAsync', function(){

        let remove_env = null
        let output_remove_path = path.join(output_path, 'remove')

        // before(function(){
        //   mockfs(mockfs_config, { createCwd: false })
        // })

        // after(function(){
        //   mockfs.restore()
        // })

        before('copy before remove', function(){
          debug('copy before remove', test_fixture_path, output_remove_path)
          return fse.copy(test_fixture_path, output_remove_path).then(()=>{
            expect(output_remove_path).to.be.a.path()
            remove_env = TestEnv.setup(output_remove_path)
          })
        })

        it('should fail to remove null', function(){
          return remove_env.removeAsync().catch(err => {
            expect(output_remove_path).to.be.a.path()
            expect(err.message).to.match(/No dir to remove/)
          })
        })

        it('should fail to remove a number', function(){
          return remove_env.removeAsync(1).catch(err => {
            expect(output_remove_path).to.be.a.path()
            expect(err.message).to.match(/directory must be a string/)
          })
        })

        it('should fail to remove a number', function(){
          return remove_env.removeAsync('/some/other/path/that/should/never/exists/so/we/add/some/more/dirs/just/in/case/yep/asdfqwer-asdf').catch(err => {
            expect(output_remove_path).to.be.a.path()
            expect(err.message).to.match(/outside of project without force option/)
          })
        })

        it('should remove a file', function(){
          return remove_env.removeAsync(output_remove_path).then(()=> {
            expect(output_remove_path).to.not.be.a.path()
          })
        })

      })

      describe('clean', function(){

        let remove_env = null
        let output_clean_path = path.join(output_path, 'clean-fO3e')

        // before(function(){
        //   mockfs(mockfs_config, { createCwd: false })
        // })

        // after(function(){
        //   mockfs.restore()
        // })

        before('copy before clean', function(){
          debug('copy before clean', test_fixture_path, output_clean_path)
          return fse.copy(test_fixture_path, output_clean_path).then(()=>{
            expect(output_clean_path).to.be.a.path()
            remove_env = TestEnv.setup(output_clean_path)
          })
        })

        it('should fail to remove null', function(){
          return remove_env.removeAsync().catch(err => {
            expect(output_clean_path).to.be.a.path()
            expect(err.message).to.match(/No dir to remove/)
          })
        })

        it('should fail to remove a number', function(){
          return remove_env.removeAsync(1).catch(err => {
            expect(output_clean_path).to.be.a.path()
            expect(err.message).to.match(/directory must be a string/)
          })
        })

        it('should fail to remove a number', function(){
          return remove_env.removeAsync('/some/other/path/that/should/never/exists/so/we/add/some/more/dirs/just/in/case/yep/asdfqwer-asdf').catch(err => {
            expect(output_clean_path).to.be.a.path()
            expect(err.message).to.match(/outside of project without force option/)
          })
        })

        it('should remove a file', function(){
          return remove_env.removeAsync(output_clean_path).then(()=> {
            expect(output_clean_path).to.not.be.a.path()
          })
        })

      })

      describe('checks', function(){

        // before(function(){
        //   mockfs(mockfs_config, { createCwd: false })
        // })

        // after(function(){
        //   mockfs.restore()
        // })

        before(function(){
          debug('copies before copy', test_fixture_path, output_fixture_path)
          return fse.copy(test_fixture_path, output_fixture_path)
        })

        it('should find that `fixture/copy` exists with with checkFixturePath', function(){
          expect( test_env.checkFixturePath('copy') ).to.be.true
        })

        it('should find that `fixture/copy` exists with with checkFixturePath', function(){
          return expect( test_env.checkFixturePathAsync('copy') ).to.become(true)
        })

        it('should find that `fixture/copy#@Z` doesn\'t exist with checkFixturePath', function(){
          expect( test_env.checkFixturePath('copy#@Z') ).to.be.false
        })

        it('should find that `fixture/copy#@Z` doesn\'t exist with checkFixturePath', function(){
          return expect( test_env.checkFixturePathAsync('copy#@Z') ).to.become(false)
        })

      })
    })
  })

})
