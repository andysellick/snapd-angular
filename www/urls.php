<?php
$xmlstr = <<<XML
<?xml version='1.0' standalone='yes'?>
<data>
    <!--
        Structure can be hierarchical
        - url is string from url to match against
        - path is where to look for file (after templatepath variable from index.php has been inserted)
        - file is filename to include
    -->
    <item url="404" path="" file="404.html" title="Page not found"/> <!-- this entry is essential -->
    <item url="styleguide" file="styleguide/styleguide.html"/>

    <item url="/" path="" file="home.html"/>  <!-- index page has to be separate from /index.php as this is used to output the current page -->
    <item url="home-data" path="" file="home-data.html"/>
    <item url="album" path="" file="album.html"/>
    <item url="album-data" path="" file="album-data.html"/>
    <item url="thumbs" path="" file="thumbs.html"/>

</data>
XML;
?>
