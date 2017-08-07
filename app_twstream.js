"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');
let Logger = require(__dirname + '/lib/logger.js');
let Store = require(__dirname + '/lib/file_store.js');

let logger = new Logger('app_twstream');
let store = new Store(__dirname + '/store/');
var socket_id;
var maxium_image_num = 20;
var stock_images = [];

process.send({ type: 'ready' });

process.on('message', (data) => {

   switch (data['type']) {
      case 'initialize':
         socket_id = data['data']['socket_id'];
         let token = data['data']['token'];
         let token_secret = data['data']['token_secret'];

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
                  store.save_image(tw_media.media_id_str, tw_media.media_url).then(function (result) {
                     update_stock_images(result['file_path']);
                     process.send({
                        type: 'file_path',
                        data: {
                           socket_id: socket_id,
                           path: result['file_path']
                        }
                     });
                  });
               });
            } else {
               logger.debug(`Attached image ID: No media`);
            }
            logger.dropHierLevel('debug');
         });
         break;

      case 'update_socket':
         let previous_socket_id = socket_id;
         socket_id = data['data']['socket_id'];
         logger.debug(`Update socket: ${previous_socket_id} -> ${socket_id}`);
         process.send({
            type: 'restore',
            data: {
               socket_id: socket_id,
               images: stock_images
            }
         });
         break;

      default:
         throw new Error(`Unrecognized message type: ${m.toString()}`);
         break;
   }
});

function update_stock_images(file_path){
   stock_images.unshift(file_path);
   if (stock_images.length > maxium_image_num) {
      stock_images.pop();
   }
}