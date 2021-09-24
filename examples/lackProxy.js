var lack = require('lack-proxy');


module.exports = function(){
  lack.proxy({
    host: '127.0.0.1',
    port: '8899',
    headers: {
      'x-whistle-policy': 'intercept',
    },
  });
}