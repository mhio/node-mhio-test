const debug = require('debug')('mhio:test:helper:mockfsLoad')
const klaw = require('klaw')
const Promise = require('bluebird')
const path = require('path')
const mockfs = require('mock-fs')
const fs = Promise.promisifyAll(require('fs'))


function mockfsLoad(dir){
  return new Promise((resolve, reject) => {
    let items = []
    klaw(dir)
      .on('data', item => {
        let pr = mockfsLoadItem(item)
        items.push(pr)
      })
      .on('end', ()=> {
        let ret = Promise.all(items).then(items => mockFsItemsToConfig(items))
        resolve(ret)
      })
      .on('error', reject)
  })
}

function mockFsItemCompare(a,b) {
  if (a.path < b.path) return -1
  if (a.path > b.path) return 1
  return 0
}

function mockfsCreateDirs(parent_config, dirs){
  let dir = dirs.shift()
  debug('mockfsCreateDirs', dir)
  if (!parent_config[dir]) parent_config[dir] = {}
  if ( dirs.length > 0 ) return mockfsCreateDirs(parent_config[dir], dirs)
  return parent_config[dir]
}


function mockFsItemsToConfig(items){
  let config = {}

  // Longest dirs go first, so directory config can be populated with contents
  items.sort(mockFsItemCompare).reverse()
  debug('items', items)

  // Now create all the mockfs entries
  items.forEach(item => {

    // Get an array of directories from the item
    let item_parsed = path.parse(item.path)
    let dirs = item_parsed.dir.split(path.sep)
    if ( item_parsed.root ) {
      dirs.shift()
      dirs[0] = `${item_parsed.root}${dirs[0]}`
    }

    // Create any of the parent directories for this item, if required
    let final_dir_config = mockfsCreateDirs(config, dirs)

    // Then apply the mockfs config to the final directories config
    debug('adding item to ', final_dir_config, item_parsed.base, final_dir_config[item_parsed.base])
    switch( typeof final_dir_config[item_parsed.base] ) {
      case 'object':
        // take current contents and turn it into dir
        return mockfs.directory({
          mode: item.stats.mode,
          uid: item.stats.uid,
          gid: item.stats.gid,
          atime: item.stats.atime,
          ctime: item.stats.ctime,
          mtime: item.stats.mtime,
          birthtime: item.stats.birthtime,
          items: final_dir_config[item_parsed.base]
        })

      case 'function':
        throw new Error(`${item_parsed.base} already populated`)

      case 'undefined':
        return final_dir_config[item_parsed.base] = item.mockfs

      default:
        throw new Error('How did we get here??')
    }
  })

  // Should be a complete config now
  return config
}

function mockfsLoadItemFile(item){
  return fs.readFileAsync(item.path).then(data =>{
    debug('mockfsLoadItemFile read item', item.path, item.stats.mode)
    let stats = item.stats
    item.mockfs = mockfs.file({
      content: data,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      atime: stats.atime,
      ctime: stats.ctime,
      mtime: stats.mtime,
      birthtime: stats.birthtime,
    })
    return item
  })
}
function mockfsLoadItemSymlink(item){
  return fs.readlinkAsync(item.path).then(data => {
    debug('mockfsLoadItemSymlink read item', item.path, item.stats.mode)
    let stats = item.stats
    item.mockfs = mockfs.symlink({
      path: data,
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      atime: stats.atime,
      ctime: stats.ctime,
      mtime: stats.mtime,
      birthtime: stats.birthtime,
    })
    return item
  })
}

function mockfsLoadItemDirectory(item){
  return Promise.try(()=>{
    debug('mockfsLoadItemDirectory read item', item.path, item.stats.mode)
    let stats = item.stats
    item.mockfs = mockfs.directory({
      mode: stats.mode,
      uid: stats.uid,
      gid: stats.gid,
      atime: stats.atime,
      ctime: stats.ctime,
      mtime: stats.mtime,
      birthtime: stats.birthtime,
    })
    return item
  })
}

function mockfsLoadItem(item){
  let stats = item.stats
  debug('mockfsLoadItem found %s', item.path)
  debug(
    'fil:%s dir:%s blk:%s chr:%s sym:%s',
    stats.isFile(),
    stats.isDirectory(),
    stats.isBlockDevice(),
    stats.isCharacterDevice(),
    stats.isSymbolicLink()
  )
  if (stats.isFile()){
    return mockfsLoadItemFile(item)
  }
  else if (stats.isDirectory()){
    return mockfsLoadItemDirectory(item)
  }
  else if (stats.isSymbolicLink()){
    return mockfsLoadItemSymlink(item)
  }
  else {
    debug(
      'Item not a supported file type! blk:%s chr:%s fifo:%s sock:%s',
      stats.isBlockDevice(),
      stats.isCharacterDevice(),
      stats.isFIFO(),
      stats.isSocket()
    )
  }
}

module.exports = mockfsLoad
