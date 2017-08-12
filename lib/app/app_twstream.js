"use strict";

const TwitterStream = require(__dirname + '/../twitter.js');
const Logger        = require(__dirname + '/../logger.js');
const Store         = require(__dirname + '/../file_store.js');
const Database      = require(__dirname + '/../sqlite.js');

const logger            = new Logger('app_twstream');
const store             = new Store(__dirname + '/../../store/');
const db                = new Database(__dirname + '/../../store/data.db');
const MAXIMUM_IMAGE_NUM = 20;
const stock_images      = [];
let socket_id;

process.on('message', (data) => {

   switch (data['type']) {
      case 'initialize':
         socket_id = data['data']['socket_id'];
         const token = data['data']['token'];
         const token_secret = data['data']['token_secret'];

         new TwitterStream(token, token_secret).stream((status) => {
            logger.raiseHierLevel('debug');
            logger.debug(`Tweet time:        ${status.tweet_time.toString()}`);
            logger.debug(`Tweet ID:          ${status.tweet_id}`);
            logger.debug(`Tweet head:        ${status.tweet_text.slice(0, 40).replace(/(?:\r\n|\r|\n)/g, ' ')}...`);

            if (status.media) {
               const media_ids = status.media.map((tw_media) => {
                  return tw_media.media_id_str
               }).join(', ');
               logger.debug(`Attached image ID: ${media_ids}`);

               status.media.forEach((tw_media) => {
                  logger.raiseHierLevel('debug');
                  logger.debug(`[Media: ${tw_media.media_id_str}]`);
                  logger.debug(`File URL: ${tw_media.media_url}`);
                  logger.dropHierLevel('debug');

                  store.save_image(tw_media.media_id_str, tw_media.media_url).then((result) => {
                     db.insert_image(tw_media.media_id_str, null, null, status.user_screen_name);
                     db.insert_tweet(tw_media.media_id_str, status.tweet_text);
                     const url = `https://twitter.com/${status.user_screen_name}/status/${status.tweet_id}`;
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
                  });
               });
            } else {
               logger.debug(`Attached image ID: No media`);
            }
            logger.dropHierLevel('debug');
         });
         break;

      case 'update_socket':
         const previous_socket_id = socket_id;
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

process.once('SIGINT', () => {
   logger.debug(`[${socket_id}] Streaming process is killed`);
   process.exit(0);
});

process.send({ type: 'ready' });

function update_prediction(media_id, prediction) {
   for (let i = 0; i < stock_images.length; i++) {
      if (stock_images[i]['media_id'] === media_id){
         stock_images[i]['prediction'] = prediction;
         return true;
      }
   }
   return false;
}

function update_stock_images(media_id, file_path, url){
   stock_images.unshift({
      media_id: media_id,
      path: file_path,
      url: url,
      prediction: undefined
   });
   if (stock_images.length > MAXIMUM_IMAGE_NUM) {
      stock_images.pop();
   }
}