(function( $ ){
  
  var methods = {
    loginForm : function() {
      html = '<form id="login"><input type="text" name="name" value="" id="name" placeholder="Type name..." required="required"><br /><div id="response"></div><input class="enter" type="submit" name="message" value="Play!" id="submit-name"></form>';
      html += '<div id="text"><a id="about" href="#">What\'s this?</a> - <a id="rules" href="#">Rules</a></div>';
      this.html(html);
      $('#submit-name').click(function(){
        
        
        user = $('input#name').val();
        if (user.length === 0) {
          $('#response').text('Type a name...');
        } else if (user.length < 3) { 
          $('#response').text('Your name must be at least 3 chars.');
        } else {
          randomString = $().worduel('generateRandomString');
          socket.emit('login', user, randomString);

          socket.on('loginResponse', function (response) {            
            if(response.loggedIn && response.id ===  randomString) {
              $(document).trigger("worduel.login", response);
              $('form#login').remove();
            } else {
              $('#response').html(response.text);
            }
          });

        }
        
        return false;
      });
    },
    showMenu : function(users) {  
      this.hide();
      element = this;
      socket.on('updateMenu', function (response) {
        element.worduel('updateMenu',response.users);
      });
      socket.on('invite', function (inviter) {
        element.worduel('buildInvitation', inviter, users); 
      });
      this.worduel('buildMenu', users);
    },
    buildMenu : function(users, message) {  
      menu = '<h2>Duellists</h2>';

      if(message !== undefined && message.length > 0) {
        menu += '<div id="message">' + message + '</div>';
      }
      menu += '<ul id="players"></ul>';
      this.html(menu).show('fast', function(){
        $(this).worduel('updateMenu', users);
      });
    },
    updateMenu : function(users) {
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
            case 'in game':
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
      domElement = this;
      this.children('#players').html(menu);
      $('.invite-player').click(function(){
        player = $(this).attr('id');
        elements = player.split('-');
        socket.emit('invite', elements[1]);
        domElement.worduel('buildWaitScreen', elements[1], users);
      });
    },
    startRound : function(game) {
      this.worduel('buildBoard', game);
    },
    roundStatus : function(game) {
      string = '<h2>Round '+ game.round +'</h2>';
      string += '<table id="round-status">';
      string += '<tr class="headers"><th class="player">Player</th><th>Word</th><th>Points</th><th>Total</th></tr>';
      $.each(game.players,function(index, player){
        string += '<tr class="data">';
        string += '<td class="player">' + player + '</td>';
        string += '<td>' + game.rounds[game.round].response[player] + '</td>';
        string += '<td>' + game.rounds[game.round].points[player] + '</td>';
        string += '<td>' + game.points[player] +'</td>';
        string += '</tr>';
      })
      string += '</table>';
      if(game.round != 10) {
        string += '<div id="next-game">The next round will start in a few secs.</div>';
      }
      this.html(string);
    },
    generateRandomString: function() {
      string = '';
      for(n=0; n<=28; n++) {
        if(Math.round(Math.random()) === 1) {
          string += String.fromCharCode(Math.round(9 * Math.random()) + 48);
        } else {
          string += String.fromCharCode(Math.round(25 * Math.random()) + 65);
        }
      }
      return string;
    },
    buildInvitation: function(inviter,users) {
      $('#contents').hide();
      invitation = '<div id="invitation">';
      invitation += 'You got an invitation from <em>' + inviter + '</em>. Wanna play?';
      invitation += '<form><input type="submit" value="Yeah!" class="invite-answer" id="yes"><input type="submit" value="Nah.." class="invite-answer" id="no"></form>';
      invitation += '</div>'

      $('#contents').html(invitation).show('fast', function(){

         socket.on('cancelInvite', function (inviter) {
            buildMenu(users, 'Invite got cancelled by <em>' +  inviter + '</em>'); 
          });

        $('.invite-answer').click(function(){
          answer = $(this).attr('id');
          if(answer === 'yes') {
            socket.emit('startGame', inviter);
          }
          if(answer === 'no') {
            buildMenu(users, 'Ok. No game with <em>' + inviter +'</em>');
            socket.emit('declineInvite', inviter);
          }
          return false;
        });
      });
    },
    buildWaitScreen: function(invitee, users) {
      socket.on('declineInvite', function (inviter) {
        this.worduel('buildMenu', users, '<em>' +  inviter + "</em> didn't wanna play"); 
      });
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
      });
    },
    buildBoard: function(game) {
      baseElement = this;
      this.hide();
      placed= new Array();
      html =  '<div id="game">';
      html += '<h2>Round '+ game.round +'</h2>';
      html += '<div id="time"></div>';
      html += '<table id="board">';
      html += '<tr class="board-row">';
      for (n=0; n<=7; n++) {
        html += '<td><div class="board-cell droppable" id="board-cell-'+ n +'"></div></td>';
      }
      html += '</tr>';
      html += '</table>';
      html += '<table id="private">';
      html += '<tr class="private-row">';
      for (n=0; n<=7; n++) {
        letter = game.rounds[game.round].letters[n];
        piece = '<div id="letter-'+ letter +'" class="letter letter-mine draggable" draggable="true">'+ letter +'</div>';
        html += '<td class="private-cell" id="private-cell-'+ n +'">'+ piece +'</td>';
      }
      html += '</tr>';
      html += '</table>';
      html += '</div>';
      this.html(html).show('fast', function(){

        $(".draggable").draggable({ 
          snap: ".droppable", 
          snapMode: 'inner', 
          cursor: "move", 
          stop: function(event, ui) { $(this).addClass('moved'); }
        });
        $(".droppable").droppable({
          drop: function(event, ui) { 
            $(this).addClass('hit');
            fieldElements = $(this).attr('id').split('-');
            field = fieldElements[2];
            pieceElements = ui.draggable.attr('id').split('-');
            piece = pieceElements[1];
          
            placed = $('#game').data('placed');
            if (placed == undefined) {
              placed = new Array();
            }
            placed[field] = {'field' : field, 'letter': piece};
            $('#game').data('placed', placed);
          },
        });
        element = $('#time');
        element.text('10 secs. remaining');
        socket.on('updateTime', function (sec) {
          element.worduel('updateTime', sec, game);
        });
      });
    },
    readBoard : function(placed, callback) {
      string = ''
      space = false;
      $.each(placed, function(index, value){
        if(typeof(value) == 'object' && !space) {
          string += value.letter;
        } else {
          space = true;
        }
      });
      return callback(string);
    },
    updateTime : function (sec, game) {

      if(sec === 0) {
        
        element.html('Round ended');
        element.worduel('readBoard', placed, function(string) {
          //TODO: add spinner
          $('#private').remove();
          $('#board').replaceWith('<img id="spinner" src="imgs/spinner.gif" />');
          game.rounds[game.round].response = new Object();
          game.rounds[game.round].response[user] = string;
          socket.emit('endRound', game);
        });
        socket.removeAllListeners('updateTime'); 

      } else if(sec === 1) {
        element.html('1 sec. remaining');
      } else {
        element.html(sec + ' secs. remaining');
      }
    },
    endGame : function (game) {

     
        
        element.html('<h1>ITS ALL OVER</h1>');


    },
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
