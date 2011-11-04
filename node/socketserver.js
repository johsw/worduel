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
        response = false;
        text = 'The user <em>'+ user +'</em> is taken :-(';
        response = {loggedIn : response, text : text};
        
      }
      io.sockets.socket(userSocketId[user]).emit('loginResponse', response);
      
    } else {
      response = {loggedIn : false, text : 'No useruser'};
      io.sockets.emit('loginFail', response);
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