/* global expect */
const debug = require('debug')('mhio:test:unit:TestEnvStatic')
const Promise = require('bluebird')
const mockfs = require('mock-fs')
const path = require('path')

const mockfsLoad = require('./fixture/mockfsLoad')

const { TestEnvStatic } = require('../')

// Standard `output/` and `fixture/`
let test_output_path = path.join(__dirname, 'output')
let test_fixture_path = path.join(__dirname, 'fixture')

// Tmp `output/` and `fixture/` to test with
let output_path = path.join(test_output_path, require('crypto').randomBytes(2).toString('hex') )
let output_test_path = path.join(output_path, 'test')
let output_fixture_path = path.join(output_test_path, 'fixture')
let output_output_path = path.join(output_test_path, 'output')


describe('Unit::mhio::test::TestEnvStatic', function(){

  describe('Static', function(){

    before(function(){
      let mockfs_config = null
      before('mockfs', function(){
        return mockfsLoad(test_fixture_path).then(config => {
          mockfs_config = config
          //expect(config).to.eql({})
          mockfs(mockfs_config, { createCwd: false })
          expect( test_fixture_path+'/copy' ).to.be.a.directory()
          expect( test_fixture_path+'/copy/test1' ).to.be.a.file()
          mockfs.restore()
        })
      })
    })

    after(function(){
      mockfs.restore()
    })

    after('cleanup', function(){
      expect(output_path).to.contain(__dirname)
      return TestEnvStatic.removeAsync(output_path).then(res => {
        expect(res).to.be.undefined
        expect(output_path).to.not.be.a.path()
      })
    })

    it('should expose path.join as join', function(){
      expect( TestEnvStatic.join('test','a') ).to.equal( `test${path.sep}a` )
    })

    it('should run .join()', function(){
      expect(TestEnvStatic.join('a','b')).to.equal('a/b')
    })
    it('should run .resolve()', function(){
      expect(TestEnvStatic.resolve('test')).to.equal(__dirname)
    })

    it('should mkdirsAsync the output path', function(){
      return TestEnvStatic.mkdirsAsync(output_path).then(res => {
        expect( output_path ).to.be.a.directory()
        expect( res ).to.equal(output_path)
      })
    })

    it('should copyAsync fixtures to output path', function(){
      return TestEnvStatic.copyAsync(test_fixture_path, output_path).then(res =>{
        expect( output_path ).to.be.a.directory()
        expect( res ).to.be.undefined
      })
    })

    it('should copyAsync ', function(){
      let src = TestEnvStatic.join(test_fixture_path,'files','firstfile')
      let dest = TestEnvStatic.join(output_path,'files')
      return TestEnvStatic.copyAsync(test_fixture_path, output_path).then(()=>{
        return expect( TestEnvStatic.copyAsync(src, dest) )
          .to.be.rejectedWith(/FS copy failed : unlink /)
      })
    })

    it('should mkdirsAsync', function(){
      return TestEnvStatic.mkdirsAsync(output_path)
        .then(()=> TestEnvStatic.mkdirsAsync(output_path))
        .then( res => expect( res ).to.equal(output_path))
    })

    it('should mkdirsAsync', function(){
      return TestEnvStatic.mkdirsAsync(output_path)
        .then(()=> TestEnvStatic.mkdirsAsync(output_path))
        .then( res => expect( res ).to.equal(output_path))
    })

    it('should mkdirsAsync', function(){
      let existing_path = TestEnvStatic.join(test_fixture_path,'files','firstfile')
      let p = TestEnvStatic.mkdirsAsync(existing_path)
      return expect( p ).to.be.rejectedWith(/FS make directory failed/)
    })

    it('should existsSync missing', function(){
      expect( TestEnvStatic.existsSync('asdfasdc') ).to.be.false
    })

    it('should existsSync existing', function(){
      expect( TestEnvStatic.existsSync(__dirname) ).to.be.true
    })


    it('should existsAsync missing', function(){
      let dest = 'asdfasdfasdfdsa'
      return expect(TestEnvStatic.existsAsync(dest)).to.become(false)
    })

    it('should existsAsync exiting', function(){
      return expect(TestEnvStatic.existsAsync(__dirname)).to.become(true)
    })

    it('should statAsync', function(){
      return TestEnvStatic.statAsync(output_path).then( stat => {
        expect(stat).to.contain.keys(
          //'atime',
          //'birthtime',
          'blksize',
          'blocks',
          //'ctime',
          'dev',
          'gid',
          'ino',
          'mode',
          //'mtime',
          'nlink',
          'rdev',
          'size',
          'uid'
        )
      })
    })

    it('should removeAsync', function(){
      expect(output_path).to.contain(__dirname)
      return expect(TestEnvStatic.removeAsync(output_path)).to.become(undefined)
    })

  })

})
