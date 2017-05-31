var fs = require('fs')
 , tar = require('tar')
 , zlib = require('zlib')
 , wget = require('wget')

function extractTarball(sourceFile, destination, callback) {
  if( /(gz|tgz)$/i.test(sourceFile)) {
    // This file is gzipped, use zlib to deflate the stream before passing to tar.
    fs.createReadStream(sourceFile)
    .pipe(zlib.createGunzip())
    .pipe(tar.Unpack({ path: destination}))
    .on('error', function(er) { callback(er)})
    .on("end", function() { callback(null)})
  } else {
    // This file is not gzipped, just deflate it.
    fs.createReadStream(sourceFile)
    .pipe(tar.Extract({ path: destination}))
    .on('error', function(er) { callback(er)})
    .on("end", function() { callback(null)})
  }
}

var request = require('request')
var path = require('path');

var user = 'konsumer'
var tag = '0.0.13'
var repoName = 'easy-ffmpeg'
var pkg = 'ffmpeg-' + process.platform + '.tgz'
var counter = 0
var errors = 0

function downloader () {
  // if no ffmpeg and ffprobe are found installed
  // we will download the one for our platform

  var binDir = path.resolve(__dirname, '../..', 'bin');

  if (!fs.existsSync(binDir)){
	fs.mkdirSync(binDir);
  }

  var url = 'https://github.com/' + user + '/' + repoName + '/releases/download/' + tag + '/' + pkg

  request
    .get(url)
    .on('error', function (err) {
      throw err
    })
    .pipe(fs.createWriteStream(pkg))
    .on('close', function () {
      extractTarball(pkg, binDir, function (err, result) {
        if (err) {
          throw err
        }
        fs.unlink(pkg, function (err) {
          if (err) {
            throw err
          }
        })
      })
    })
}

function checker (err, path) {
  if (err) {
    errors++
  } else if (!err && !path) {
    errors++
  }

  if (counter) {
    // finished checking for ffmpeg and ffprobe
    if (errors) {
      // could not find ffmpeg and ffprobe installed, downloading
      downloader()
    }
  } else {
    counter++
  }
}

// let's try to find ffmpeg and ffprobe
var ffmpeg = require('fluent-ffmpeg')()

ffmpeg._getFfmpegPath(checker)
ffmpeg._getFfprobePath(checker)
