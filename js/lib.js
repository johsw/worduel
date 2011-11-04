(function( $ ){
  
  var methods = {
    loginForm : function() {
      this.html('<form id="login"><input type="text" name="name" value="" id="name" placeholder="Type name..." required="required"><br /><div id="response"></div><input class="enter" type="submit" name="message" value="Play!" id="submit-name"></form>');
      $('#submit-name').click(function(){
        name = $('input#name').val();
        if (name.length === 0) {
          $('#response').text('Type a name...');
        } else if (name.length < 3) { 
          $('#response').text('Your name must be at least 3 chars.');
        } else {
          randomString = generateRandomString();
          socket.emit('login', name, randomString);
          socket.on('loginResponse', function (response) {
            if(response.loggedIn && response.id ===  randomString) {
              
              $(document).trigger("worduel.login", response);
            } else {
              $('#response').html(response.text);
            }
          });
        }
        return false;
      });
    },
    showMenu : function(users) {  
      $('form#login').remove();
      $('#contents').hide();
      socket.on('updateMenu', function (response) {
        getMenuContents(response.users);
      });
      menu = '<h2>Duellists</h2><ul id="players">';
      menu += '</ul>';
      $('#contents').html(menu).show('fast', function(){
        getMenuContents(users);
      });
    },
    startGame : function( ) { },
  };
  
  $.fn.worduel = function(method) {  


    // Method calling logic
     if ( methods[method] ) {
       return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
     } else if ( typeof method === 'object' || ! method ) {
       return methods.init.apply( this, arguments );
     } else {
       $.error( 'Method ' +  method + ' does not exist on jQuery.worduel' );
     }    


  };
    
})( jQuery );


function generateRandomString() {
  string = '';
  for(n=0; n<=28; n++) {
    if(Math.round(Math.random()) === 1) {
      string += String.fromCharCode(Math.round(9 * Math.random()) + 48);
    } else {
      string += String.fromCharCode(Math.round(25 * Math.random()) + 65);
    }
  }
  return string;
}



function getMenuContents(users) {
  count = 0;
  menu = '';
  for(key in users) {
    if(key != name) { 
      count++;
      menu += '<li class="player">';
      menu += '<div class="player-name">'+ key +'</div><div class="controls">';
      switch (users[key].status) {
        case 'available':
          menu += '<span class="player-status"><a href="#" id="player-'+ key +'" class="invite-player">Invite</a></span>';
          break;
        case 'invited':
          menu += '<span class="player-status">Invited</span>';
          break;
        case 'inviting':
          menu += '<span class="player-status">Inviting</span>';            
          break;
        case 'inGame':
          menu += '<span class="player-status">In game</span>';
          break;
      }
      menu += '</div>';
      menu += '</li>';
    }
  }
  if(count === 0) {
     menu += '<li>No one else online!</li>';
  }
  $('ul#players').html(menu);
  $('.invite-player').click(function(){
    player = $(this).attr('id');
    elements = player.split('-');
    socket.emit('invite', elements[1]);
    buildWaitScreen(elements[1]);
  });
}
/*
$(document).ready(function() {  
  

  function loginForm() {

    
  }
  
  
  // start of main code
  function gameMenu(){

  };

});*/