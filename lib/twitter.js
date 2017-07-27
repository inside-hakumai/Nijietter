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
                  return ev.emit('status', new TweetStatus(event));
               });

               stream.on('error', function (error) {
                  throw error;
               });
            });
   }
}

class TweetStatus {
   constructor(status_json){
      this.status_json = status_json;
   }

   get json(){
      return this.status_json;
   }

   get tweet_id() {
      if(this.status_json['retweeted_status']){
         return this.status_json['retweeted_status']['id']
      } else {
         return this.status_json['id']
      }
   }

   get tweet_text() {
      if(this.status_json['retweeted_status']){
         return this.status_json['retweeted_status']['text']
      } else {
         return this.status_json['text']
      }
   }

   get media(){
      if(this.status_json['extended_entities']) {
         return this.status_json['extended_entities']['media'].map(function(media){
            return new TweetMedia(media);
         });
      } else {
         return null;
      }
   }
}

class TweetMedia {
   constructor(media_json){
      this.media_json = media_json;
   }

   get media_id_str(){
      return this.media_json['id_str']
   }

   get media_url(){
      return this.media_json['media_url']
   }
}

module.exports = TwitterStream;
