<?php

// http://dreamsteep.com/projects/the-english-open-word-list.html

ini_set('auto_detect_line_endings', true); 
$dir_name = './EOWL/CSV Format';

$dir = scandir($dir_name);

if(!is_dir($dir_name )) {
  die('No data!');
}
$m = new Mongo();

// select a database
$db = $m->worduel;

// select a collection (analogous to a relational database's table)
$collection = $db->words;

foreach ($dir AS $file) {
  
  if (substr($file, 0 ,1) != '.') {
    $words = file($dir_name. '/'. $file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach($words AS $word) {
      // add a record
      $obj = array( "word" => utf8_encode($word));
      $collection->insert($obj); 
    }
  }
}