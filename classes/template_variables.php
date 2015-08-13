<?php
    //the array below is imported into class_templating to provide links between specific templates
    //and functions in the class for this site that should populate variables within them
    //e.g. for custard doughnuts, class_cd
    
    //array key matches current template name, value matches function to call
    //note that a key can only occur once, so for multiple variables on one page, put in an array
    //note also that each value must be an array, even if it is a single value

    $matchtemplates = array(
        '*' => array(), //put any functions for all pages in here
        '/' => array('listAlbums'),
        'home-data' => array('listAlbumsJSON'),
        'album' => array('showAThumbOrTwo'),
        'album-data' => array('showThumbsJSON'),
        'thumbs' => array('showThumbs'),
    );
?>