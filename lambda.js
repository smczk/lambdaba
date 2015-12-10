var Aws = require('aws-sdk');
var Jimp = require('jimp');
var Promise = require('bluebird');
var s3 = new Aws.S3({ apiVersion: '2006-03-01', region: 'ap-northeast-1' });

exports.handler = (function(event, context) {
  var promises = event.images.map(getImage());

  Promise.all(promises).then(function(result) {
    event.conditions.forEach(function(condition){
      result[0].composite(result[1].resize(condition.width, condition.height), condition.x, condition.y)
    });

    result[0].getBuffer('image/jpeg', function(err, buf) {
      event.composite.Body = buf;
      s3.putObject(event.composite, function(err, data) {
        if(!err) context.done(null, 'upload!');
      });
    });
  }).catch(function(err){
    context.fail(err);
  });
})

function getImage() {
  return function(param) {
    return new Promise(function(resolve, reject) {
      s3.getObject(param, function(err, object) {
        resolve(Jimp.read(object.Body));
      });
    });
  }
}
