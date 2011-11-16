var io = require('socket.io').listen(8080);
var games = new Array();
var invites = new Array();
var users = {};
var userSocketId = {};
var userCookieId = {};
var words =  new Object();
var mongodb = require('mongodb');

var NO_ROUNDS = 5;
var SECS_PR_ROUND = 10;

// Now create the server, passing our options.
//var serv = new mongodb.Server('localhost', 27017, serverOptions);



io.sockets.on('connection', function (socket) {

  socket.on('login', function (user, cookieId) {
    if(user.length > 0) {
      var newUserName = true;
      for(key in users) {
         if(key === user) {
           newUserName = false;
         }
      }
      if (newUserName) {
        socket.set('userName', user, function () {
          users[user] = {active: true, status: 'available'};
          userSocketId[user] = socket.id;
          userCookieId[cookieId] = user;
          response = {loggedIn : true, text : '', id: cookieId, users: users};
          socket.broadcast.emit('updateMenu', {users:users});
        });
      } else {
        text = 'The user <em>'+ user +'</em> is taken :-(';
        response = {loggedIn : false, text : text};
      }
      io.sockets.socket(socket.id).emit('loginResponse', response); 
    } else {
      response = {loggedIn : false, text : 'No username given'};
      io.sockets.emit('loginResponse', response);
    }   
  });
  socket.on('invite',function(invitee){
    
    socket.get('userName', function (err, inviter) {
      users[invitee].status = 'invited';
      users[inviter].status = 'inviting';

      io.sockets.socket(userSocketId[invitee]).emit('invite', inviter);
      io.sockets.emit('updateMenu', {users:users});
    });
  });
  
  socket.on('cancelInvite',function(invitee){
    socket.get('userName', function (err, inviter) {
      users[invitee].status = 'available';
      users[inviter].status = 'available';
      io.sockets.socket(userSocketId[invitee]).emit('cancelInvite', inviter);
      io.sockets.emit('updateMenu', {users:users});
    });
  });
  
  socket.on('declineInvite',function(inviter){
    socket.get('userName', function (err, invitee) {
      users[invitee].status = 'available';
      users[inviter].status = 'available';
      io.sockets.socket(userSocketId[inviter]).emit('declineInvite', invitee);
      io.sockets.emit('updateMenu', {users:users});
    });
  });
  socket.on('startGame',function(playerA){
    socket.get('userName', function (err, playerB) {
      users[playerA].status = 'in game';
      users[playerB].status = 'in game';
      letters = generateLetters();
      rounds = new Array();
      rounds[0] = {};
      rounds[1] = {no: 1, letters: letters};
      game = {id: generateRandomString(), rounds:rounds, round: 1, players : [playerA, playerB]}
      games[game.id] = game;
      startRound(game);
      io.sockets.emit('updateMenu', {users:users});
    });
  });
  socket.on('endRound',function(game){
    socket.get('userName', function (err, player) {
      console.log('END ROUND', player);
      //game.rounds[game.round].response[player];
      words[player] = game.rounds[game.round].response[player];
      if(games[game.id].rounds[game.round].response == undefined) {

        //TODO: check the round letters match
        games[game.id].rounds[game.round] = game.rounds[game.round];
      } else {
        //TODO: check the round letters match
        games[game.id].rounds[game.round].response[player] = game.rounds[game.round].response[player];
      }
      //TODO: check if returned word has only used th provided letters
      var dbServer = new mongodb.Server("127.0.0.1", 27017, {auto_reconnect: true});
      var db = new mongodb.Db('worduel', dbServer);
      db.open(function (error, db) {
        db.collection('words', function(err, collection){
          collection.find({'word': words[player]}, {'limit':1}, function(err, cursor) {
            cursor.toArray(function(err, docs) {
              
              console.log('DOCS',docs);
              console.log('ERR',err);
              console.log('docs.length',docs.length);
              if (games[game.id].rounds[game.round].points == undefined) {
                games[game.id].rounds[game.round].points = new Object();
              }
              if (games[game.id].points == undefined) {
                games[game.id].points = new Object();
              }
              if (games[game.id].rounds[game.round].finished == undefined) {
                games[game.id].rounds[game.round].finished = new Array(player);
              } else {
                games[game.id].rounds[game.round].finished[games[game.id].rounds[game.round].finished.length] = player;
              }
              if(docs.length > 0) {
                games[game.id].rounds[game.round].points[player] = game.rounds[game.round].response[player].length;
              } else {
                games[game.id].rounds[game.round].points[player] = 0;
              }
            
              if(games[game.id].points[player] == undefined) {
                games[game.id].points[player] = games[game.id].rounds[game.round].points[player];
              } else {
                games[game.id].points[player] = parseInt(games[game.id].points[player]) + parseInt(games[game.id].rounds[game.round].points[player]);
              }
              console.log(games[game.id].rounds[game.round].finished);
              if (games[game.id].rounds[game.round].finished.length == games[game.id].players.length) {
                
                delete games[game.id].rounds[game.round].finished;
                nextRound =  parseInt(games[game.id].round) + 1;
                if (games[game.id].round > NO_ROUNDS) {
                  console.log('----------- END GAME -----------');
                } else {
                  console.log('ONE MORE ROUND: ', games[game.id].round);

                  
                  for (var i = 0; i < games[game.id].players.length; i++) {
                    io.sockets.socket(userSocketId[games[game.id].players[i]]).emit('roundStatus', games[game.id]);
                  }
                  games[game.id].round = nextRound;
                  games[game.id].rounds[games[game.id].round] = {no: games[game.id].round, letters: generateLetters()};
                  games[game.id].roundTimeout = setTimeout(startRound, 6000, game);
                }
              }
            });
          });
        });
        db.close();
      });
    });
  });

  
  
  socket.on('quit',function(user){
    delete users[user];
    io.sockets.emit('updateMenu', {users:users});
  });
  socket.on('updateMenu',function(){
    io.sockets.emit('updateMenu', {users:users});
  });
  
  function startRound(game) {
    for (var i = 0; i < games[game.id].players.length; i++) {
      io.sockets.socket(userSocketId[games[game.id].players[i]]).emit('startRound', games[game.id]);
    }
    games[game.id].timeout = new Array();
    games[game.id].timeout[SECS_PR_ROUND] = setTimeout(sendTime, 1000, SECS_PR_ROUND);
  }
  

  function sendTime(sec) {
    sec--;
    if(sec >= 0) {
      //TODO: only send to this game's users
      io.sockets.emit('updateTime', sec);
      games[game.id].timeout[sec] = setTimeout(sendTime, 1000, sec);
    }
  }
  
  function generateLetters() {
    letters = new Array();
    drawn   = new Array();
    count = 0;
    frequencies = {'E': 57, 'A':43, 'R':39, 'I':38, 'O':37, 'T':35, 'N':34, 'S':29, 'L':28, 'C':23, 'U':19, 'D':17, 'P':16, 'H':15, 'G': 13, 'B':11, 'F':9, 'Y':9, 'W':7, 'K':6, 'V':5, 'X':1, 'Z': 1, 'J':1, 'Q':1};
    for (letter in frequencies) {
      for(n=0; n< frequencies[letter]; n++) {
        letters[count] = letter.toLowerCase();
        count++
      }
    }
    for(n=0; n<8; n++) {
      drawn[n] = letters[Math.round(letters.length * Math.random())];
    }
    return drawn;
  }
  
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
/*
  socket.on('disconnect',function(event){
    console.log(event);
    socket.get('userName', function (err, user) {
      console.log('Bum -> by ', user);
    });
  });
  

   */

  /*socket.on('disconnect', function () {
    io.sockets.emit('user disconnected');
  });
  */


});

