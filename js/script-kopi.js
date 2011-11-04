$(document).ready(function() {


  var name = '';
  var socket; 
  $(window).bind('beforeunload', function() {
    socket.emit('quit', name);
  });
  $('#submit-name').click(function(){
    name = $('input#name').val();
    if (name.length === 0) {
      $('#response').text('Type a name...');
    } else if (name.length < 3) { 
      $('#response').text('Your name must be at least 3 chars.');
    } else {
      socket = io.connect('http://localhost:8080');
      socket.emit('login', name);
      socket.on('loginFail', function (data) {
        $('#response').text(data.text);
      });
      socket.on('menuResponse', function (data) {
        buildMenu(data);
      });
    }
    socket.on('invite', function (user) {
      buildInvitation(user); 
    });
    socket.on('updateMenu', function (user) {
      updateMenu(user); 
    });
    return false;
  });
  
  function buildWaitScreen(user) {
    $('#contents').hide();
    html = '<div id="wait-screen">';
    html += 'Wating for reponse from <em>' + user + '</em>';
    html += '<form><input class="cancel" type="submit" value="Forget it!" class="wait-screen-cancel" id="cancel"></form>';
    html += '</div>';
    $('#contents').html(html).show('fast', function(){
      $('#cancel').click(function(){
        answer = $(this).attr('id');
        console.log(answer);
        return false;
      });
      
    });
    
  }
  
  function buildInvitation(user) {
    $('#contents').hide();
    invitation = '<div id="invitation">';
    invitation += 'You got an invitation from <em>' + user + '</em>. Wanna play?';
    invitation += '<form><input type="submit" value="Yeah!" class="invite-answer" id="yes"><input type="submit" value="Nah.." class="invite-answer" id="no"></form>';
    invitation += '</div>'
   
    $('#contents').html(invitation).show('fast', function(){
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
  function buildMenu(data) {
    $('form#login').remove();
    $('#contents').hide();

    menu = '<h2>Duellists</h2><ul id="players">';
    menu += getMenuContents(data);
    menu += '</ul>';
    $('#contents').html(menu).show('fast', function(){
      $('.invite-player').click(function(){
        player = $(this).attr('id');
        elements = player.split('-');
        socket.emit('invite', elements[1]);
        buildWaitScreen(elements[1]);
      });
      
    });
  }
  function updateMenu(data) {
    $('#contents #players').html(getMenuContents(data));
  
  }
  function getMenuContents(data) {
    count = 0;
    menu = '';
    for(key in data.users) {
      if(key != name) { 
        count++;
        menu += '<li class="player">';
        menu += '<div class="player-name">'+ key +'</div><div class="controls">';
        switch (data.users[key].status) {
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
    return menu;
  }
  
  
});
