(function( $ ){
  
  var methods = {
    loginForm : function() {
      this.html('<form id="login"><input type="text" name="name" value="" id="name" placeholder="Type name..." required="required"><br /><div id="response"></div><input class="enter" type="submit" name="message" value="Play!" id="submit-name"></form>');
      $('#submit-name').click(function(){
        user = $('input#name').val();
        if (user.length === 0) {
          $('#response').text('Type a name...');
        } else if (user.length < 3) { 
          $('#response').text('Your name must be at least 3 chars.');
        } else {
          randomString = generateRandomString();
          socket.emit('login', user, randomString);
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
        updateMenu(response.users);
      });
      socket.on('invite', function (inviter) {
        console.log('invited by: '+ inviter);
        buildInvitation(inviter, users); 
      });
      buildMenu(users);
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

function buildMenu(users, message) {
  menu = '<h2>Duellists</h2>';
  
  if(message !== undefined && message.length > 0) {
    menu += '<div id="message">' + message + '</div>';
  }
  menu += '<ul id="players"></ul>';
  $('#contents').html(menu).show('fast', function(){
    updateMenu(users);
  });
}


function updateMenu(users) {
  count = 0;
  menu = '';
  for(key in users) {
    if(key != user) { 
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
    buildWaitScreen(elements[1], users);
  });
}

function buildInvitation(inviter,users) {
  $('#contents').hide();
  invitation = '<div id="invitation">';
  invitation += 'You got an invitation from <em>' + inviter + '</em>. Wanna play?';
  invitation += '<form><input type="submit" value="Yeah!" class="invite-answer" id="yes"><input type="submit" value="Nah.." class="invite-answer" id="no"></form>';
  invitation += '</div>'
 
  $('#contents').html(invitation).show('fast', function(){
    
     socket.on('cancelInvite', function (inviter) {
        
        console.log('cancelled by:' + inviter);
        buildMenu(users, 'Invite got cancelled by <em>' +  inviter + '</em>'); 
      });
    
    $('.invite-answer').click(function(){
      answer = $(this).attr('id');
      console.log(answer);
      if(answer === 'yes') {
        //GAME ON!!
      }
      if(answer === 'no') {
        socket.emit('updateMenu');
        socket.on('updateMenu', function (user) {
          updateMenu(user); 
        });
      }
      return false;
    });
  });
}

function buildWaitScreen(invitee, users) {
  $('#contents').hide();
  html = '<div id="wait-screen">';
  html += 'Wating for reponse from <em>' + invitee + '</em>';
  html += '<form><input class="cancel" type="submit" value="Forget it!" class="wait-screen-cancel" id="cancel"></form>';
  html += '</div>';
  $('#contents').html(html).show('fast', function(){
    $('#cancel').click(function(){
      socket.emit('cancelInvite', invitee);
      buildMenu(users);
      return false;
    }); 
    
    //TODO: invitation accept listener
    
  });
}