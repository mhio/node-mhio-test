/* global expect */
const debug = require('debug')('dply:test:unit:test_env')
const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const path = require('path')

const { TestEnv } = require('../')

let test_path = path.join(__dirname, 'output')
let test_fixture_path = path.join(__dirname, 'fixture')
let output_path = path.join(test_path, require('crypto').randomBytes(2).toString('hex') )
let output_fixture_path = path.join(output_path, 'fixture')
let output_output_path = path.join(output_path, 'output')


describe('Unit::deployable-test::TestEnv', function(){

  describe('Class', function(){

    beforeEach(function(){
      TestEnv.init( output_path )
    })

    it('should expose path.join as join', function(){
      expect( TestEnv.join('test','a') ).to.equal( `test${path.sep}a` )
    })

    it('should expose path.resolve as resolve', function(){
      expect( TestEnv.resolve(test_path,'a') ).to.equal( `${test_path}${path.sep}a` )
    })

    it('should guess at a path when not given (taking node_modules/deployable-test/lib into consideration)', function(){
      TestEnv.init()
      let parentpath = path.resolve(__dirname, '..', '..', '..')
      expect( TestEnv.fixturePath('somesubdir') ).to.equal( path.join(parentpath, 'test', 'fixture', 'somesubdir') )
    })

    it('should generate a fixture path in `test/`', function(){
      let testpath = path.join(output_path, 'fixture', 'fp')
      expect( TestEnv.fixturePath('fp') ).to.equal( testpath )
    })

    it('should return the base path as `test/`', function(){
      let testpath = path.resolve(output_path, 'bp')
      expect( TestEnv.basePath('bp') ).to.equal( testpath )
    })

    it('should generate an output path in `test/output`', function(){
      let testpath = path.resolve(output_path, 'output', 'op')
      expect( TestEnv.outputPath('op') ).to.equal( testpath )
    })

    it('should generate a random tmp path `test/output/tmp-xxxxx`', function(){
      let testpath = path.resolve(output_path, 'output', 'tmp-')
      let restpath_re = new RegExp(testpath)
      expect( TestEnv.tmpOutputPath() ).to.match( restpath_re )
      expect( TestEnv.tmpOutputPath() ).to.match( /[0-9a-f]{5}$/ )
    })

    it('should generate a fixed tmp path `test/output/tmp-ab`', function(){
      let testpath = path.resolve(output_path, 'output', 'tmp-ab')
      expect( TestEnv.tmpOutputPath('ab') ).to.equal( testpath )
    })

    it('should return the same path if not a test path', function(){
      expect( TestEnv.removeTmpPrefixFromPath('ab') ).to.equal('ab')
    })

    it('should return a tmp path without the tmp-', function(){
      let tmppath = TestEnv.tmpOutputPath()
      expect( TestEnv.removeTmpPrefixFromPath(tmppath) ).to.match(/^[0-9a-f]{5}$/)
    })


    describe('fs DEBUG_CLEAN', function(){

      let orig = process.env.DEBUG_CLEAN

      before(function(){
        process.env.DEBUG_CLEAN = 'true'
      })

      after(function(){
        ( orig === undefined )
          ? delete process.env.DEBUG_CLEAN
          : process.env.DEBUG_CLEAN = orig
      })

      it('should clean an output directory `output/test2` via .cleanOutputAsync', function(){
        let testpath = path.resolve(output_path, 'output', 'test2')
        expect(testpath).to.not.be.a.path('before')
        return TestEnv.cleanOutputAsync('test2').then(file => {
          expect(file).to.equal(testpath)
          expect(testpath).to.not.be.a.path('after')
        })
      })

      it('should fail to clean something outside our path', function(){
        let p = TestEnv.cleanAsync('/tmp/non-existant-thing/134a24z94r24U1')
        return expect( p ).to.be.rejectedWith(/clean outside of project without force/)
      })

      it('should fail to clean something outside our path', function(){
        let p = TestEnv.clean('/tmp/non-existant-thing/134a24z94r24U1')
        return expect( p ).to.be.rejectedWith(/clean outside of project without force/)
      })

      it('should fail to clean something outside our path .cleanAsync', function(){
        let p = TestEnv.cleanAsync()
        return expect( p ).to.be.rejectedWith(/No dir to clean/)
      })

      it(`should fail to clean a path that's not a string via .cleanAsync`, function(){
        let p = TestEnv.cleanAsync([])
        return expect( p ).to.be.rejectedWith(/directory must be a string/)
      })

      it('should fail to clean output without an arg to cleanOutputAsync', function(){
        let p = TestEnv.cleanOutputAsync()
        return expect( p ).to.be.rejectedWith(/No subdir to clean/)
      })

      it('should clean the whole output dir with cleanAllOutputAsync', function(){
        let p = TestEnv.cleanAllOutputAsync()
        return expect( p ).to.be.become( path.join(output_path, 'output') )
      })

    })


    describe('fs', function(){

      after(function(){
        // clean up output `output_path`
        if ( process.env.DEBUG_CLEAN ) return output_path
        return fse.removeAsync( output_path )
      })

      it('should make an output directory `output/test1` with mkdirOutputAsync', function(){
        let testpath = path.resolve(output_path, 'output', 'test1')
        return TestEnv.mkdirOutputAsync('test1').then(()=> {
          expect(testpath).to.be.a.directory().and.empty
        })
      })

      it('should clean an output directory `output/test2` with cleanOutputAsync', function(){
        let testpath = path.resolve(output_path, 'output', 'test2')
        expect(testpath).to.not.be.a.path('before')
        return TestEnv.mkdirOutputAsync('test2').then(()=>{
          expect(testpath).to.be.a.directory()
          return TestEnv.cleanOutputAsync('test2')
        }).then(()=>{
          expect(testpath).to.not.be.a.path('after')
        })
      })


      it('should make a tmp output directory with mkdirOutputTmpAsync', function(){
        let testpath = path.resolve(output_path, 'output', 'tmp-cd')
        expect(testpath).to.not.be.a.path()
        return TestEnv.mkdirOutputTmpAsync('cd').then(()=>{
          expect(testpath).to.be.a.directory()
        })
      })

      it('should clean a tmp output directory with cleanOutputTmpAsync', function(){
        let testpath = path.resolve(output_path, 'output', 'tmp-ef')
        expect(testpath).to.not.be.a.path('before')
        return TestEnv.mkdirOutputTmpAsync('ef').then((temp_file)=> {
          debug('temp_file',temp_file)
          expect(testpath).to.be.a.directory()
          return TestEnv.cleanOutputTmpAsync('ef')
        }).then(()=>{
          expect(testpath).to.not.be.a.path('after')
        })
      })

      it('should clean all tmp output directories with cleanAllOutputTmpAsync', function(){
        let testpath_whatever = path.resolve(output_path, 'output', 'whatever')
        let testtmppath = path.resolve(output_path, 'output', 'tmp-gh')
        return Promise.all([
          TestEnv.mkdirOutputAsync('whatever'),
          TestEnv.mkdirOutputTmpAsync(),
          TestEnv.mkdirOutputTmpAsync('gh')
        ])
        .then((res)=>{
          expect(testpath_whatever).to.be.a.directory()
          expect(res[1]).to.be.a.directory()
          expect(testtmppath).to.be.a.directory()
          return TestEnv.cleanAllOutputTmpAsync()
        })
        .then(()=>{
          expect(testpath_whatever).to.be.a.directory('whatever stays')
          expect(testtmppath).to.not.be.a.path('cleaned')
        })
      })


      describe('copies', function(){

        before(function(){
          debug('copies before copy', test_fixture_path, output_fixture_path)
          return fse.copyAsync(test_fixture_path, output_fixture_path)
        })

        it('should copy fixture files to a tmp output dir', function(){
          return TestEnv.copyFixtureToTmpOutputAsync('copy').then(res => {
            // use res as the tmp path is random
            expect( res ).to.be.a.directory()
            expect( path.join(res,'test1' )).to.be.a.file()
          })
        })

        it('should copy fixture files to an output dir', function(){
        let copied_file = path.join(output_output_path, 'copyoutsuf', 'test1')
          return TestEnv.copyFixtureToOutputAsync('copy', 'copyoutsuf').then(() => {
            expect(copied_file).to.be.a.file()
          })
        })

      })
    })
  })

})
