var io = require('socket.io').listen(8080);
var games = new Array();
var invites = new Array();
var users = {};
var userSocketId = {};
var userCookieId = {};
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
      game = {id: generateRandomString(), round: {no: 1, letters: letters}, players : [playerA, playerB]}
      games[game.id] = game;
      io.sockets.socket(userSocketId[playerA]).emit('startGame', game);
      io.sockets.socket(userSocketId[playerB]).emit('startGame', game);
      io.sockets.emit('updateMenu', {users:users});
    });
  });
  
  function generateLetters() {
    letters = new Array();
    for(n=0; n<8; n++) {
      letters[n] = String.fromCharCode(Math.round(25 * Math.random()) + 65);
    }
    return letters;
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
  
  socket.on('quit',function(user){
    delete users[user];
    io.sockets.emit('updateMenu', {users:users});
  });
  socket.on('updateMenu',function(){
    io.sockets.emit('updateMenu', {users:users});
  });
  
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