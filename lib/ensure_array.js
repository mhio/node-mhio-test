const isArray = Array.isArray

function array(a) {
  return (isArray(a)) ? a : Array(a)
}

function arrayOnNil(a) {
  if ( a === undefined || a === null ) return []
  return (isArray(a)) ? a : Array(a)
}

module.exports = { array, arrayOnNil }
