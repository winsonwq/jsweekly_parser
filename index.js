var co = require('co');
var thunkify = require('thunkify');
var FS = require('fs');
var PATH = require('path');
var pageParse = require('./page_parse');
var readabilityRead = require('./readability_read.js');

const articleInlineStyle = '' +
  'max-width: 700px;' +
  'font-family: \'Helvetica Neue\', Helvetica, \'Segoe UI\', Arial, freesans, sans-serif;' +
  'padding: 50px;' +
  'line-height: 1.25;' +
  'background: #f9f9f9;';

const articleListInlineStyle = '' +
  'font-size: 14px;';

function formatFileName(link) {
  return link.title.replace(/[\/]/g, '-');
}

function formatArticle(linkItem, content) {
  return '' +
    '<meta charset="UTF8"/>' +
    '<title>' + linkItem.title + '</title>' +
    '<h1>' + linkItem.title + '</h1>' +
    '<p><a href="' + linkItem.link + '">Original Article</a> &middot; <a href="#articleList">Articles in this issue</a> </p>' +
    content;
}

function formatArticleList(links) {
  var articleListItemHtml = links.map(function (link) {
    return '<li><a href="./' + articleHtmlFileName(link) + '">' + link.title + '</a></li>'
  }).join('');

  return '<ul>' + articleListItemHtml + '</ul>';
}

function formatArticleListSection(links) {
  return '' +
    '<section id="articleList" style="' + articleListInlineStyle + '">' +
      '<b>Articles in This Issue</b>' +
      formatArticleList(links) +
    '</section>';
}

function articleHtmlFileName(link) {
  return formatFileName(link) + '.html';
}

function pageWrapper(articleContent) {
  return '' +
    '<!doctype html>' +
    '<div style="' + articleInlineStyle + '">' +
      articleContent +
    '</div>';
}

function formatIndex(issueObj) {
  return '' +
    '<meta charset="UTF8"/>' +
    '<title>JS Weekly Latest Issue</title>' +
    '<h1>JavaScript Weekly Latest Issue <a href="http://javascriptweekly.com/issues/' + issueObj.issue + '">#' + issueObj.issue + '</a></h1>'  +
    formatArticleList(issueObj.links) +
    '<small>All Articles Are Copyrighted By Their Respective Copyright Owners.</small>';
}

function generateIssue(outputPath) {
  outputPath = outputPath || 'laetst';

  co(function* () {
    var issueObj = yield thunkify(pageParse.latestIssueParser)();
    var links = issueObj.links;
    var contents = yield links.map(function (linkItem) {
      return readabilityRead(linkItem.link).then(function (content) {
        return pageWrapper(formatArticle(linkItem, content) + '<hr/>' + formatArticleListSection(links));
      });
    });

    var generateFiles = links.map(function (link, idx) {
      return thunkify(FS.writeFile)(outputPath + '/' + articleHtmlFileName(link), contents[idx]);
    });

    generateFiles.push(thunkify(FS.writeFile)(outputPath + '/index.html', pageWrapper(formatIndex(issueObj))));

    yield generateFiles;

  }).catch(function (ex) {
    console.error(ex.stack);
  });

}

var argv = process.argv;
var outputPath = 'latest';
if (argv.length > 2) {
  outputPath = PATH.resolve(__dirname, argv.pop());
}
generateIssue(outputPath);
