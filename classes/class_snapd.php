<?php
/* specific functions for custarddoughnuts */

class cdHandler extends xmlStuff {
    var $command;
    var $sitepath = '/snapd-angular'; //FIXME
    var $showall;
    /*
    var $path;
    var $currentpath;
    var $xmlpath;
    var $itemsperpage;
    var $currentpage = 1;
    var $currenttag = '';
    */

    function __construct(){
        $arguments = func_get_args();
        if(!empty($arguments))
            foreach($arguments[0] as $key => $property)
                if(property_exists($this, $key))
                    $this->{$key} = $property;
        /*
        echo "<pre>";
        print_r($this->command);
        echo "</pre>";
        */
    }

    //list all the albums on the homepage
    function listAlbums(){
        $return = array();
        $files = self::getFiles('www/xml/albums/','album');
        foreach($files as $key => $file){
            $xml = self::openXML($file);
            //get album thumbnail or default to first
            $thumb = (int)$xml["defaultthumb"];
            if(!$thumb){
                $thumb = 0;
            }
            $link = self::parseFilenameAsDate((string)$file);
            $linkname = self::flattenTitleForLink((string)$xml["name"]);
            $albumid = str_replace("/","-",$link);
            $thumb = "album-".$albumid."-".$thumb.".jpg";

            $loopvars = array('name' => (string)$xml["name"],
                            'date' => self::parseFilenameAsDate((string)$file),
                            'intro' => (string)$xml["desc"],
                            'thumb' => $thumb,
                            'thumbslink' => $this->sitepath.'/thumbs/'.$link.'/'.$linkname.'/',
                            'thumbslinkaj' => '/album-data/'.$link.'/'.$linkname.'/',
                            'albumlink' => $this->sitepath.'/album/'.$link.'/'.$linkname.'/0',
                            'albumlinkaj' => '/album-data/'.$link.'/'.$linkname.'/0'
                            );
            array_push($return,$loopvars);
        }
        return $return;
    }
    
    //get the homepage album list in json
    function listAlbumsJSON(){
        return(json_encode(self::listAlbums()));
    }

    //display a specific thumbnail from an album
    //url structure is /album/yyyy/mm/dd/name/id - id is optional, assumes 0
    function showThumb(){
        $return = array();
        //generate the filename to match from the url, of the format yyyy-mm-dd and pad with zeros as necessary
        $command = $this->command[1];
        $year = $command[1];
        $month = $command[2];
        $day = $command[3];

        if($year && $month && $day){
            $datestr = self::padDateWithZeros($year,$month,$day);
            $datestr = "album-".$datestr[0].'-'.$datestr[1].'-'.$datestr[2];
            $file = self::getFiles('www/xml/albums/',$datestr,$this->showall); //get the file
            if($file){
                $file = $file[0];
                $xml = self::openXML($file);
                $id = 0;
                if(count($command) > 5){
                    $id = (int)$command[5];
                }
                $pic = $xml->pic[$id];
                if($pic){
                    $prevlink = '';
                    $nextlink = '';
                    $currlink = '/'.$command[1].'/'.$command[2].'/'.$command[3].'/'.$command[4].'/';
                    if($id < count($xml->pic)){
                        $nextlink = '/album'.$currlink.($id + 1);
                    }
                    if($id > 0){
                        $prevlink = '/album'.$currlink.($id - 1);
                    }
                    $currpic = 0;
                    if(count($command) > 4){
                        $currpic = (int)$command[5];
                    }
                    $return = array(
                        'desc' => (string)$pic['desc'],
                        'pic' => (string)$xml['albumdir'].'/'.(string)$pic['file'],
                        'link' => $currlink,
                        'linkaj' => '/album-data'.$currlink,
                        'thumbslink' => '/thumbs/'.$currlink,
                        'currpic' => $currpic,
                        'prev' => $prevlink,
                        'next' => $nextlink
                    );
                    $return['title'] = (string)$xml['name'];
                    return($return);
                }
            }
        }
        return array("desc" => "We couldn't find that picture. Perhaps go back to the homepage and try again?");
    }

    //display all thumbnails from an album
    function showThumbs($ajax=0){
        $return = array();
        //generate the filename to match from the url, of the format yyyy-mm-dd and pad with zeros as necessary
        $command = $this->command[1];
        $year = $command[1];
        $month = $command[2];
        $day = $command[3];

        if($year && $month && $day){
            $datestr = self::padDateWithZeros($year,$month,$day);
            $datestr = "album-".$datestr[0].'-'.$datestr[1].'-'.$datestr[2];
            $file = self::getFiles('www/xml/albums/',$datestr,$this->showall); //get the file
            if($file){
                $file = $file[0];
                $xml = self::openXML($file);
                $currlink = '/'.$command[1].'/'.$command[2].'/'.$command[3].'/'.$command[4].'/';
                //for an ajax call, we need to modify the data output slightly to provide additional info. This structure isn't currently supported by the template engine,
                //but it's perfectly acceptable if we're just outputting it all as json that will then be processed by client side JS
                if($ajax){
                    $return['title'] = (string)$xml['name'];
                    $return['link'] = $currlink;
                }
                $id = 0;
                if(count($command) > 5){
                    $id = (int)$command[5];
                }

                $counter = 0;
                foreach($xml->pic as $pic){
                    $prevlink = '';
                    $nextlink = '';
                    if($id < count($xml->pic)){
                        $nextlink = $currlink.($id + 1);
                    }
                    if($id > 0){
                        $prevlink = $currlink.($id - 1);
                    }

                    $thumbs = array(
                        'desc' => (string)$pic['desc'],
                        'pic' => $this->sitepath.'/public/img/pics/'.(string)$xml['albumdir'].'/'.(string)$pic['file'], //fixme these aren't thumbs yet
                        'picid' => $counter,
                        //'prev' => $prevlink,
                        //'next' => $nextlink, //fixme don't need these, surely?
                        'link' => $this->sitepath.'/album'.$currlink
                    );
                    array_push($return,$thumbs);
                    $counter += 1;
                }
                //print_r($return);
                return $return;
            }
        }
        return array("pic" => "<p>We couldn't find that picture. Perhaps go back to the homepage and try again?</p>");
    }
    
