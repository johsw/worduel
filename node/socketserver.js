var io = require('socket.io').listen(8080);
var games = new Array();
var invites = new Array();
var users = {};
var userSocketId = {};
var userCookieId = {};
io.sockets.on('connection', function (socket) {

  socket.on('login', function (name, cookieId) {
    if(name.length > 0) {
      var newUserName = true;
      for(key in users) {
         if(key === name) {
           newUserName = false;
         }
      }
      if (newUserName) {
        socket.set('userName', name, function () {
          users[name] = {active: true, status: 'available'};
          userSocketId[name] = socket.id;
          userCookieId[cookieId] = name;
          response = {loggedIn : true, text : '', id: cookieId, users: users};
          socket.broadcast.emit('updateMenu', {users:users});
        });
      } else {
        response = false;
        text = 'The name <em>'+ name +'</em> is taken :-(';
        response = {loggedIn : response, text : text};
        
      }
      io.sockets.socket(userSocketId[name]).emit('loginResponse', response);
      
    } else {
      response = {loggedIn : false, text : 'No username'};
      io.sockets.emit('loginFail', response);
    }   
  });
  socket.on('invite',function(user){
    
    socket.get('userName', function (err, name) {
      users[user].status = 'invited';
      users[name].status = 'inviting';
      
      console.log(users);
      console.log('invited: ', user, ' inviter: ', name);
      io.sockets.socket(users[user].sid).emit('invite', name);
      io.sockets.emit('updateMenu', {users:users});
    });
  });
  
  socket.on('quit',function(name){
    delete users[name];
    io.sockets.emit('updateMenu', {users:users});
  });
  socket.on('updateMenu',function(){
    io.sockets.emit('updateMenu', {users:users});
  });
  
/*
  socket.on('disconnect',function(event){
    console.log(event);
    socket.get('userName', function (err, name) {
      console.log('Bum -> by ', name);
    });
  });
  

   */

  /*socket.on('disconnect', function () {
    io.sockets.emit('user disconnected');
  });
  */


});