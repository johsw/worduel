$(document).ready(function() {
  socket = io.connect('http://localhost:8080');
  user = '';
  
  $(document).bind('worduel.login', function(e, data) {
    //$.cookie('worduelUser', data.id);
    $('#contents').worduel('showMenu', data.users);
  });
  socket.on('startRound', function (game) {
    $('#contents').worduel('startRound', game);
  });
  socket.on('roundStatus', function (game) {
    console.log(game);
    $('#contents').worduel('roundStatus', game);
  });
  socket.on('endGame', function (game) {
    $('#contents').worduel('endGame', game);
  });
  
  if($.cookie('worduelUser') === null) {
    $('#contents').worduel('loginForm');
  } else {
    
    socket.emit('getUserStatus', $.cookie('worduelUser'));
    //worduel.initMenu();
  }
  
    
});
