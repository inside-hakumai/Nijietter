"use strict";
let TwitterStream = require(__dirname + '/lib/twitter.js');
let Logger = require(__dirname + '/lib/logger.js');
let Store = require(__dirname + '/lib/file_store.js');

let logger = new Logger('app_twstream');
let store = new Store(__dirname + '/store/');
var socket_id;
var maxium_image_num = 20;
var stock_images = [];
var image_id_head;

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
                     let url = `https://twitter.com/${status.user_screen_name}/status/${status.tweet_id}`;
                     update_stock_images(tw_media.media_id_str, result['file_path'], url);

                     process.send({
                        type: 'send_image',
                        data: {
                           socket_id: socket_id,
                           media_id: tw_media.media_id_str,
                           path: result['file_path'],
                           url: url,
                           user: status.user_screen_name,
                           text: status.tweet_text
                        }
                     });
                     /*
                     estimator.send({
                        type: 'predict',
                        data: {
                           media_id: tw_media.media_id_str,
                           user: status.user_screen_name,
                           text: status.tweet_text
                        }
                     });
                     */
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

      case 'sync_prediction':
         update_prediction(data['data']['media_id'], data['data']['prediction']);
         break;

      default:
         throw new Error(`Unrecognized message type: ${m.toString()}`);
         break;
   }
});

function update_prediction(media_id, prediction) {
   for (let i = 0; i < stock_images.length; i++) {
      if (stock_images[i]['id'] === media_id){
         stock_images[i]['prediction'] = prediction;
         return true;
      }
   }
   return false;
}

function update_stock_images(media_id, file_path, url){
   stock_images.unshift({
      id: media_id,
      path: file_path,
      url: url,
      prediction: undefined
   });
   if (stock_images.length > maxium_image_num) {
      stock_images.pop();
   }
}