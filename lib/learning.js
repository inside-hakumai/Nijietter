"use strict";
let path     = require('path');
let fs       = require('fs');
let Database = require(__dirname + '/sqlite.js');
let SVM      = require('node-svm');
let MeCab    = require('mecab-async');
let Logger   = require(__dirname + '/logger.js');

MeCab.command = "mecab -d /usr/local/lib/mecab/dic/mecab-ipadic-neologd";
let mecab    = new MeCab();
let logger   = new Logger('learning');

class LModel {
   
   constructor(db_path=null, threshold=2, loop=200) {
      this.word_dictionary = null;  // np.array([token, index] [token, index], ... }
      this.word_index2word = null;  // np.array([token, token, token, ... ])
      this.word_score = null;       // np.array([float, float, float ... ])
      this.user_dictionary = null;  // np.array([token, index] [token, index], ... }
      this.user_index2user = null;  // np.array([token, token, token, ... ])
      this.user_score = null;       // np.array([float, float, float ... ])

      this.threshold = threshold;
      this.word_count = [];
      this.user_count = [];
      this.loop = loop;

      this.db_path = db_path;
      this.db = new Database(this.db_path);
      this.estimator = null;
   }

   ready() {
      if (this.db_path === null) {
         throw Error('Database path is not specified');
      }

      let parentThis = this;
      return new Promise(function(resolve){
         parentThis.prepare_vocabulary()
            .then(function () {
               parentThis.initialize();
            }).then(function () {
               parentThis.train();
            }).then(function () {
            resolve();
            });
      });
   }


   prepare_vocabulary() {
      let parentThis = this;

      logger.debug("Preparing vocabulary...");

      // prepare word list
      let word_prep = parentThis.db.get_all_word_appearance().then(function(result){
         return new Promise(function(resolve) {
            let words = result;

            logger.debug(`#Word appearance:           ${words.length}`);

            let word_count = 0;
            let words_unique = [];
            let word_counter = appearance_count(words);
            logger.debug(`#Unique words:              ${Object.keys(word_counter).length}`);

            let excluded_words = 0;
            let word_iterator = Object.keys(word_counter).entries();
            for (let e of word_iterator) {
               let index = e[0];
               let key = e[1];
               let appearances = word_counter[key];

               if (appearances >= parentThis.threshold) {
                  words_unique.push(key);
                  word_count += appearances;
               } else {
                  excluded_words += 1;
               }
            }

            logger.debug(`#Excluded unique words:     ${excluded_words}`);
            logger.debug(`#Remaining unique words:    ${words_unique.length}`);
            logger.debug(`#Remaining word appearance: ${word_count}`);

            let index2word = words_unique;

            let word_dictionary = {};
            let word_unq_iterator = index2word.entries();
            for (let e of word_unq_iterator) {
               let index = e[0];
               let word = e[1];
               word_dictionary[word] = index;
            }

            parentThis.word_count = word_count;
            parentThis.word_dictionary = word_dictionary;
            parentThis.word_index2word = index2word;

            write_json("word_count.json", parentThis.word_count);
            write_json("word_dict.json", parentThis.word_dictionary);
            write_json("index2word.json", parentThis.word_index2word);

            resolve();
         });
      });

      // prepare user list
      let user_prep = parentThis.db.get_all_user_appearance().then(function(result){
         return new Promise(function(resolve) {
            let users = result;

            logger.debug(`#User appearance:           ${users.length}`);

            let user_count = 0;
            let users_unique = [];
            let user_counter = appearance_count(users);
            logger.debug(`#Unique users:              ${user_counter.length}`);

            let excluded_users = 0;
            let user_iterator = Object.keys(user_counter).entries();
            for (let e of user_iterator) {
               let index = e[0];
               let key = e[1];
               let appearances = user_counter[key];

               if (appearances >= parentThis.threshold) {
                  users_unique.push(key);
                  user_count += appearances;
               } else {
                  excluded_users += 1;
               }
            }

            logger.debug(`#Excluded unique users:     ${excluded_users}`);
            logger.debug(`#Remaining unique users:    ${Object.keys(users_unique).length}`);
            logger.debug(`#Remaining user appearance: ${user_count}`);

            let index2user = users_unique;

            let user_dictionary = {};
            let user_unq_iterator = index2user.entries();
            for (let e of user_unq_iterator) {
               let index = e[0];
               let user = e[1];
               user_dictionary[user] = index;
            }

            parentThis.user_count = user_count;
            parentThis.user_dictionary = user_dictionary;
            parentThis.user_index2user = index2user;

            write_json("user_count.json", parentThis.user_count);
            write_json("user_dict.json", parentThis.user_dictionary);
            write_json("index2user.json", parentThis.user_index2user);

            resolve();
         });
      });

      return Promise.all([word_prep, user_prep]);
   }

