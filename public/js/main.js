//FIXME need proper error handling for ajax calls

//object to hold the album currently being viewed
var albumobj = function(){
    this.thumbs = [];
    this.pictures = [];
    this.descriptions = [];
    this.currpic = 0;
    this.url;
}
//object to hold minimal details of all albums
var albumsobj = function(){
    this.names = [];
    this.thumbs = [];
    this.descriptions = [];
    this.dates = [];
    this.albumlink = [];
    this.thumbslink = [];
    this.albumlinkaj = [];
    this.thumbslinkaj = [];
}

var urlobj = function(){
    this.base;
    this.fullpath;
    this.sitebase;

    this.getBase = function(){
        this.sitebase = '/snapd'; //FIXME will need to change this to snapd/ at some point
        this.base = window.location['protocol'] + '//' + window.location['host'];
        this.fullpath = this.base + this.sitebase;
    }
}

var curralb = new albumobj();
var allalbs = new albumsobj();
var siteurl = new urlobj();


(function( window, undefined ) {
var lenny = {
    general: {
        //change current page title attribute
        updatePageTitle: function(newtitle){
            document.title = newtitle;
        },
        //change current url without reloading the page
        //http://stackoverflow.com/questions/824349/modify-the-url-without-reloading-the-page/3354511#3354511
        updatePageURL: function(url){
            var html = $('#sitecontent').html();
            var ptitle = document.title;
            url = siteurl.base + url;
            console.log('updatePageURL: ',url);
            window.history.pushState({"html":html,"pageTitle":ptitle},"",url);
        },
        //preload images
        preloadImages: function(array,imagedir){
            var tempimg;
            for(i in array){
                tempimg = new Image();
                tempimg.src = imagedir + array[i];
                array[i] = tempimg;
            }
            return(array);
        }
    },
    navigation: {
        //update the current pic value of the album then reload the album
        changePic: function(pic){
            curralb.currpic += pic;
            lenny.markup.updateAlbumPic();
            lenny.general.updatePageURL(curralb.url + curralb.currpic.toString());
        },
        switchToAlbum: function(){
            $('#albumlist').hide();
            $('#album').show();
            $('#thumbs').hide();
            //manually append the current picture to the end of the URL
            var pic = 0;
            if(curralb.currpic != -1){
                pic = curralb.currpic;
            }
            lenny.general.updatePageURL(curralb.url + curralb.currpic);
        },
        switchToAlbumList: function(){
            $('#albumlist').show();
            $('#album').hide();
            $('#thumbs').hide();
            lenny.general.updatePageURL(siteurl.sitebase);
        },
        switchToThumbs: function(){
            $('#albumlist').hide();
            $('#album').hide();
            $('#thumbs').show();
            lenny.general.updatePageURL(curralb.thumbsurl);
        }
    },
    ajax: {
        //load album list and populate
        //we call this on page load for the homepage and also on clicking the 'home' link
        loadAlbumList: function(){
            //check to see if we already have retrieved the list of albums and stored in the js
            if(allalbs.names.length){
                if($('#albumlist').html().trim() == ''){ //don't generate markup if it's already there
                    lenny.markup.generateAlbums();
                }
                lenny.data.resetAlbum();
                lenny.navigation.switchToAlbumList();
            }
            //if we don't have the list of albums stored, do an ajax request to get them
            else {
                $.ajax({
                    type: "GET",
                    url: siteurl.fullpath + '/home-data/'
                }).done(function(data){
                    data = JSON.parse(data);
                    //given a chunk of JSON, populate and store the album list
                    for(var i in data){
                        allalbs.names[i] = data[i]['name'];
                        allalbs.thumbs[i] = data[i]['thumb'];
                        allalbs.descriptions[i] = data[i]['intro'];
                        allalbs.dates[i] = data[i]['date'];
                        allalbs.albumlink[i] = data[i]['albumlink'];
                        allalbs.thumbslink[i] = data[i]['thumbslink'];
                        allalbs.albumlinkaj[i] = data[i]['albumlinkaj'];
                        allalbs.thumbslinkaj[i] = data[i]['thumbslinkaj'];
                    }
                    allalbs.thumbs = lenny.general.preloadImages(allalbs.thumbs,siteurl.base + '/public/img/thumbs/');
                    lenny.markup.generateAlbums();
                }).fail(function(){
                    console.log('error');
                });
            }
            lenny.general.updatePageTitle('snapd');
        },
        //on thumbs page load, check if album has been loaded into js, if not, do so
        loadThumbs: function(url,urlaj){
            if(curralb.descriptions.length){
                lenny.markup.showThumbs();
            }
            else {
                $.ajax({
                    type: "GET",
                    url: siteurl.base + urlaj
                }).done(function(data){
                    data = JSON.parse(data);
                    //determine which pic to show based on the last chunk of the url
                    lenny.data.loadAlbum(data,0,url);
                    lenny.general.updatePageTitle(data['title'] + ' | ' + document.title);
                    lenny.markup.showThumbs();
                    lenny.navigation.switchToThumbs();
                }).fail(function(){
                    console.log('error');
                });
            }
        },
        //on album page load, check if album has been loaded into js, if not, do so
        initAlbum: function(url,urlaj){
            if(!curralb.pictures.length){
                //this bit is slightly clunky, extract and then remove the pic number from the end of the URL
                //FIXME assumes a certain structure of URL, can't necessarily guarantee this
                //might be better to separate out url and pic in the data attributes to begin with
                url = url.split('/');
                pic = url[url.length - 1];
                pic = parseInt(pic);
                url.pop(); //remove the last item from the url, i.e. the pic number
                url = url.toString();
                url = url.replace(/,/gi,'/') + '/';
                $.ajax({
                    type: "GET",
                    url: siteurl.fullpath + urlaj
                }).done(function(data){
                    data = JSON.parse(data);
                    lenny.data.loadAlbum(data,pic,url);
                    lenny.general.updatePageTitle(data['title'] + ' | ' + document.title);
                    lenny.markup.updateAlbumPic();
                    lenny.navigation.switchToAlbum();
                }).fail(function(){
                    console.log('error');
                });
            }
            else {
                //get the picture we need to show, update the html and switch to album
                lenny.markup.updateAlbumPic();
                lenny.navigation.switchToAlbum();
            }
        },
    },
    data: {
        //clears out the current album ready to load a new one
        resetAlbum: function(){
            curralb.pictures = [];
            curralb.descriptions = [];
            curralb.currpic = -1;
            curralb.url = '';
            //$('#album').html(''); //fixme we probably do want to do this but currently there's no function that recreates the HTML within this structure
            //$('#thumbs').html('');
        },
        //given a chunk of JSON, populate the current album
        loadAlbum: function(data,currpic,url){
            lenny.data.resetAlbum();
            for(var i in data){
                if(data.hasOwnProperty(i)){
                    if(data[i].pic){
                        curralb.pictures.push(data[i].pic); //create array of image filenames for preloading in a moment
                        curralb.thumbs.push(data[i].pic); //create array of image filenames for preloading in a moment
                    }
                    if(data[i].desc){
                        curralb.descriptions.push(data[i].desc);
                    }
                }
            }
            //begin caching other images in album
            curralb.pictures = lenny.general.preloadImages(curralb.pictures,'');
            curralb.thumbs = lenny.general.preloadImages(curralb.thumbs,'');
            curralb.currpic = currpic;
            console.log('loadAlbum ',url);
            curralb.url = url; // + currpic.toString(); //data['link'];moo
        }
    },
    markup: {
        //populate required pic, metadata, next/prev links
        updateAlbumPic: function(){
            $('[data-pic]').html(curralb.pictures[curralb.currpic]);
            //console.log(curralb.pictures[curralb.currpic]);
            $('[data-desc]').html(curralb.descriptions[curralb.currpic]);
            if(curralb.currpic < curralb.pictures.length){
                $('[data-next]').attr('href',curralb.url + (curralb.currpic + 1)).show();
            }
            else {
                $('[data-next]').hide();
            }
            if(curralb.currpic > 0){
                $('[data-prev]').attr('href',curralb.url + (curralb.currpic - 1)).show();
            }
            else {
                $('[data-prev]').hide();
            }
            $('[data-viewthumbs]').attr('href','');
        },
        generateAlbums: function(){
            //only populate the dom using the data if the dom is not already populated
            if($('#albumlist').html().trim() == ''){
                //this is a bit messy - would prefer to use some kind of template or something for this
                for(var i = 0; i < allalbs.names.length; i++){
                    var $el = $('<div/>');
                    $('<a/>').attr('data-loadalbum',allalbs.albumlinkaj[i]).attr('href',allalbs.albumlink[i]).html('<img src="public/img/thumbs/' + allalbs.thumbs[i] + '" alt="' + allalbs.names[i] + '"/>').appendTo($el);
                    $('<p/>').html(allalbs.names[i]).appendTo($el);
                    $('<p/>').html(allalbs.dates[i]).appendTo($el);
                    $('<p/>').html(allalbs.descriptions[i]).appendTo($el);
                    var p = $('<p/>');
                    $('<a/>').attr('data-loadalbum',allalbs.albumlinkaj[i]).attr('href',allalbs.albumlink[i]).html('Album').appendTo(p);
                    $('<a/>').attr('data-loadthumbs',allalbs.albumlinkaj[i]).attr('href',allalbs.albumlink[i]).html('Thumbs').appendTo(p);
                    p.appendTo($el);
                    $el.appendTo('#albumlist');
                }
            }
            lenny.navigation.switchToAlbumList();
        },
        showThumbs: function(){
            //only populate the dom using the data if the dom is not already populated
            if($('#thumbs').html().trim() == ''){
                for(var i = 0; i < allalbs.names.length; i++){
                    var $el = $('<div/>');
                    $('<a/>').attr('data-loadalbum',curralb.url + i).attr('href',curralb.url + i).html(curralb.thumbs[i]).appendTo($el);
                    $('<p/>').html(curralb.descriptions[i]).appendTo($el);
                    $el.appendTo('#thumbs');
                }
            }
        }
    }
};
window.lenny = lenny;
})(window);



