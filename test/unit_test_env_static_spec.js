/* global expect */
const debug = require('debug')('dply:test:unit:test_env')
const Promise = require('bluebird')
const fse = Promise.promisifyAll(require('fs-extra'))
const path = require('path')

const { TestEnvStatic } = require('../')

// Standard `output/` and `fixture/`
let test_output_path = path.join(__dirname, 'output')
let test_fixture_path = path.join(__dirname, 'fixture')

// Tmp `output/` and `fixture/` to test with
let output_path = path.join(test_output_path, require('crypto').randomBytes(2).toString('hex') )
let output_test_path = path.join(output_path, 'test')
let output_fixture_path = path.join(output_test_path, 'fixture')
let output_output_path = path.join(output_test_path, 'output')


describe('Unit::deployable::test::TestEnvStatic', function(){

  describe('Static', function(){

    it('should expose path.join as join', function(){
      expect( TestEnvStatic.join('test','a') ).to.equal( `test${path.sep}a` )
    })

    it('should run .join()', function(){
      expect(TestEnvStatic.join('a','b')).to.equal('a/b')
    })
    it('should run .resolve()', function(){
      expect(TestEnvStatic.resolve('test')).to.equal(__dirname)
    })

    it('should mkdirsAsync', function(){
      return expect( TestEnvStatic.mkdirsAsync(output_path) ).to.become(output_path)
    })

    it('should copyAsync', function(){
      return expect( TestEnvStatic.copyAsync(test_fixture_path, output_path) ).to.become(undefined)
    })

    it('should copyAsync', function(){
      let src = TestEnvStatic.join(test_fixture_path,'files','firstfile')
      let dest = TestEnvStatic.join(output_path,'files')
      return TestEnvStatic.copyAsync(test_fixture_path, output_path).then(()=>{
        return expect( TestEnvStatic.copyAsync(src, dest) )
          .to.be.rejectedWith(/FS copy failed : unlink /)
      })
    })

    it('should mkdirsAsync', function(){
      return TestEnvStatic.mkdirsAsync(output_path).then(()=>{
        return TestEnvStatic.mkdirsAsync(output_path)
      }).then( res => expect( res ).to.be.null )
    })

    it('should mkdirsAsync', function(){
      return TestEnvStatic.mkdirsAsync(output_path).then(()=>{
        return TestEnvStatic.mkdirsAsync(output_path)
      }).then( res => expect( res ).to.be.null )
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
        expect(stat).to.have.keys(
          'atime',
          'birthtime',
          'blksize',
          'blocks',
          'ctime',
          'dev',
          'gid',
          'ino',
          'mode',
          'mtime',
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
