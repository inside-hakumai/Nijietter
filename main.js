"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');
let Logger = require(__dirname + '/lib/logger.js');
let Store = require(__dirname + '/lib/file_store.js');
let SlackBot = require(__dirname + '/lib/slack_bot.js');
let Database = require(__dirname + '/lib/sqlite.js');

let logger = new Logger('main');
let store = new Store(__dirname + '/store/');
let db = new Database(__dirname + '/store/data.db');

let bot = new SlackBot();
bot.addEventOnReaction(function(_bot, event){
   let is_nijie;
   if (event['reaction'] === '+1') {
      is_nijie = true;
   } else if (event['reaction'] === '-1') {
      is_nijie = false;
   } else {
      is_nijie = null;
   }
   db.updateNijieBool(event['item']['file'], is_nijie);
});

logger.debug('Start twitter streaming');
new TwitterStream().stream(function(status){
   logger.raiseHierLevel('debug');
   logger.debug(`Tweet time:        ${status.tweet_time.toString()}`);
   logger.debug(`Tweet ID:          ${status.tweet_id}`);
   logger.debug(`Tweet head:        ${status.tweet_text.slice(0, 40).replace(/(?:\r\n|\r|\n)/g, ' ')}...`);
   if(status.media){
      let media_ids = status.media.map(function(tw_media){
         return tw_media.media_id_str
      }).join(', ');
      logger.debug(`Attached image ID: ${media_ids}`);
      status.media.forEach(function(tw_media){
         logger.raiseHierLevel('debug');
         logger.debug(`[Media: ${tw_media.media_id_str}]`);
         logger.debug(`File URL: ${tw_media.media_url}`);
         store.save_image(tw_media.media_id_str, tw_media.media_url, function(filePath){
            bot.upload_image(filePath, status, tw_media, function(mediaID, slackFileID, slackPostTs, userID, tweetText){
               db.insert_image(mediaID, slackFileID, slackPostTs, userID);
               db.insert_tweet(mediaID, tweetText);
            });
         });
         logger.dropHierLevel('debug');
      });
   } else {
      logger.debug(`Attached image ID: No media`);
   }
   logger.dropHierLevel('debug');
});