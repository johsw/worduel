<!DOCTYPE html>
<head>
  <title>Scrabble</title>
  <link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css" rel="stylesheet" type="text/css"/>
  <link rel="stylesheet" href="style.css" type="text/css" media="screen" title="no title" charset="utf-8">
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"></script>
  <script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>
  <script src="./socket.io.js"></script>
  <script src="./game_script.js"></script>
</head>
<body>
  <div id="body-wrapper">
    <h1>Scrabble</h1>
    <div id="game">
      <table id="board">
        <?php 
          $counter = 0;
          for ($y=1; $y<=8; $y++) {
            print '<tr class="board-row" id="board-row-'. $y .'">';
            for ($x=1; $x<=8; $x++) {
              $counter++;
              print '<td class="board-cell droppable" id="board-cell-'. $x .'-'. $y .'-'. $counter .'"></td>';
            }
            print '</tr>';
          }
        ?>
      </table>
  
      <table id="private">
        <tr>
          <?php 
            for ($n=1; $n<=8; $n++) {
              print '<td class="private-cell" id="private-cell-'. $n .'">';
              print '<div id="letter-'. $n .'" class="letter letter-mine draggable" draggable="true">'. chr(rand(65, 90)) . '</div>';
              print '</td>';
            }
          ?>
        </tr>
      </table>
      <input type="button" name="message" value="play" id="submit">    
    </div>
  </div>
</body>