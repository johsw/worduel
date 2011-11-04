$(document).ready(function() {
  socket = io.connect('http://localhost:8080');
  name = '';
  
  $(document).bind('worduel.login', function(e, data) {
    $.cookie('worduelUser', data.id);
    $('#contents').worduel('showMenu', data.users);
  });
  
  if($.cookie('worduelUser') === null) {
    $('#contents').worduel('loginForm');
  } else {
    
    socket.emit('getUserStatus', $.cookie('worduelUser'));
    //worduel.initMenu();
  }
  
    
});
