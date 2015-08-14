<?php
	//given
	//filename of an image
	//width and height of screen
	//generate and return new image
	//where this should be a different size the values are calculated elsewhere and passed
	//call in HTML is of the form (replace php variables accordingly)
	//<img src="makeImage.php?img=$filename&quality=$quality&width=$outer_width&height=$outer_height">

	$filename = $_GET['img'];
	$new_width = $_GET['width'];
	$new_height = $_GET['height'];
	$quality = $_GET['quality'];
	$thumb = $_GET['thumb'];

	$thumb_width = $thumb_height = max($new_width,$new_height);

	//Get dimensions of original image
	if(file_exists($filename)) {
		list($img_width, $img_height) = getimagesize($filename);
	}

	if(!is_file($filename)) {
		//http_404();
		// header of text
		// text saying the image does not exist
		echo "Error. The specified image was not found.";
	}
	if(!headers_sent()) {
		// send on the headers and continue with the script
		header('Content-type: image/jpeg');		// Content type

		$newposx = 0; //position of source sample. Values may not be 0 if thumb
		$newposy = 0;
		//recalculate desired size of image
		//check that image is not smaller than intended resize dimensions
		if($img_height > $new_height || $img_width > $new_width) {
			if($thumb) {
				if($img_width < $img_height) {
					$xscale = $yscale = $img_width / $new_width;
					$newposy = ($img_height - $img_width) / 2; //calculate newposy to position the sample in the middle of the image
				}
				else {
					$xscale = $yscale = $img_height / $new_height;
					$newposx = ($img_width - $img_height) / 2; //calculate newposx to position the sample in the middle of the image
				}
			}
			else {
				$xscale = $img_width / $new_width;
				$yscale = $img_height / $new_height;
			}
			$scale = max($xscale,$yscale);
			//return width and height as integers
			$new_width = intval($img_width / $scale);
			$new_height = intval($img_height / $scale);
		}
		//otherwise leave dimensions as is
		else {
			$new_width = $img_width;
			$new_height = $img_height;
		}

		//Resample
		if($thumb) {$image_p = imagecreatetruecolor($thumb_width, $thumb_height);}//create a new blank image of the required dimensions
		else {$image_p = imagecreatetruecolor($new_width, $new_height);}//create a new blank image of the required dimensions
		//check what kind of file we're dealing with
		$type = substr($filename,-4);
		if($type == ".jpg" || $type == "jpeg") {$image = imagecreatefromjpeg($filename);}
		elseif($type == ".png") {$image = imagecreatefrompng($filename);}
		elseif($type == ".gif") {$image = imagecreatefromgif($filename);}
		//could do with an 'else' option here, as currently only jpg gif and png supported
		//although image module prevents upload of bmp and presumbably other unsupported file types
		//imagecopyresampled($image_p, $image, 0, 0, 0, 0, $new_width, $new_height, $img_width, $img_height);
		imagecopyresampled($image_p, $image, 0, 0, $newposx, $newposy, $new_width, $new_height, $img_width, $img_height);

		// Output
		imagejpeg($image_p, null, $quality);
		imagedestroy($image_p);
	}
/*
header ('Content-type: image/png');
$im = @imagecreatetruecolor(120, 30) //image width and height
      or die('Cannot Initialize new GD image stream');
      $text_color = imagecolorallocate($im, 233, 14, 91); //text colours
      imagestring($im, 1, 5, 5,  'it works', $text_color); //text sizes and position
      imagepng($im);
      imagedestroy($im);
*/
?>