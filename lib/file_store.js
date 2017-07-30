'use strict';

let fs = require('fs');
let path = require('path');
let http = require('http');
let Logger = require(__dirname + '/logger.js');

let logger_fs = new Logger('file_store');

class Store {

   constructor(dir_path) {
      this.store_root = dir_path;
      this.store_images_path = path.join(this.store_root, 'images');
      this.store_sym_date_path = path.join(this.store_root, 'sym_date');
      this.store_sym_user_path = path.join(this.store_root, 'sym_user');
   }

   save_image(file_id, img_url) {
      return new Promise((resolve) => {
         logger_fs.raiseHierLevel('debug');
         logger_fs.debug(`Image ID:     ${file_id}`);

         let alreadySaved = this.imageAlreadySaved(file_id);
         logger_fs.debug(`AlreadySaved: ${alreadySaved}`);

         if (alreadySaved) {
            logger_fs.debug(`This image is already saved`);
            logger_fs.dropHierLevel('debug');
            resolve();
         } else {
            let filePath = path.join(this.store_images_path, file_id.slice(0, 5), file_id + ".jpg");
            if (!fs.existsSync(path.dirname(filePath))) {
               fs.mkdirSync(path.dirname(filePath));
            }

            logger_fs.debug(`Image URL:    ${img_url}`);
            logger_fs.debug(`Save Path:    ${filePath}`);
            logger_fs.dropHierLevel('debug');

            let fileStream = fs.createWriteStream(filePath);
            let request = http.get(img_url, function (response) {
               response.pipe(fileStream);
               response.on('end', function () {
                  fileStream.close();
                  resolve(filePath);
               });
            });
            request.on('error', function (err) {
               console.log('Error: ', err);
            });
            return true;
         }
      }).catch((error) => {
         throw error;
      });
   }

   imageAlreadySaved(fileID){
      let filePath = path.join(this.store_images_path, fileID.slice(0, 5), fileID + ".jpg");
      try {
         fs.accessSync(filePath);
      } catch(e) {
         if (e['code'] === 'ENOENT') {
            return false;
         } else {
            throw e;
         }
      }
      return true;
   }
}

module.exports = Store;
