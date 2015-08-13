<?php
    //import all the necessary classes and set up the error handler
    function exception_error_handler($errno, $errstr, $errfile, $errline ) {
        throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
    set_error_handler("exception_error_handler");
    try {
        //set up variables
        include 'config.php';
        include 'classes/template_variables.php';

    	include 'classes/class_xml.php';
    	$xmlstuff = new xmlStuff(array('path' => $xmlpath));

    	include 'classes/class_error.php';
    	$errorhandler = new errorHandler(array('templatepath' => $templatepath));

        include 'classes/class_url.php';
    	$urlhandler = new urlHandler(array('urlsfile' => $urlsfile, 'templatepath' => $templatepath));
    	$command = $urlhandler->getURL();

    	include 'classes/class_snapd.php'; //extends class xml
    	$cd = new cdHandler(array('command' => $command, //need to pass $command to interpret page url
                                    'path' => $templatepath,
                                    'xmlpath' => $xmlpath,
                                    'showall' => $showall,
                                    'itemsperpage' => $itemsperpage));

    	include 'classes/class_templating.php';
    	$templateHandler = new templateHandler(array('path' => $templatepath, //set the path for files
                                                    'relatedfunctions' => $cd,
                                                    'matchtemplates' => $matchtemplates));
        $templateHandler->openFile($command);
    }
    catch (Exception $e) {
    	$errorhandler->error($e);
    }

?>