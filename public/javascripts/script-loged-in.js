"use strict";

let grid = new Minigrid({
   container: '.cards',
   item: '.card',
   gutter: 6
});
grid.mount();

var socket = io.connect("http://localhost:3000");

socket.on('news', function (data) {
   console.log(data);
   socket.emit('my other event', { my: 'data' });
});

socket.on('new_image', function(path) {
   $('.cards').append(`<div class="card"><img src="${path.toString()}"></div>`);
   console.log(path);
});

