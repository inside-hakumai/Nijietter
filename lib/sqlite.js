let sqlite = require('sqlite3');
let Logger = require(__dirname + '/logger.js');
let MeCab  = require('mecab-async');

MeCab.command = "mecab -d /usr/local/lib/mecab/dic/mecab-ipadic-neologd";
let mecab = new MeCab();
let logger_db = new Logger('sqlite');


class Database {

   constructor(db_path=null){
      let parentThis = this;
      if (!db_path) {
         throw Error('No database path is specified');
      }
      this.database = new sqlite.Database(db_path);
      // noinspection JSUnresolvedFunction
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
      // noinspection JSUnresolvedFunction
      this.database.serialize(function () {
         let stmt = parentThis.database.prepare('INSERT INTO image(media_id, slack_file_id, slack_post_ts, user_id) '
            + 'VALUES(?, ?, ?, ?)');
         stmt.run([mediaID, slackFileID, slackPostTs, userID]);
         // noinspection JSUnresolvedFunction
         stmt.finalize();
      });
   }
   insert_tweet(mediaID, text) {
      let parentThis = this;
      logger_db.debug(`INSERT into tweet - ${mediaID}, ${text.replace(/(?:\r\n|\r|\n)/g, ' ')}`);
      // noinspection JSUnresolvedFunction
      this.database.serialize(function () {
         let stmt = parentThis.database.prepare('INSERT INTO tweet(media_id, tweet_text) '
            + 'VALUES(?, ?)');
         stmt.run([mediaID, text]);
         // noinspection JSUnresolvedFunction
         stmt.finalize();
      });
   }

   updateNijieBool(fileID, is_nijie){
      let parentThis = this;
      // noinspection JSUnresolvedFunction
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
            // noinspection JSUnresolvedFunction
            stmt.finalize();
            logger_db.dropHierLevel('debug');
         });
      });
   }

   get_all_word_appearance(){
      let parentThis = this;
      return new Promise(function(resolve){
         // noinspection JSUnresolvedFunction
         parentThis.database.serialize(function () {
            parentThis.database.all(
               'SELECT tweet_text FROM ' +
               '(SELECT tweet_text, is_nijie FROM tweet ' +
               'INNER JOIN nijie_bool ON nijie_bool.media_id = tweet.media_id) ' +
               'WHERE is_nijie is NOT NULL', function (err, rows) {
                  let words = [];
                  if (err) throw err;
                  for (let i = 0; i < rows.length; i++){
                     let row = rows[i];
                     let text = row['tweet_text'].replace(/(http(s)?)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/g, '');
                     let result = mecab.parseSync(text);
                     for(let k = 0; k < result.length; k++){
                        let word = result[k];
                        if (word[1] === '名詞' || word[1] === '動詞') {
                           words.push(word[0]);
                        }
                     }
                  }
                  resolve(words);
               });
         });
      });
   }

   get_all_user_appearance(){
      let parentThis = this;
      return new Promise(function(resolve){
         parentThis.database.serialize(function(){
            parentThis.database.all(
               "SELECT user_id FROM " +
               "(SELECT user_id, is_nijie FROM image " +
               "INNER JOIN nijie_bool ON nijie_bool.media_id = image.media_id) " +
               "WHERE is_nijie is NOT NULL", function (err, rows) {
                  if (err) throw err;
                  let users = rows.map(function(row){
                     return row['user_id'];
                  });
                  resolve(users);
               });
         });
      });
   }

   get_bool_and_tweet(){
      let parentThis = this;
      return new Promise(function(resolve){
         parentThis.database.serialize(function(){
            parentThis.database.all(
               "SELECT is_nijie, tweet_text FROM " +
               "(SELECT is_nijie, tweet_text FROM tweet " +
               "INNER JOIN nijie_bool on nijie_bool.media_id = tweet.media_id) " +
               "WHERE is_nijie IS NOT NULL", function(err, rows) {
                  let tuples = [];
                  if (err) throw err;
                  for (let i = 0; i < rows.length; i++) {
                     let row = rows[i];
                     let is_nijie = row['is_nijie'];
                     let text = row['tweet_text'].replace(/(http(s)?)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/g, '');
                     let parse_result = mecab.parseSync(text);
                     let words = [];
                     for(let k = 0; k < parse_result.length; k++){
                        let word = parse_result[k];
                        if (word[1] === '名詞' || word[1] === '動詞') {
                           words.push(word[0]);
                        }
                     }
                     tuples.push([is_nijie, words]);
                  }
                  resolve(tuples);
               });
         });
      });
   }

   get_bool_and_user(){
      let parentThis = this;
      return new Promise(function(resolve) {
         parentThis.database.serialize(function () {
            parentThis.database.all(
               "SELECT is_nijie, user_id FROM " +
               "(SELECT user_id, is_nijie FROM image " +
               "INNER JOIN nijie_bool ON nijie_bool.media_id = image.media_id) " +
               "WHERE is_nijie is NOT NULL", function (err, rows) {
                  let tuples = rows.map(function(row){
                     return [row['is_nijie'], row['user_id']];
                  });
                  resolve(tuples);
               });
         });
      });
   }

   get_bool_user_tweet(){
      let parentThis = this;
      return new Promise(function(resolve) {
         parentThis.database.serialize(function(){
            parentThis.database.all(
               "SELECT is_nijie, user_id, tweet_text FROM" +
               "(SELECT is_nijie, user_id, tweet_text FROM image " +
               "INNER JOIN nijie_bool ON nijie_bool.media_id = image.media_id " +
               "INNER JOIN tweet ON tweet.media_id = image.media_id)" +
               "WHERE is_nijie is NOT NULL", function(err, rows) {
                  let tuples = [];
                  if (err) throw err;
                  for (let i = 0; i < rows.length; i++) {
                     let row = rows[i];
                     let is_nijie = row['is_nijie'];
                     let user = row['user_id'];
                     let text = row['tweet_text'].replace(/(http(s)?)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/g, '');
                     let parse_result = mecab.parseSync(text);
                     let words = [];
                     for(let k = 0; k < parse_result.length; k++){
                        let word = parse_result[k];
                        if (word[1] === '名詞' || word[1] === '動詞') {
                           words.push(word[0]);
                        }
                     }
                     tuples.push([is_nijie, user, words]);
                  }
                  resolve(tuples);
               });
         });
      });
   }
}

module.exports = Database;
