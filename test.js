var path = require('path');
var assert = require('assert');
var concatStream = require('concat-stream');
var gulp = require('gulp');
var processIfModified = require('.');
var fs = require('fs')

describe('gulp-changed-in-place', function () {

  if (fs.existsSync('./cache/.cache-default.json')) {
    fs.unlinkSync('./cache/.cache-default.json');
  }

  describe('When comparing by sha1 hash', function () {
    it('Should passthrough all files on first run (no cache)', function (done) {
      gulp.src('test_assets/*')
        .pipe(processIfModified())
        .pipe(concatStream(function (buf) {
          assert.equal(2, buf.length);
          done();
        }));
    });

    it('Should passthrough no files when no files changed', function (done) {
      gulp.src('test_assets/*')
        .pipe(processIfModified())
        .pipe(concatStream(function (buf) {
          assert.equal(0, buf.length);
          done();
        }));
    });

    it('Should passthrough all files when at least one changed', function (done) {
      fs.appendFileSync('./test_assets/a', 'test');

      gulp.src('test_assets/*')
        .pipe(processIfModified())
        .pipe(concatStream(function (buf) {
          assert.equal(2, buf.length);
          assert.equal('a', path.basename(buf[0].path));
          assert.equal('b', path.basename(buf[1].path));
          done();
        }));
    });

    it('Should passthrough no files when no files changed #2', function (done) {
      gulp.src('test_assets/*')
        .pipe(processIfModified())
        .pipe(concatStream(function (buf) {
          assert.equal(0, buf.length);
          done();
        }));
    });

    it('Should passthrough all files when at least one changed #2', function (done) {
      fs.writeFileSync('./test_assets/a', 'a');

      gulp.src('test_assets/*')
        .pipe(processIfModified())
        .pipe(concatStream(function (buf) {
          assert.equal(2, buf.length);
          assert.equal('a', path.basename(buf[0].path));
          assert.equal('b', path.basename(buf[1].path));
          done();
        }));
    });
  });
});
