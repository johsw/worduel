$(document).ready(function() {
  socket = io.connect('http://worduel.johanneswehner.com', {port:843});
  user = '';

  $(document).bind('worduel.login', function(e, data) {
    //$.cookie('worduelUser', data.id);
    $('#contents').worduel('showMenu', data.users);
  });
  socket.on('startRound', function (game) {
    $('#contents').worduel('startRound', game);
  });
  socket.on('roundStatus', function (game) {
    $('#contents').worduel('roundStatus', game);
  });
  socket.on('endGame', function (game, users) {
    $('#contents').worduel('endGame', game, users);
  });

  $('#contents').worduel('loginForm');
    //if($.cookie('worduelUser') === null) {
  /*} else {

    socket.emit('getUserStatus', $.cookie('worduelUser'));
    //worduel.initMenu();
  }
  */

});
