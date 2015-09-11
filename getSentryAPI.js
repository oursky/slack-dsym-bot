var httpsRequest = require('./httpsRequest.js');

module.exports = function(username, password, group_slug, app_slug) {
  return {

    getStackTrace: function (groupId, callback) {
      // login getSentry for sentrysid
      httpsRequest({
        host: 'app.getsentry.com',
        path: '/api/0/auth/',
        auth: username + ':' + password,
        method: 'POST'
      }, function (gId, cb) {
        return function (authResult, authResponse){
          authResult = JSON.parse(authResult);
          for (var i = 0; i < authResponse['headers']['set-cookie'].length; i++) {
            var cookie = authResponse['headers']['set-cookie'][i];
            var position = cookie.indexOf('sentrysid=');
            if (position !== -1){

              var sid = cookie.substring(position + 'sentrysid='.length + 1, cookie.indexOf('";'));
              console.log('gId: ' + gId);
              console.log('sid: ' + sid);

              // use the sentryid to get stacktrace
              httpsRequest({
                host: 'app.getsentry.com',
                path: '/'+group_slug+'/'+app_slug+'/group/'+gId+'/events/latest/json/',
                headers: {
                  'Cookie' : 'sentrysid=' + sid
                }
              }, function(cb1) {
                return function (result, response) {
                  cb1(result);
                };
              }(cb));
            }
          }
        };
      }(groupId, callback));
    },
  };
}