$(document).ready(function(){

    siteurl.getBase(); //get the site url, needed for URL changes later

    //on page load need to check to see if we're in an album or thumbs or homepage and load data accordingly
    //homepage load done using script called in that template

    $('body').on('click','a',function(e){
        e.preventDefault();
        //go to home page
        if(typeof $(this).attr('data-home') !== typeof undefined && $(this).attr('data-home') !== false){
            lenny.ajax.loadAlbumList();
        }
        //open album view
        else if(typeof $(this).attr('data-loadalbum') !== typeof undefined && $(this).attr('data-loadalbum') !== false){
            var urlaj = $(this).attr('data-loadalbum'); //actual url for the ajax call, returns json
            var url = $(this).attr('href'); //real world url, also used if js disabled
            lenny.ajax.initAlbum(url,urlaj);
        }
        //open thumbs view of album
        /*
        else if(typeof $(this).attr('data-loadthumbs') !== typeof undefined && $(this).attr('data-loadthumbs') !== false){
            var urlaj = $(this).attr('data-loadthumbs'); //actual url for the ajax call, returns json
            var url = $(this).attr('href'); //real world url, also used if js disabled
            lenny.ajax.loadThumbs(url,urlaj);
        }
        */
        //navigate to next pic in album
        else if(typeof $(this).attr('data-next') !== typeof undefined && $(this).attr('data-next') !== false){
            lenny.navigation.changePic(1);
        }
        //navigate to previous pic in album
        else if(typeof $(this).attr('data-prev') !== typeof undefined && $(this).attr('data-prev') !== false){
            lenny.navigation.changePic(-1);
        }
    });


    window.onpopstate = function(e){
        if(e.state){
            curralb.currpic = Math.max(curralb.currpic - 1,0);
            document.getElementById("sitecontent").innerHTML = e.state.html;
            document.title = e.state.pageTitle;
        }
    };

});

