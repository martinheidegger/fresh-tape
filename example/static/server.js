'use strict';

var http = require('http');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

var serve = serveStatic(__dirname);
var server = http.createServer(function (req, res) {
    serve(req, res, finalhandler(req, res));
});
server.listen(8000);
