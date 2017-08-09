"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');
let Logger        = require(__dirname + '/lib/logger.js');
let Store         = require(__dirname + '/lib/file_store.js');
let SlackBot      = require(__dirname + '/lib/slack_bot.js');
let Database      = require(__dirname + '/lib/sqlite.js');
let LModel        = require(__dirname + '/lib/learning.js');
let EventEmittor  = require('events');

let logger        = new Logger('main');
let store         = new Store(__dirname + '/store/');
let db            = new Database(__dirname + '/store/data.db');

process.on('unhandledRejection', console.dir);

let prepare_bot = new Promise((resolve) => {
   let bot = new SlackBot();
   bot.addEventOnReaction(function (_bot, event) {
      let is_nijie;
      if (event['reaction'] === '+1') {
         is_nijie = true;
      } else if (event['reaction'] === '-1') {
         is_nijie = false;
      } else {
         return;
      }
      db.updateNijieBool(event['item']['file'], is_nijie);
   });
   bot.addEventOnReactionRemoved(function (_bot, event) {
      if (event['reaction'] === '+1' || event['reaction'] === '-1') {
         db.updateNijieBool(event['item']['file'], null);
      }
   });

   resolve(bot);
}).catch((error) => { throw error; });

let prepare_leaner = new Promise((resolve) => {
   let l_model  = new LModel('./store/data.db');
   l_model.ready().then(function(){
      resolve(l_model);
   })
}).catch((error) => { throw error; });

Promise.all([prepare_bot, prepare_leaner]).then(([bot, l_model]) => {
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
            store.save_image(tw_media.media_id_str, tw_media.media_url)
               .then(function(file_path) {
                  return new Promise((resolve) => {
                     let user_id = status.user_screen_name;
                     let text = status.tweet_text;
                     l_model.predict(user_id, text).then(function(result){
                        resolve([file_path, result]);
                     });
                  });
               }).then(function(data_arr) {
                  let file_path = data_arr[0];
                  let prediction = data_arr[1];
                  return bot.upload_image(file_path, status, tw_media, prediction);
               }).then(function(data_arr) {
                  return new Promise(function() {
                     let mediaID = data_arr[0];
                     let slackFileID = data_arr[1];
                     let slackPostTs = data_arr[2];
                     let userID = data_arr[3];
                     let tweetText = data_arr[4];
                     db.insert_image(mediaID, slackFileID, slackPostTs, userID);
                     db.insert_tweet(mediaID, tweetText);
                  }).catch((error) => { throw error; });
               }).then(function(){
                  logger.dropHierLevel('debug');
               });
         });
      } else {
         logger.debug(`Attached image ID: No media`);
      }
      logger.dropHierLevel('debug');
   });
}).catch((error) => { throw error; });