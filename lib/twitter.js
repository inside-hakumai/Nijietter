let Twitter = require('twitter');
require('dotenv').config();
let EventEmitter = require('events').EventEmitter;

class TwitterStream {

   constructor(token=null, token_secret=null) {
      this.client = new Twitter({
         consumer_key: process.env.TWITTER_CONSUMER_KEY,
         consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
         access_token_key: token || process.env.TWITTER_ACCESS_TOKEN,
         access_token_secret: token_secret || process.env.TWITTER_ACCESS_TOKEN_SECRET
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

   get user_name() {
      if(this.status_json['retweeted_status']){
         return this.status_json['retweeted_status']['user']['name'];
      } else {
         return this.status_json['user']['name'];
      }
   }

   get user_screen_name() {
      if(this.status_json['retweeted_status']){
         return this.status_json['retweeted_status']['user']['screen_name'];
      } else {
         return this.status_json['user']['screen_name'];
      }
   }

   get tweet_time() {
      if(this.status_json['retweeted_status']){
         return new Date(this.status_json['retweeted_status']['created_at']);
      } else {
         return new Date(this.status_json['created_at']);
      }
   }

   get tweet_id() {
      if(this.status_json['retweeted_status']){
         return this.status_json['retweeted_status']['id_str']
      } else {
         return this.status_json['id_str']
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
