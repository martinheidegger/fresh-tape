'use strict';

var fs = require('fs');
var Writable = require('readable-stream').Writable;

module.exports = function () {
    var line = '';
    var stream = new Writable({
        write: function (buf, encoding, cb) {
            for (var i = 0; i < buf.length; i++) {
                var c = encoding !== 'buffer'
                    ? buf.charAt(i)
                    : String.fromCharCode(buf[i])
                ;
                if (c === '\n') flush();
                else line += c;
            }
            cb();
        }
    });
    stream.on('finish', flush);
    return stream;

    function flush() {
        if (fs.writeSync && /^win/.test(process.platform)) {
            try { fs.writeSync(1, line + '\n'); }
            catch (e) { stream.emit('error', e); }
        } else {
            try { console.log(line); }
            catch (e) { stream.emit('error', e); }
        }
        line = '';
    }
};
