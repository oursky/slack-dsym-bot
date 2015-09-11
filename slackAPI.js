var httpsRequest = require('./httpsRequest.js');
var qs = require('querystring');

module.exports = function(token) {
  return {

    call: function (func, params, callback) {

      params = params || {};
      params['token'] = token;

      httpsRequest({
        host: 'slack.com',
        path: '/api/'+func+'?'+qs.stringify(params)
      }, function (cb) {
        return function (result, response){
          cb(result);
        }
      }(callback));

    }

  };
}
