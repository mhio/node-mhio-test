const Promise = require('bluebird')
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-fs'))
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

const { TestEnv } = require('@mhio/test')


describe('tests', function(){

  describe('output', function(){

    let test_env, out

    before('Copy `files` from fixtures', function(){
      test_env = TestEnv.setupTestDir(__dirname, { test_dir: 'examples' })
      out = test_env.output('newdir')
      return out.copyFrom('files', 'subdir')
    })

    after('Cleanup', function(){
      return out.clean()
    })

    it('should now have fixtures in the output directory', function(){
      let dir = out.path('subdir')
      expect( dir ).to.be.a.directory().with.contents(['firstfile'])
    })

    it('should write a file to output', function(){
      let file = out.path('subdir', 'testfile')
      return fs.writeFileAsync(file, 'data\n').then( ()=> {
        expect( path.join(__dirname,'output','newdir','subdir','testfile') ).to.be.a.file()
      })
    })

  })

  describe('cleanup', function(){

    it('should have cleaned the output directory', function(){
      let test_env = TestEnv.setupTestDir(__dirname, { test_dir: 'examples' })
      let out = test_env.output()
      expect( out.path('newdir') ).to.not.be.a.path()
      expect( out.path() ).to.be.a.directory()
    })

  })

})
