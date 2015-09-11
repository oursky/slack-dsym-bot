var https = require('https');
var WebSocket = require('ws');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var Config = require('./config.js');

var slack = new require('./slackAPI.js')(Config['secret']['slack-token']);
var getSentry = new require('./getSentryAPI.js')(Config['secret']['sentry-id'], Config['secret']['sentry-password'], Config['sentry-group-slug'], Config['sentry-app-slug']);

var tempDownloadedDSYMfile = './' + Config['cache-config']['container'] + '/' + Config['cache-config']['dSYM'];
var tempExtractedDSYMfile = './' + Config['cache-config']['container'] + '/' + Config['app-name'] + '.app.dSYM/Contents/Resources/DWARF/' + Config['app-name'];


var filterAndExtractSlackMessage = function (data, callback) {

  data = JSON.parse(data)
  if (data.subtype === 'bot_message') {
    if (data.bot_id === Config['slack-sentry-bot-id']) {
      console.log(data);
      var fields = data.attachments[0].fields;
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].title.toLowerCase() === 'bundleversion') {

          var bundleVersion = fields[i].value;
          var grouplink = data.attachments[0].title_link;

          var targetString = Config['sentry-app-slug']+'/group/';
          var groupId = grouplink.substring(grouplink.indexOf(targetString) + targetString.length, grouplink.length - 1);

          console.log('groupId: ', groupId);
          callback(groupId, bundleVersion);
        }
      }
    }
  }

}

var downloadDSym = function (name, callback) {

  slack.call('search.files', { query : name }, function (cb){
    return function(result) {
      result = JSON.parse(result);
      if (result['files']['matches'].length == 0){
        return cb('dsym file not found');
      }
      var link = result['files']['matches'][0]['url_download'];
      var file = fs.createWriteStream(path.join(__dirname, tempDownloadedDSYMfile));
      https.get(link, function (fileResponse) {
        fileResponse.pipe(file);
        file.on('finish', function () {
          exec('cd ./'+Config['cache-config']['container']+' && tar -zxvf ./'+Config['cache-config']['dSYM']+' && cd ..', function (err, stdout, stderr) {
            file.close();
            cb();
          });
        });
      });
    };
  }(callback));

}

var extractAddress = function (str) {
  var splits = str.split(' ');
  return [splits[splits.length - 4], splits[splits.length - 1]];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}





console.log('Start listening to slack ws');

slack.call('rtm.start', {}, function (result, response){
  result = JSON.parse(result);
  var ws = new WebSocket(result.url);

  ws.on('open', function () {
    console.log('socket opened');
  })

  ws.on('message', function(data, flags){
    filterAndExtractSlackMessage(data, function (groupId, bundleVersion) {

      getSentry.getStackTrace(groupId, function(bundleVersion) {
        return function (stackResult) {
          stackResult = JSON.parse(stackResult);
          var frames = stackResult['sentry.interfaces.Exception']['values'][0]['stacktrace']['frames'];

          downloadDSym(Config['app-name']+'-'+bundleVersion+'.app.dSYM', function (frames) {
            return function (err) {
              if (err) {
                console.log(err);
                return;
              }

              console.log('downloaded dsym file');

              var lookupAndUpload = function(f, i) {
                if (i > f.length - 1) return;

                var addresses = extractAddress(f[i]['function']);
                exec('./lookup.sh ' + addresses[0] + ' ' + addresses[1] + ' ' + tempExtractedDSYMfile, function(){
                  return function (err, stdout, stderr) {
                    if (err) {
                      console.log(stderr);
                    } else {
                      var badmatch = stdout.match(/0x[0-9A-Fa-f]+ (.+)/g);
                      if (badmatch === null || badmatch === undefined) {
                        slack.call('chat.postMessage', { channel : Config['slack-app-channel'], text : stdout }, function (r, re) {});
                      }
                    }
                    lookupAndUpload(f, i + 1);
                  }
                }());
              };

              lookupAndUpload(frames, 0);

            };
          }(frames));
        };
      }(bundleVersion));

    });

  });
});
