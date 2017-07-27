let Twitter = require('twitter');
require('dotenv').config();
let EventEmitter = require('events').EventEmitter;

class TwitterStream {

   constructor() {
      this.client = new Twitter({
         consumer_key: process.env.TWITTER_CONSUMER_KEY,
         consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
         access_token_key: process.env.TWITTER_ACCESS_TOKEN,
         access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
      });
   }

   stream(listener){
      let ev = new EventEmitter();
      ev.on('status', listener);
      this.client.stream('user', {}, function (stream) {
               stream.on('data', function (event) {
                  return ev.emit('status', event);
               });

               stream.on('error', function (error) {
                  throw error;
               });
            });
   }
}

module.exports = TwitterStream;
