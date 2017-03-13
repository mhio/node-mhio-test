/* global expect */
const debug = require('debug')('dply:test:unit:test_env')
const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const path = require('path')

const { TestEnv } = require('../')

let test_output_path = path.join(__dirname, 'output')
let test_fixture_path = path.join(__dirname, 'fixture')

let output_path = path.join(test_output_path, require('crypto').randomBytes(2).toString('hex') )
let output_test_path = path.join(output_path, 'test')
let output_fixture_path = path.join(output_test_path, 'fixture')
let output_output_path = path.join(output_test_path, 'output')


describe('Unit::deployable-test::TestEnv', function(){

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


    describe('fs', function(){

      after(function(){
        // clean up output `output_path`
        if ( process.env.DEBUG_CLEAN ) return output_path
        return fse.removeAsync( output_path )
      })

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
      test_env = TestEnv.create( output_path )
    })

    it('should expose path.join as join', function(){
      expect( test_env.join('test','a') ).to.equal( `test${path.sep}a` )
    })

    it('should expose path.resolve as resolve', function(){
      expect( test_env.resolve(test_output_path,'a') )
        .to.equal( `${test_output_path}${path.sep}a` )
    })

    it('should guess at a path when not given (taking node_modules/@deployable/test/lib into consideration)', function(){
      test_env = TestEnv.create()
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
      expect( test_env.tmpOutputPath() ).to.match( restpath_re )
      expect( test_env.tmpOutputPath() ).to.match( /[0-9a-f]{5}$/ )
    })

    it('should generate a fixed tmp path `test/output/tmp-ab`', function(){
      let testpath = path.resolve(output_test_path, 'output', 'tmp-ab')
      expect( test_env.tmpOutputPath('ab') ).to.equal( testpath )
    })

    it('should return the same path if not a test path', function(){
      expect( test_env.removeTmpPrefixFromPath('ab') ).to.equal('ab')
    })

    it('should return a tmp path without the tmp-', function(){
      let tmppath = test_env.tmpOutputPath()
      expect( test_env.removeTmpPrefixFromPath(tmppath) ).to.match(/^[0-9a-f]{5}$/)
    })


    describe('fs DEBUG_CLEAN', function(){

      let orig = process.env.DEBUG_CLEAN

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

      it('should fail to clean something outside our path', function(){
        let p = test_env.cleanAsync('/tmp/non-existant-thing/134a24z94r24U1')
        return expect( p ).to.be.rejectedWith(/clean outside of project without force/)
      })

      it('should fail to clean something outside our path', function(){
        let p = test_env.cleanAsync('/tmp/non-existant-thing/134a24z94r24U1')
        return expect( p ).to.be.rejectedWith(/clean outside of project without force/)
      })

      it('should fail to clean something outside our path .cleanAsync', function(){
        let p = test_env.cleanAsync()
        return expect( p ).to.be.rejectedWith(/No dir to clean/)
      })

      it(`should fail to clean a path that's not a string via .cleanAsync`, function(){
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
      })

    })


    describe('fs', function(){

      after(function(){
        // clean up output `output_path`
        if ( process.env.DEBUG_CLEAN ) return output_path
        return fse.removeAsync( output_test_path )
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
        return test_env.mkdirOutputAsync('test2').then(()=>{
          expect(testpath).to.be.a.directory()
          return test_env.cleanOutputAsync('test2')
        }).then(()=>{
          expect(testpath).to.not.be.a.path('after')
        })
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
        return test_env.mkdirOutputTmpAsync('ef').then((temp_file)=> {
          debug('temp_file',temp_file)
          expect(testpath).to.be.a.directory()
          return test_env.cleanOutputTmpAsync('ef')
        }).then(()=>{
          expect(testpath).to.not.be.a.path('after')
        })
      })

      it('should clean all tmp output directories with cleanAllOutputTmpAsync', function(){
        let testpath_whatever = path.resolve(output_test_path, 'output', 'whatever')
        let testtmppath = path.resolve(output_test_path, 'output', 'tmp-gh')
        return Promise.all([
          test_env.mkdirOutputAsync('whatever'),
          test_env.mkdirOutputTmpAsync(),
          test_env.mkdirOutputTmpAsync('gh')
        ])
        .then((res)=>{
          expect(testpath_whatever).to.be.a.directory()
          expect(res[1]).to.be.a.directory()
          expect(testtmppath).to.be.a.directory()
          return test_env.cleanAllOutputTmpAsync()
        })
        .then(()=>{
          expect(testpath_whatever).to.be.a.directory('whatever stays')
          expect(testtmppath).to.not.be.a.path('cleaned')
        })
      })


      describe('copies', function(){

        before('copies before copy', function(){
          debug('copies before copy', test_fixture_path, output_fixture_path)
          return fse.copyAsync(test_fixture_path, output_fixture_path)
        })

        it('should copy fixture files to a tmp output dir', function(){
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

      describe('checks', function(){

        before(function(){
          debug('copies before copy', test_fixture_path, output_fixture_path)
          return fse.copyAsync(test_fixture_path, output_fixture_path)
        })

        it('should find that `fixture/copy` exists with with checkFixturePath', function(){
          expect( test_env.checkFixturePath('copy') ).to.be.true
        })

        it('should find that `fixture/copy` exists with with checkFixturePath', function(){
          return expect( test_env.checkFixturePathAsync('copy') ).to.become(true)
        })

        it('should find that `fixture/copy#@Z` exists with checkFixturePath', function(){
          expect( test_env.checkFixturePath('copy#@Z') ).to.be.false
        })

        it('should find that `fixture/copy#@Z` exists with checkFixturePath', function(){
          return expect( test_env.checkFixturePathAsync('copy#@Z') ).to.become(false)
        })

      })
    })
  })

})
