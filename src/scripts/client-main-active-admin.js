"use strict";
require('dotenv').config();
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
   $(window).on('resize', () => {
      adjust_grid_margin();
   });
   adjust_grid_margin();

   $('input[name="false-visible"]').change(function(){
      if ($(this).is(':checked')) {
         console.debug('active: false-visible');
         $('.grid').addClass('false-visible');
         pckry.layout();
      } else {
         $('.grid').removeClass('false-visible');
         console.debug('inactive: false-visible');
         pckry.layout();
      }
   });

   $('#link-logout').on('click', () => {
      socket.emit('logout');
   });
});

let socket = io.connect(process.env.DEPLOY_URL);

socket.on('news', function (data) {
   socket.emit('my other event', { my: 'data' });
});

socket.on('new_image', function(data) {
   let image_class;
   if (data['prediction'] === 1) {
      image_class = 'nijie-true';
   } else if (data['prediction'] === 0) {
      image_class = 'nijie-false';
   } else {
      throw new Error(`Invalid prediction data: ${data['prediction']}`);
   }
   let _image = new Image();
   _image.src = data['path'];
   _image.onload = () => {
      let new_elem = document.createElement('div');
      new_elem.className = 'grid-item ' + image_class;
      new_elem.innerHTML = `<a href="${data['url'].toString()}" target="_blank"><img data-media-id="${data['media_id']}" src="${data['path'].toString()}"></a>`;
      $('.grid').prepend(new_elem);
      pckry.prepended(new_elem);
      console.log(data['path']);
      pckry.layout();
   };
});

socket.on('restore', function(data) {
   console.log(data);
   data.reverse();

   for (let i = 0 ; i < data.length; i++){
      let image_class;
      if (data[i]['prediction'] === 1) {
         image_class = 'nijie-true';
      } else if (data[i]['prediction'] === 0) {
         image_class = 'nijie-false';
      } else {
         throw new Error(`Invalid prediction data: ${data['prediction']}`);
      }
      let _image = new Image();
      _image.src = data[i]['path'];
      _image.onload = () => {
         let new_elem = document.createElement('div');
         new_elem.className = 'grid-item ' + image_class;
         new_elem.innerHTML = `<a href="${data[i]['url'].toString()}" target="_blank"><img data-media-id="${data[i]['media_id']}" src="${data[i]['path'].toString()}"></a>`;
         $('.grid').prepend(new_elem);
         pckry.prepended(new_elem);
         pckry.layout();
      };
   }
});

socket.on('connect', function(_err) {
   $('.nav-status-view').addClass('connect').removeClass('error');
});

socket.on('connect_error', function(_err) {
   $('.nav-status-view').addClass('error').removeClass('connect');
});

socket.on('session_broken', function() {
   location.reload();
});

function adjust_grid_margin(){
   let window_width = $(window).width();
   let row_image_num = Math.floor((window_width + 10) / (IMAGE_WIDTH + 10));
   $('main').width(row_image_num * (IMAGE_WIDTH + 10) - 10);
}


$(window).keydown(function(e){
   let hover_elems = $(':hover');
   let media_id = $(hover_elems[hover_elems.length - 1]).attr('data-media-id');

   if (media_id) {

      if (e.keyCode === 84) { // 'T'
         console.debug(`Media: ${media_id} --> true`);
         socket.emit('image_bool', {
            media_id: media_id,
            bool: true
         });
      } else if (e.keyCode === 70) { // 'F'
         console.debug(`Media: ${media_id} --> false`);
         socket.emit('image_bool', {
            media_id: media_id,
            bool: false
         });
      } else if (e.keyCode === 78) { // 'N'
         console.debug(`Media: ${media_id} --> undefined`);
         socket.emit('image_bool', {
            media_id: media_id,
            bool: undefined
         });
      }
   }
});