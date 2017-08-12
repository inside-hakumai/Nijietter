"use strict";

const Database = require('../sqlite.js');
const Logger   = require('../logger.js');

const db     = new Database(__dirname + '/../../store/data.db');
const logger = new Logger('app_sqlite');

process.on('message', (m) => {

   switch (m['type']) {
      case 'update_bool':
         const data = m['data'];
         const media_id = data['media_id'];
         const bool = (data['bool'] === undefined) ? null : data['bool'];

         if (typeof(media_id) !== "string") {
            throw new TypeError(`Invalid media_id type: ${typeof(media_id)}`);
         }

         logger.debug(`Update database: ${media_id} -> ${bool}`);
         db.update_nijie_bool_from_mediaid(data['media_id'], bool);
         break;

      default:
         throw new Error(`Unrecognized message type: ${m.toString()}`);
         break;
   }
});
