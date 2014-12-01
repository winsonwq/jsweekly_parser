var request = require('request');
var co = require('co');
var thunkify = require('thunkify');
var token = require('./config')['readability_token'];

var readabilityRead = co.wrap(function* (uri) {
  var uri = 'https://readability.com/api/content/v1/parser?token=' + token + '&url=' + uri;
  var body = (yield thunkify(request.get)(uri))[1];
  return JSON.parse(body).content;
});

module.exports = readabilityRead;
