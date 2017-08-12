"use strict";

const Logger        = require(__dirname + '/../logger.js');
const LModel        = require(__dirname + '/../learning.js');

const logger = new Logger('app_estimator');

process.on('unhandledRejection', console.dir);

logger.debug('Start to prepare learning model...');

const prepare_leaner = new Promise((resolve, reject) => {
   const time_limit = setTimeout( () => {
      reject(new Error('Preparing estimator timed out'));
      }, 20000);
   const l_model  = new LModel('./store/data.db');
   l_model.ready().then(() => {
      clearTimeout(time_limit);
      resolve(l_model);
   });
}).catch((error) => { throw error; });

prepare_leaner.then((l_model) => {
   logger.debug('Learning model is ready');

   process.on('message', (m) => {
      switch (m['type']) {
         case 'prediction_request':
            logger.debug(`New prediction request received from socket: ${m['data']['socket_id']}`);

            const data = m['data'];
            const socket_id = data['socket_id'];
            const media_id = data['media_id'];
            const user = data['user'];
            const text = data['text'];

            l_model.predict(user, text).then((prediction) => {
               logger.debug(`Return prediction to app: socket_id=${socket_id}, media_id=${media_id}, prediction=${prediction}`);
               process.send({
                  type: 'prediction_result',
                  data: {
                     socket_id: socket_id,
                     media_id: media_id,
                     result: prediction,
                  }
               });
            });
            break;

         default:
            throw new Error(`Unrecognized message type: ${m.toString()}`);
            break;
      }
   });

   process.send({
      type: "ready"
   });

}).catch((error) => { throw error; });