let Twitter = require('twitter');
require('dotenv').config();

class TwitterStream {

   constructor() {
      this.client = new Twitter({
         consumer_key: process.env.TWITTER_CONSUMER_KEY,
         consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
         access_token_key: process.env.TWITTER_ACCESS_TOKEN,
         access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
      });
   }

   stream(){
      // You can also get the stream in a callback if you prefer.
      this.client.stream('user', {}, function (stream) {
               stream.on('data', function (event) {
                  console.log(event && event.text);
               });

               stream.on('error', function (error) {
                  throw error;
               });
            });
   }

}

module.exports = TwitterStream;
