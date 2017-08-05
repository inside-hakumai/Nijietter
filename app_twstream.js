"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');
let Logger = require(__dirname + '/lib/logger.js');
let Store = require(__dirname + '/lib/file_store.js');

let logger = new Logger('app_twstream');
let store = new Store(__dirname + '/store/');

process.send({ type: 'ready' });

process.on('message', (m) => {

   let token = m['token'];
   let token_secret = m['token_secret'];

   new TwitterStream(token, token_secret).stream(function (status) {
      logger.raiseHierLevel('debug');
      logger.debug(`Tweet time:        ${status.tweet_time.toString()}`);
      logger.debug(`Tweet ID:          ${status.tweet_id}`);
      logger.debug(`Tweet head:        ${status.tweet_text.slice(0, 40).replace(/(?:\r\n|\r|\n)/g, ' ')}...`);

      if (status.media) {
         let media_ids = status.media.map(function (tw_media) {
            return tw_media.media_id_str
         }).join(', ');
         logger.debug(`Attached image ID: ${media_ids}`);
         status.media.forEach(function (tw_media) {
            logger.raiseHierLevel('debug');
            logger.debug(`[Media: ${tw_media.media_id_str}]`);
            logger.debug(`File URL: ${tw_media.media_url}`);
            logger.dropHierLevel('debug');
            store.save_image(tw_media.media_id_str, tw_media.media_url).then(function (file_path) {
               process.send({
                  type: 'file_path',
                  data: file_path
               });
            });
         });
      } else {
         logger.debug(`Attached image ID: No media`);
      }
      logger.dropHierLevel('debug');
   });
});