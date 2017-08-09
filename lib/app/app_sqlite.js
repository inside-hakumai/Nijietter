"use strict";
let Database = require('../sqlite.js');
let Logger   = require('../logger.js');

let db = new Database(__dirname + '/../../store/data.db');
let logger = new Logger('app_sqlite');

process.on('message', (m) => {

   switch (m['type']) {
      case 'update_bool':
         let data = m['data'];
         let media_id = data['media_id'];
         let bool = (data['bool'] === undefined) ? null : data['bool'];

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
