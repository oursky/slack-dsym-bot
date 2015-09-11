var https = require('https');

module.exports = function(options, callback){
  var cb = function(res){
    var str = '';
    res.on('data', function(chunk) { str += chunk; });
    res.on('end', function() { callback(str, res); } );
  };
  https.request(options, cb).end();
};
