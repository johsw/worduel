$(document).ready(function() {
  socket = io.connect('http://localhost:8080');
  user = '';
  
  $(document).bind('worduel.login', function(e, data) {
    //$.cookie('worduelUser', data.id);
    $('#contents').worduel('showMenu', data.users);
  });
  socket.on('startGame', function (game) {
    $('#contents').worduel('startRound', game);
  });
  socket.on('roundStatus', function (game) {
    console.log(game);
    $('#contents').worduel('roundStatus', game);
  });
  
  if($.cookie('worduelUser') === null) {
    $('#contents').worduel('loginForm');
  } else {
    
    socket.emit('getUserStatus', $.cookie('worduelUser'));
    //worduel.initMenu();
  }
  
    
});
