module.exports = {

  'app-name' : 'spentable',

  'slack-sentry-bot-id' : 'BOT_ID_HERE',
  'slack-app-channel' : 'SLACK_APP_CHANNEL_HERE',

  'sentry-group-slug' : 'GROUP_SLUG_HERE', //e.g. oursky
  'sentry-app-slug' : 'APP_SLUG_HERE', // e.g. spentable

  'cache-config' : {
    'container' : 'tmp',
    'dSYM' : 'dsym'
  },

  'secret': {
    'slack-token' : 'SLACK_TOKEN_HERE',
    'sentry-id' : 'SENTRY_ID_HERE', //getsentry@example.com
    'sentry-password' : 'PASSWORD_HERE'
  }

};
