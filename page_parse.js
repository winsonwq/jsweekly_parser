var request = require('request');
var through2 = require('through2');
var byline = require('byline');

const javascriptWeeklyHost = 'http://javascriptweekly.com/';
const linkRegex = /(http.+)utm_source=javascriptweekly/;
const titleRegex = /\<a.+\>(.+)\<\/a\>/;
const issueRegex = /issues\s(\d+)/

function processLineToArticleObj(lineString) {
  var obj = {};
  lineString.replace(linkRegex, (function (matched, link) {
    lineString.replace(titleRegex, (function (matched, title) {
      obj.link = link;
      obj.title = title;
    }).bind(this));
  }).bind(this));
  return obj;
}

function issueParser(issue, callback) {
  var links = [];
  var lastestIssue = '';
  var pageLink = javascriptWeeklyHost + (issue ? issue : 'latest');

  request.get(pageLink)
    .pipe(through2(function (chunk, enc, callback) {
      this._readableState.encoding = 'utf8';
      this.push(chunk);
      callback();
    }))
    .pipe(byline.createStream())
    .pipe(through2.obj(function (chunk, enc, callback) {
      var lineHtml = chunk.toString();
      var linkItem = processLineToArticleObj.call(this, lineHtml);
      linkItem.link && this.push(linkItem);

      if (!issue) {
        lineHtml.replace(issueRegex, function (matched, issue) {
          lastestIssue = issue;
        });
      }

      callback();
    }))
    .on('data', function (link) {
      links.push(link);
    })
    .on('error', function (ex) {
      callback && callback(ex, null);
    })
    .on('end', function () {
      callback && callback(null, {
        issue: lastestIssue || issue,
        links: links
      });
    });
}

function latestIssueParser (callback) {
  issueParser(null, callback);
}

module.exports = {
  issueParser: issueParser,
  latestIssueParser: latestIssueParser
};