   initialize() {
      let parentThis = this;

      // calculate word score
      parentThis.word_score = array_zeros(Object.keys(parentThis.word_dictionary).length);
      let init_word_score = parentThis.db.get_bool_and_tweet().then(function (data_word) {
         return new Promise(function (resolve) {
            for (let word_tuple of data_word) {
               let is_nijie;
               if (word_tuple[0] === 1) {
                  is_nijie = true;
               } else if (word_tuple[0] === 0) {
                  is_nijie = false;
               } else {
                  throw Error(`Invalid is_nijie value: ${word_tuple[0]}`);
               }

               let words = word_tuple[1];
               let word_num = words.length;

               if (word_num !== 0) {
                  if (is_nijie) {
                     for (let word of words) {
                        let index = parentThis.word_dictionary[word];
                        if (index !== undefined) {
                           parentThis.word_score[index] += 1 / word_num;
                        }
                     }
                  } else {
                     for (let word of words) {
                        let index = parentThis.word_dictionary[word];
                        if (index !== undefined) {
                           parentThis.word_score[index] -= 1 / word_num;
                        }
                     }
                  }
               }
            }
            let scores = [];
            let word_iterator = parentThis.word_index2word.entries();
            for (let e of word_iterator) {
               let index = e[0];
               let word = e[1];
               let score = parentThis.word_score[index];
               scores.push([word, score]);
            }
            write_json('initial_word_score.json', scores);

            resolve();
         });
      });

      // calculate user score
      parentThis.user_score = array_zeros(Object.keys(parentThis.user_dictionary).length);
      let init_user_score = parentThis.db.get_bool_and_user().then(function(data_user){
         return new Promise(function(resolve){
            for (let user_tuple of data_user) {
               let is_nijie;
               if (user_tuple[0] === 1) {
                  is_nijie = true;
               } else if (user_tuple[0] === 0) {
                  is_nijie = false;
               } else {
                  throw Error(`Invalid is_nijie value: ${user_tuple[0]}`);
               }

               let user = user_tuple[1];
               let user_index = parentThis.user_dictionary[user];
               if (is_nijie) {
                  if (user_index !== undefined) {
                     parentThis.user_score[user_index] += 1
                  }
               } else {
                  if (user_index !== undefined) {
                     parentThis.user_score[user_index] -= 1
                  }
               }
            }
            let user_scores = [];
            let user_iterator = parentThis.user_index2user.entries();
            for (let e of user_iterator) {
               let index = e[0];
               let user = e[1];
               let score = parentThis.user_score[index];
               user_scores.push([user, score]);
            }
            write_json('initial_user_score.json', user_scores);

            resolve();
         });
      });

      return Promise.all([init_word_score, init_user_score]);
   }

   train() {
      let parentThis = this;
      return new Promise(function(resolve){

         parentThis.db.get_bool_user_tweet().then(function(result_data){

            let train_data = [];
            for (let t_data of result_data) {
               let is_nijie = t_data[0];
               let username = t_data[1];
               let words = t_data[2];
               let user_score = parentThis.get_score_from_username(username);
               let tweet_score = parentThis.get_words_score_avg(words);
               if (user_score === undefined) continue;

               train_data.push([[user_score, tweet_score], (is_nijie ? 1 : 0)]);
            }
            write_json('train_data.json', train_data);

            parentThis.estimator = new SVM.CSVC();

            parentThis.estimator.train(train_data).done(function () {
               train_data.forEach(function(ex){
                  // let prediction = parentThis.estimator.predictSync(ex[0]);
                  // console.log('%d XOR %s => %d(%d)', ex[0][0], ex[0][1], prediction, ex[1]);
                  resolve();
               });
            });
         });
      });
   }

   predict(username, tweet) {
      return new Promise((resolve) => {
         let user_score = this.get_score_from_username(username);
         let text = tweet.replace(/(http(s)?)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/g, '');
         let parse_result = mecab.parseSync(text);
         let words = [];
         for (let k = 0; k < parse_result.length; k++) {
            let word = parse_result[k];
            if (word[1] === '名詞' || word[1] === '動詞') {
               words.push(word[0]);
            }
         }
         let tweet_score = this.get_words_score_avg(words);
         let prediction = this.estimator.predictSync([user_score, tweet_score]);

         resolve(prediction);
      }).catch((error) => {
         throw error;
      });
   }

   get_score_from_username(username) {
      let index = this.user_dictionary[username];
      if (index !== undefined) {
         return this.user_score[index];
      } else {
         return undefined;
      }
   }

   get_words_score_avg(words) {
      let score_sum = 0.0;
      let words_num = words.length;
      let avg_score;

      if (words_num !== 0) {
         for (let word of words) {
            let index = this.word_dictionary[word];
            if (index !== undefined) {
               score_sum += this.word_score[index];
            }
         }
         avg_score = score_sum / words_num;
      } else {
         avg_score = 0;
      }
      return avg_score;
   }
}

module.exports = LModel;

function appearance_count(arr){
   let counts = {};
   for(let i = 0; i < arr.length; i++) {
      let key = arr[i];
      counts[key] = (counts[key]) ? counts[key] + 1 : 1;
   }
   return counts;
}

function write_json(file_name, data){
   let file_path = path.join("./log/", file_name);
   if (!fs.existsSync(path.dirname(file_path))) {
      fs.mkdirSync(path.dirname(file_path));
   }
   fs.writeFile(file_path, JSON.stringify(data, null, '    '));

   logger.debug(`Log saved: ${file_path}`);
}

function array_zeros(length){
   if (typeof(length) !== "number"){
      throw TypeError(`Given length value is not number: ${typeof(length)}`);
   }
   let return_arr = new Array(length);
   for(let i = 0; i < length; i++){
      return_arr[i] = 0;
   }
   return return_arr;
}