const path = require('path')
const jsonFormat = require('json-format')
const loaderUtils = require('loader-utils')
class EmitJsonFileWebpackPlugin {
	constructor(files, options) {

    if (!Array.isArray(files) && typeof files !== 'function') {
      throw new Error('[emit-json-file-webpack-plugin] arguments must be an array or function that returns an array')
    }
		this.files = files || []
    this.options = options || {}
	}

	apply(compiler) {
    const files = ( typeof this.files === 'function' ) ? this.files() : this.files
    const filename = this.options.filename || '[name].json'
    compiler.plugin('emit', function(compilation, cb) {

      files.forEach(file => {
        if (!file.content || (!file.path && !file.linkedTo)) {
          compilation.errors.push(new Error(`[emit-json-file-webpack-plugin] file arguments must contain 'content' and either 'path' or 'linkedTo'`))
          return
        }
        const formatted = jsonFormat(file.content)
        const linkedTo = file.linkedTo || false;
        if ( linkedTo ) {
          compilation.chunks.forEach( chunk => {
            chunk.forEachModule(function(module) {
              module.fileDependencies.forEach(function(filepath) {
                if ( filepath == linkedTo ) {
                  const getPath = format => compilation.getPath(format, {
                    chunk,
                  }).replace(/\[(?:(\w+):)?contenthash(?::([a-z]+\d*))?(?::(\d+))?\]/ig, function () { 
                    return loaderUtils.getHashDigest(formatted, arguments[1], arguments[2], parseInt(arguments[3], 10));
                  })
                  file.path = getPath(filename)
                  if (!chunk.files.includes(file.path)) {
                    chunk.files.push(file.path)
                  }
                }

              })
            })
          })
        }
        
        compilation.assets[file.path] = {
          size: () => formatted.length,
          source: () => formatted
        }
      })
      cb()
    })
  }
}

module.exports = EmitJsonFileWebpackPlugin
