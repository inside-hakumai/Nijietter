let sqlite = require('sqlite3');
let Logger = require(__dirname + '/logger.js');

let logger_db = new Logger('sqlite');


class Database {

   constructor(db_path=null){
      let parentThis = this;
      if (!db_path) {
         throw Error('No database path is specified');
      }
      this.database = new sqlite.Database(db_path);
      this.database.serialize(function(){
         parentThis.database.run('CREATE TABLE IF NOT EXISTS image'
            + '(media_id TEXT PRIMARY KEY, '
            + 'slack_file_id TEXT, slack_post_ts TEXT, user_id TEXT, deleted INTEGER default 0)');
         parentThis.database.run('CREATE TABLE IF NOT EXISTS tweet'
            + '(media_id TEXT PRIMARY KEY, '
            + 'tweet_text TEXT)');
         parentThis.database.run('CREATE TABLE IF NOT EXISTS nijie_bool'
            + '(media_id TEXT PRIMARY KEY, '
            + 'is_nijie INTEGER, prediction INTEGER)');
      });
   }

   insert_image(mediaID, slackFileID, slackPostTs, userID) {
      let parentThis = this;
      logger_db.debug(`INSERT into image - ${mediaID}, ${slackFileID}, ${slackPostTs}, ${userID}`);
      this.database.serialize(function () {
         let stmt = parentThis.database.prepare('INSERT INTO image(media_id, slack_file_id, slack_post_ts, user_id) '
            + 'VALUES(?, ?, ?, ?)');
         stmt.run([mediaID, slackFileID, slackPostTs, userID]);
         stmt.finalize();
      });
   }
   insert_tweet(mediaID, text) {
      let parentThis = this;
      logger_db.debug(`INSERT into tweet - ${mediaID}, ${text.replace(/(?:\r\n|\r|\n)/g, ' ')}`);
      this.database.serialize(function () {
         let stmt = parentThis.database.prepare('INSERT INTO tweet(media_id, tweet_text) '
            + 'VALUES(?, ?)');
         stmt.run([mediaID, text]);
         stmt.finalize();
      });
   }

   updateNijieBool(fileID, is_nijie){
      let parentThis = this;
      this.database.serialize(function () {
         parentThis.database.all('SELECT media_id from image WHERE slack_file_id = ?', [fileID], function(err, rows){
            if (err) {
               throw err;
            }
            if (rows.length !== 1) {
               throw Error(`Invalid SELECT returned value: ${rows.toString()}`);
            }
            let mediaID = rows[0]['media_id'];
            logger_db.raiseHierLevel('debug');
            logger_db.debug(`INSERT OR REPLACE nijie_bool - ${mediaID}, ${is_nijie}`);
            let stmt = parentThis.database.prepare('INSERT OR REPLACE INTO nijie_bool(media_id, is_nijie) '
               + 'VALUES(?, ?)');
            stmt.run([mediaID, is_nijie]);
            stmt.finalize();
            logger_db.dropHierLevel('debug');
         });
      });
   }

}

module.exports = Database;
