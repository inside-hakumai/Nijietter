"use strict";

import '../css/style.css';

let $ = require('jquery');
let Packery = require('packery');

let container = document.querySelector('.grid');
let pckry = new Packery(container, {
   itemSelector: '.grid-item',
   gutter: 10,
   transitionDuration: '0.3s'
});

let socket = io.connect("http://localhost:3000");

socket.on('news', function (data) {
   console.log(data);
   socket.emit('my other event', { my: 'data' });
});

socket.on('new_image', function(path) {
   let _image = new Image();
   _image.src = path;
   _image.onload = () => {
      let new_elem = document.createElement('div');
      new_elem.className = 'grid-item';
      new_elem.innerHTML = `<img src="${path.toString()}">`;
      $('.grid').prepend(new_elem);
      pckry.prepended(new_elem);
      console.log(path);
      pckry.layout();
   };
});

socket.on('restore', function(paths) {
   console.log(paths);

   for (let i = 0 ; i < paths.length; i++){
      let _image = new Image();
      _image.src = paths[i];
      _image.onload = () => {
         let new_elem = document.createElement('div');
         new_elem.className = 'grid-item';
         new_elem.innerHTML = `<img src="${paths[i].toString()}">`;
         $('.grid').prepend(new_elem);
         pckry.prepended(new_elem);
         pckry.layout();
      };
   }
});

