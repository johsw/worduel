var io = require('socket.io').listen(8080);
var games = new Array();
var invites = new Array();
var users = {};
var userSocketId = {};
var userCookieId = {};
var words =  new Object();
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
      io.sockets.socket(userSocketId[playerA]).emit('startGame', game);
      io.sockets.socket(userSocketId[playerB]).emit('startGame', game);
      io.sockets.emit('updateMenu', {users:users});
      timeout = new Array();
      timeout[10] = setTimeout(sendTime, 1000, 10);
    });
  });
  socket.on('endRound',function(game){
    socket.get('userName', function (err, player) {
      mongodb = require('mongodb');
      // Now create the server, passing our options.
      //var serv = new mongodb.Server('localhost', 27017, serverOptions);
      var dbServer = new mongodb.Server("127.0.0.1", 27017, {auto_reconnect: true});
      var db = new mongodb.Db('worduel', dbServer);
      //game.rounds[game.round].response[player];
      words[player] = game.rounds[game.round].response[player];
      console.log(words);
      db.open(function (error, db) {
        db.collection('words', function(err, collection){
          collection.find({'word': words[player]}, {'limit':1}, function(err, cursor) {
            cursor.toArray(function(err, docs) {
              if (game.rounds[game.round].points == undefined) {
                game.rounds[game.round].points = new Object();
              }
              if (game.rounds[game.round].finished == undefined) {
                game.rounds[game.round].finished = 1;
                console.log('-- first');
              } else {
                game.rounds[game.round].finished++;
                console.log('-- later');
              }
              if(docs.length > 0) {
                game.rounds[game.round].points[player] = game.rounds[game.round].response[player].length;
              } else {
                game.rounds[game.round].points[player] = 0;
              }
              if (game.rounds[game.round].finished == 2) {
                //console.log('END: ', game);
              }
              console.log('END: ', game);
            });

          });
          //do stuff using collection variable

        });
        // Do something with the connection.

        // Make sure to call db.close() when ALL connections need
        // to be shut down.
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
  

  function sendTime(sec) {
    sec--;
    if(sec >= 0) {
      io.sockets.emit('updateTime', sec);
      timeout[sec] = setTimeout(sendTime, 1000, sec);
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

