const debug = require('debug')('dply:test:unit:test_env')
const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const path = require('path')

const expect = require('chai').expect
require('chai').use(require('chai-fs'))

const { TestEnv } = require('../')


describe('Unit::deployable-test::TestEnv', function(){

  describe('Class', function(){

    let test_path = path.join(__dirname, 'output')
    let output_path = path.join(test_path, require('crypto').randomBytes(2).toString('hex') )

    beforeEach(function(){
      TestEnv.init( output_path )
    })

    it('should guess at a path when not (taking node_modules/deployable-test into consideration)', function(){
      TestEnv.init()
      let parentpath = path.resolve(__dirname, '..', '..')
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
      expect( TestEnv.removeTmpPrefix('ab') ).to.equal('ab')
    })

    it('should return a tmp path without the tmp-', function(){
      let tmppath = TestEnv.tmpOutputPath()
      expect( TestEnv.removeTmpPrefix(tmppath) ).to.match(/^[0-9a-f]{5}$/)
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

      it('should clean an output directory `output/test2`', function(){
        let testpath = path.resolve(output_path, 'output', 'test2')
        expect(testpath).to.not.be.a.path('before')
        return TestEnv.cleanOutputAsync('test2').then(file => {
          expect(file).to.equal(testpath)
          expect(testpath).to.not.be.a.path('after')
        })
      })

    })

    describe('fs', function(){

      after(function(){
        // clean up output `output_path`
        return fse.removeAsync( output_path )
      })

      it('should make an output directory `output/test1`', function(){
        let testpath = path.resolve(output_path, 'output', 'test1')
        return TestEnv.mkdirOutputAsync('test1').then(()=> {
          expect(testpath).to.be.a.directory().and.empty
        })
      })

      it('should clean an output directory `output/test2`', function(){
        let testpath = path.resolve(output_path, 'output', 'test2')
        expect(testpath).to.not.be.a.path('before')
        return TestEnv.mkdirOutputAsync('test2').then(()=>{
          expect(testpath).to.be.a.directory()
          return TestEnv.cleanOutputAsync('test2')
        }).then(()=>{
          expect(testpath).to.not.be.a.path('after')
        })
      })


      it('should make a tmp output directory', function(){
        let testpath = path.resolve(output_path, 'output', 'tmp-cd')
        expect(testpath).to.not.be.a.path()
        return TestEnv.mkdirOutputTmpAsync('cd').then(()=>{
          expect(testpath).to.be.a.directory()
        })
      })

      it('should clean a tmp output directory', function(){
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

      it('should clean all tmp output directories', function(){
        let testtmppath = path.resolve(output_path, 'output', 'tmp-gh')
        let testpath = path.resolve(output_path, 'output', 'whatever')
        return Promise.all([
          TestEnv.mkdirOutputAsync('whatever'),
          TestEnv.mkdirOutputTmpAsync(),
          TestEnv.mkdirOutputTmpAsync('gh')
        ]).then(()=>{
          expect(testtmppath).to.be.a.directory()
          expect(testpath).to.be.a.directory()
          return TestEnv.cleanAllOutputTmpAsync()
        }).then(()=>{
          expect(testtmppath).to.not.be.a.path()
          expect(testpath).to.not.be.a.path()
        })
      })

    })
  })

})
