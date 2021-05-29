'use strict';

var fs;
try {
    if (/^win/.test(global.process.platform)) {
        // Make sure that fs is not directly referenced to skip capture through webpack
        // see: https://twitter.com/kamilogorek/status/1102272038411137025
        function dynamicRequire(mod, request) {
            return mod.require(request);
        }
        fs = dynamicRequire(module, 'fs');
    }
} catch (_) {}

var Writable = require('readable-stream').Writable;
var NEWLINE = Buffer.from('\n');

module.exports = function () {
    var line = null;
    var flush = (fs !== undefined)
        ? function () {
            try { fs.writeSync(1, line === null ? NEWLINE : Buffer.concat([line, NEWLINE])); }
            catch (e) { stream.emit('error', e); }
        }
        : function () {
            try { console.log(line === null ? '' : line.toString('utf-8')); }
            catch (e) { stream.emit('error', e); }
        };
    var stream = new Writable({
        write: function (buf, encoding, cb) {
            if (encoding !== 'buffer') {
                buf = Buffer.from(buf, encoding);
            }
            var i = line === null ? 0 : line.length;
            line = i === 0 ? buf : Buffer.concat([line, buf]);
            for (; i < line.length; i++) {
                if (line[i] === 10 /* \n */) {
                    var next = line.slice(i + 1);
                    line = line.slice(0, i);
                    flush();
                    i = 0;
                    line = next;
                };
            }
            cb();
        }
    });
    stream.on('finish', flush);
    return stream;
};