    //generic function to return data for a specific picture or all pictures in an album
    function showAThumbOrTwo($ajax=0){
        $return = array();
        //generate the filename to match from the url, of the format yyyy-mm-dd and pad with zeros as necessary
        $command = $this->command[1];
        $year = $command[1];
        $month = $command[2];
        $day = $command[3];

        if($year && $month && $day){
            $datestr = self::padDateWithZeros($year,$month,$day);
            $datestr = "album-".$datestr[0].'-'.$datestr[1].'-'.$datestr[2];
            $file = self::getFiles('www/xml/albums/',$datestr,$this->showall); //get the file
            if($file){
                $file = $file[0];
                $xml = self::openXML($file);
                $prevlink = '';
                $nextlink = '';
                $currlink = '/'.$command[1].'/'.$command[2].'/'.$command[3].'/'.$command[4].'/';
                
                //find out if a specific picture should be returned (no js) or return all (js via ajax)
                $id = 0;
                if($ajax){
                    $id = -1;
                }
                else {
                    if(strlen($command[5])){
                        $id = (int)$command[5];
                    }
                }

                //if no specific picture was requested in the url, return all pictures
                if($id == -1){
                    $counter = 0;
                    foreach($xml->pic as $pic){
                        $prevlink = '';
                        $nextlink = '';
                        if($id < count($xml->pic)){
                            $nextlink = $currlink.($id + 1);
                        }
                        if($id > 0){
                            $prevlink = $currlink.($id - 1);
                        }

                        $thumbs = array(
                            'desc' => (string)$pic['desc'],
                            //'pic' => $this->sitepath.'/public/img/pics/'.(string)$xml['albumdir'].'/'.(string)$pic['file'], //yeah this is a bit complex fixme
                            'pic' => (string)$xml['albumdir'].'/'.(string)$pic['file'],
                            'picid' => $counter,
                            //'prev' => $prevlink,
                            //'next' => $nextlink, //fixme don't need these, surely?
                            'link' => $this->sitepath.'/album'.$currlink
                        );
                        array_push($return,$thumbs);
                        $counter += 1;
                    }
                    //for an ajax call, we need to modify the data output slightly to provide additional info. This structure isn't currently supported by the template engine,
                    //but it's perfectly acceptable if we're just outputting it all as json that will then be processed by client side JS
                    if($ajax){
                        $return['size'] = count($return) - 1; //have to do this first before the following lines corrupt the data
                        $return['title'] = (string)$xml['name'];
                        $return['link'] = $currlink;
                    }
                }
                //if the album url has a specific picture number, return that picture
                else {
                    $pic = $xml->pic[$id];
                    if($id < count($xml->pic)){
                        $nextlink = $this->sitepath.'/album'.$currlink.($id + 1);
                    }
                    if($id > 0){
                        $prevlink = $this->sitepath.'/album'.$currlink.($id - 1);
                    }
                    $currpic = 0;
                    if(count($command) > 4){
                        $currpic = (int)$command[5];
                    }
                    $return = array(
                        'desc' => (string)$pic['desc'],
                        'pic' => $this->sitepath.'/public/img/pics/'.(string)$xml['albumdir'].'/'.(string)$pic['file'], //yeah this is a bit complex fixme
                        'link' => $currlink,
                        'linkaj' => $this->sitepath.'/album-data'.$currlink,
                        'thumbslink' => $this->sitepath.'/thumbs'.$currlink,
                        'currpic' => $currpic,
                        'prev' => $prevlink,
                        'next' => $nextlink
                    );
                    $return['title'] = (string)$xml['name'];
                }
                return $return;
            }
        }
        return array("pic" => "<p>We couldn't find that picture. Perhaps go back to the homepage and try again?</p>");
    }

    function showThumbsJSON(){
        //print_r($this->command[1]);
        return(json_encode(self::showAThumbOrTwo(1)));
    }

    //given an album title, make it link-safe
    function flattenTitleForLink($title){
        //$paranoia = array(".",",",";"," ","'",'"'); //clear out anything dodgy from the URI
        $replaces = array(".",",",";","'","!","?",":",'"');
        $title = str_replace($replaces,"",$title);
        return strtolower(str_replace(" ","-",$title));
    }
    
    function padDateWithZeros($year,$month,$day){
        if(strlen((string)$year) < 4){
            $year = '00'.$year;
        }
        if(strlen((string)$month) < 2){
            $month = '0'.$month;
        }
        if(strlen((string)$day) < 2){
            $day = '0'.$day;
        }
        return(array($year,$month,$day));
    }
}
?>