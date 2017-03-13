const crypto = require('crypto')

// #### `randomHex(n)`
//
function randomHex(n){
  let bytes = Math.ceil(n/2)
  return crypto.randomBytes(bytes).toString('hex').slice(0,n)
}

module.exports = randomHex
