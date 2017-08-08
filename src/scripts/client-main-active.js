"use strict";

import '../css/style.scss';

let $ = require('jquery');
let Packery = require('packery');
const IMAGE_WIDTH = 150;

let container = document.querySelector('.grid');
let pckry = new Packery(container, {
   itemSelector: '.grid-item',
   gutter: 10,
   transitionDuration: '0.3s'
});

$(() => {
   $(window).on('load resize', () => {
      let window_width = $(window).width();
      let row_image_num = Math.floor((window_width + 10) / (IMAGE_WIDTH + 10));
      $('main').width(row_image_num * (IMAGE_WIDTH + 10) - 10);
   });
});

let socket = io.connect("http://localhost:3000");

socket.on('news', function (data) {
   console.log(data);
   socket.emit('my other event', { my: 'data' });
});

socket.on('new_image', function(data) {
   let _image = new Image();
   _image.src = data['path'];
   _image.onload = () => {
      let new_elem = document.createElement('div');
      new_elem.className = 'grid-item';
      new_elem.innerHTML = `<a href="${data['url'].toString()}" target="_blank"><img src="${data['path'].toString()}"></a>`;
      $('.grid').prepend(new_elem);
      pckry.prepended(new_elem);
      console.log(data['path']);
      pckry.layout();
   };
});

socket.on('restore', function(data) {
   console.log(data);

   for (let i = 0 ; i < data.length; i++){
      let _image = new Image();
      _image.src = data[i]['path'];
      _image.onload = () => {
         let new_elem = document.createElement('div');
         new_elem.className = 'grid-item';
         new_elem.innerHTML = `<a href="${data[i]['url'].toString()}" target="_blank"><img src="${data[i]['path'].toString()}"></a>`;
         $('.grid').prepend(new_elem);
         pckry.prepended(new_elem);
         pckry.layout();
      };
   }
});

