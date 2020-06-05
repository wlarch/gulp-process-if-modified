var crypto = require('crypto');
var path = require('path');
var through = require('through2');
var cacheDir = './cache';

/**
 * Create cache directory if non existent
 */
var init = function() {
  var fs = require('fs');

  if (!fs.existsSync(cacheDir)){
      fs.mkdirSync(cacheDir);
  }
}

module.exports = function (options) {

  init();

  options = options || {};

  var filename = '.cache-' + (options.cacheFilename || 'default') + '.json';

  // Initialize cache object
  const cache = require('node-file-cache').create(
    {
      file: cacheDir + '/' + filename,
      life: options.cacheLife || 1814400 // 3 weeks by default
    }
  );

  var hasChanged = false;
  var basePath = options.basePath || undefined;
  var files = [];

  /**
   * Checks if file has been changed by comparing its current SHA1
   * hash with the one in cache, if present. Returns true if the
   * file hasChanged, false if not.
   *
   * @param {*} stream  The current stream of Vinyl files
   * @param {*} basePath  The basePath used to create file key in cache
   * @param {*} file  The file itself
   */
  function hasFileChangedBySha1Hash(basePath, file) {

    // If file contents is null, it cannot be hashed
    if (file.contents === null && file.stat.isFile()) {
      return true;
    }

    // Get new hash and current hash for comparison
    var newHash = crypto.createHash('sha1').update(file.contents).digest('hex');
    var filePath = basePath ? path.relative(basePath, file.path) : file.path;
    var currentHash = cache.get(filePath);

    //Save file hash in cache
    cache.set(filePath, newHash);

    // If no hash exists for file, consider file has changed
    // cache has expired or cache file has been deleted
    if (!currentHash) {
      return true;
    }

    // Cache exists and hashes differ
    if (currentHash && currentHash !== newHash) {
      return true;
    }

    // File has not changed, leave cache as-
    return false;
  }

  /**
   * Process each file of the stream
   *
   * @param {*} file  The current file
   * @param {*} encoding  The encoding
   * @param {*} callback  The callback
   */
  var processFiles = function (file, encoding, callback) {
    // Add file to final array
    files.push(file);

    // Check if file has changed
    if (hasFileChangedBySha1Hash(basePath, file)) {
      hasChanged = true;
    }

    callback();
  }

  /**
   * Generate final Stream with all files or none
   * @param {*} callback
   */
  var finalStream = function (callback) {
    if (hasChanged) {
      // Push all files to stream
      for (let file of files) {
        this.push(file);
      }
    }

    callback();
  }

  /**
   * Run through the files
   */
  return through.obj(processFiles, finalStream);
}
