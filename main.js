"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');
let Logger = require(__dirname + '/lib/logger.js');

let logger = new Logger();

logger.debug('Start twitter streaming');
new TwitterStream().stream(function(status){
   logger.raiseHierLevel('debug');
   logger.debug(`Tweet time:        ${status.tweet_time.toString()}`);
   logger.debug(`Tweet ID:          ${status.tweet_id}`);
   logger.debug(`Tweet head:        ${status.tweet_text.slice(0, 40).replace('\n', ' ')}...`);
   if(status.media){
      let media_ids = status.media.map(function(tw_media){
         return tw_media.media_id_str
      }).join(', ');
      logger.debug(`Attached image ID: ${media_ids}`);
      status.media.forEach(function(tw_media){
         logger.raiseHierLevel('debug');
         logger.debug(`[Media: ${tw_media.media_id_str}]`);
         logger.dropHierLevel('debug');
      });
   } else {
      logger.debug(`Attached image ID: No media`);
   }
   logger.dropHierLevel('debug');
});