$(document).ready(function() {
  

  
  placed = new Array();
  
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
      field = fieldElements[4];
      x = fieldElements[2];
      y = fieldElements[3];
      pieceElements = ui.draggable.attr('id').split('-');
      piece = pieceElements[1];
      
      placed[piece] = {'field' : field, 'letter': ui.draggable.html(), 'x': x, 'y' : y};
    },
  });
  
  
  $('#submit').click(function(){
    x = -1;
    y = -1;
    allY = true;
    allX = true;
    ordered = new Array();
    $.each(placed, function(index, value){
      if(typeof(value) == 'object') {
        ordered[value.field] = value;
        if(x == -1) {
          x = value.x
          y = value.y;
        } else {
          if(value.x != x) {
            allX = false;
          }
          if(value.y != y) {
            allY = false;
          }
        } 
      }
    });
    
    if(allY || allX) {
      $.each(ordered, function(index, value){
        if(typeof(value) == 'object') {
          console.log(value.letter);
        }
      });
      console.log('good');
    } else {
      //Return error message
      console.log('bad');
    }
  });
  
  /*
  var socket = io.connect('http://localhost:8080');
  
  socket.emit('private message', 'pherd', 'sonderangebot');
  /*socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });
  socket.on('this', function (data) {
    console.log(data);

  });
  */
  
});
