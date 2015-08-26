
angular.module('snapd',[]).controller('snapdc',function($scope,$http,$window,$timeout,$compile){
    $scope.albums = 0; //minimal details of all albums
    $scope.album = 0; //the album currently being viewed
    $scope.currentview = 'home'; //will either be 'home','album' or 'thumbs'
    $scope.currentpic = 0;
    $scope.albumpicwidth = 0;
    $scope.albumpicheight = 0;
    $scope.promise;

    //aspects of the url, used for ajax requests and url manipulation
    //FIXME might not need all of these eventually
    $scope.url_base = window.location['protocol'] + '//' + window.location['host'];
    $scope.url_sitepath = '/snapd-angular'; //FIXME
    $scope.url_fullpath = $scope.url_base + $scope.url_sitepath;

    //on page load figure out what the current url is and therefore what to show
    $scope.getCurrentLocation = function(){
        var here = window.location.href;
        here = here.replace($scope.url_fullpath,'');
        here = here.split('/');
        here.clean('');
        //console.log(here);
        if(here.length > 0){
            if(here[0] == 'album' || here[0] == 'thumbs'){
                var url = '/album-data/' + here[1] + '/' + here[2] + '/' + here[3] + '/' + here[4] + '/'; //FIXME
                $scope.currentpic = parseInt(here[5]);
                $scope.getAlbum(url,here[0]);
            }
        }
        else {
            $scope.getAlbumList(); //we're on the homepage, init
        }
    }

    //retrieve JSON list of all albums via ajax (on homepage load)
    $scope.getAlbumList = function(event){
        document.title = 'snapd';
        $scope.album = 0;
        if($scope.albums.length){
            $scope.currentview = 'home';
            $scope.currentpic = 0;
            $scope.updatePageURL($scope.url_sitepath);
        }
        else {
            var rp = $http.get($scope.url_fullpath + "/home-data");
            rp.success(function(data, status, headers, config) {
                $scope.albums = data;
                $scope.currentview = 'home';
                $scope.updatePageURL($scope.url_sitepath);
            });
            rp.error(function(data, status, headers, config) {
                alert("AJAX failed!");
            });
        }
    }

    //called on page resize, checks size of page and sets dimensions for album pics accordingly
    //backend takes these two values and does the work to return an image that fits in the space - may be taller or narrower
    $scope.getAlbumPicSize = function(){
        $scope.albumpicwidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
        $scope.albumpicheight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        //console.log('getAlbumPicSize ',$scope.albumpicwidth,$scope.albumpicheight);
    }

    //change view, retrieve JSON of an album if necessary
    //FIXME need to check if we already have THIS album
    $scope.getAlbum = function(url,view){
        if(!$scope.album){
            var rp = $http.get($scope.url_fullpath + url);
            rp.success(function(data, status, headers, config) {
                $scope.album = data;
                $scope.currentview = view;
                document.title = $scope.album.title + ' | snapd';
                $scope.mapstate = 1;
                $scope.doMap();
            });
            rp.error(function(data, status, headers, config) {
                alert("AJAX failed!");
            });
        }
        else {
            $scope.currentview = view;
        }
    }

    //show album, called on click of album link
    $scope.loadAlbum = function(url,fakeurl,pic){
        pic = typeof pic !== 'undefined' ? pic : 0;
        $scope.updatePageURL(fakeurl);
        $scope.getAlbum(url,'album');
        $scope.currentpic = pic;
    }

    //show thumbs
    $scope.loadThumbs = function(url,fakeurl){
        $scope.updatePageURL(fakeurl);
        $scope.getAlbum(url,'thumbs');
    }

    //FIXME make the marker change when the photo is selected
    //navigate to previous picture
    $scope.showPrev = function(apply){
        $scope.currentpic = Math.max($scope.currentpic - 1,0);
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
        $scope.highlightMarker();
        if(apply){
            $scope.$apply(); //needed to action keypress event for some reason, but causes problem on ng-click
        }
    }
    //navigate to next picture
    $scope.showNext = function(apply){
        $scope.currentpic = Math.min($scope.currentpic + 1,$scope.album.size);
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
        $scope.highlightMarker();
        if(apply){
            $scope.$apply();
        }
    }

    //triggered when we navigate to a new photo, highlight the current photo on the map
    $scope.highlightMarker = function(){
        var curr = $scope.currentpic;
        //console.log('change marker ', $scope.currentpic, curr);
        if(curr < $scope.album.size - 1){
            for(var i = 0; i < $scope.markers.length; i++){ //not all photos may have a marker, so check first
                if($scope.markers[i]){
                    $scope.markers[i].setIcon($scope.url_fullpath + '/public/img/' + 'marker.png'); //FIXME reuse this variable
                    $scope.markers[i].setZIndex(i);
                }
            }
            if($scope.markers[curr]){
                $scope.markers[curr].setIcon($scope.url_fullpath + '/public/img/' + 'marker_current.png'); //FIXME reuse this variable
                $scope.markers[curr].setZIndex(100);
            }
        }
    }

    //change current url without reloading the page
    //http://stackoverflow.com/questions/824349/modify-the-url-without-reloading-the-page/3354511#3354511
    $scope.updatePageURL = function(url){
        url = $scope.url_base + url;
        //console.log('updatePageURL: ',url);
        if($window.history.pushState){ //fix for older browsers
            $window.history.pushState({"view":$scope.currentview,"pageTitle":document.title,"pic":$scope.currentpic,"album":$scope.album},"",url);
        }
    }

    //called on browser back, updates relevant stuff
    $scope.setView = function(view,pic,album){
        //console.log('setView ',view,pic,album);
        $scope.currentview = view;
        $scope.currentpic = pic;
        $scope.album = album;
        //console.log($scope.currentview);
        $scope.$apply();
    }

    //click in an infowindow, change to picture chosen
    $scope.switchPic = function(pic){
        $scope.currentpic = pic;
    }

    $scope.map = 0;
    $scope.markers = [];
    $scope.infolinks = [];

    //FIXME still a bug going from thumbs to album, map not initing correctly
    //given an album with lat long data, generate and insert a google map for it
    $scope.doMap = function(){

        //only create a map if it doesn't exist already
        if($scope.map == 0){
            //console.log('creating map');
            $scope.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 20,
            });
        }
        else {
            //console.log('clearing map');
            $scope.deleteMarkers();
        }

        $scope.infolinks = [];
        var bounds = new google.maps.LatLngBounds(null);
        var infowindow = new google.maps.InfoWindow();
        var iconpath = $scope.url_fullpath + '/public/img/';

        for(var i = 0; i < $scope.album.size; i++){
            var latlong = $scope.album[i]['latlong'];
            //console.log(latlong);
            if(latlong.length){
                latlong = latlong.split(',');
                latlong = {lat:parseFloat(latlong[0]), lng:parseFloat(latlong[1].trim())};
                //console.log(latlong);
                var marker = new google.maps.Marker({
                    position: latlong,
                    map: $scope.map,
                    zIndex: i,
                    icon: iconpath + 'marker.png'
                });

                bounds.extend(marker.position);
                //links to go into the infowindows
                //in order for the ng-click to work, we need to $compile them against the scope
                //however, doing so repeats itself, which is why each has to be done as a separate entity
                var lnk = '<span ng-click="switchPic(' + i + ')">' + $scope.album[i]['desc'] + '<br/><span class="faux_link">View</span></span>';
                $scope.infolinks[i] = $compile(lnk)($scope);
                google.maps.event.addListener(marker, 'click', (function(marker, i) {
                    return function() {
                      infowindow.setContent($scope.infolinks[i][0]);
                      infowindow.open($scope.map, marker);
                    }
                  })(marker, i));
                //$scope.markers.push(marker); //add marker to our list
                $scope.markers[i] = marker;
            }
        }
        //fitbounds doesn't work the second time, leaves the map too zoomed out
        //hacky but works: http://stackoverflow.com/questions/3873195/calling-map-fitbounds-multiple-times-in-google-maps-api-v3-0
        setTimeout(function() {$scope.map.fitBounds(bounds);},1);
    }

    //remove markers from map
    $scope.deleteMarkers = function() {
        if($scope.markers.length){
            for(var i = 0; i < $scope.markers.length; i++) {
                $scope.markers[i].setMap(null);
            }
        }
        $scope.markers = [];
        $scope.map.setZoom(20);
    }
    
    $scope.mapstate = 1; //FIXME should move all these variables up to the top at some point
    
    //show/hide map on click of element, triggered action mostly handled by CSS
    $scope.toggleMap = function(el){
        var states = [0,1,2];
        if($scope.mapstate == 0){
            $scope.mapstate = 1;
        }
        else {
            $scope.mapstate = 0;
        }
        //angular.element(el.currentTarget).toggleClass('hide');
    }


    //update size of album images if page is resized. Use timeout to give a slight delay
    $window.onresize = function(){
        $timeout.cancel($scope.promise);
        $scope.promise = $timeout(function(){$scope.getAlbumPicSize();},500);
    }

    //FIXME there's still a bug here to do with going from homepage to album and back again, using forward
    //on browser back/forward update page state
    $window.onpopstate = function(e){
        if(e.state){
            document.title = e.state.pageTitle;
            $scope.setView(e.state.view,e.state.pic,e.state.album);
        }
    }
    
    //handle key presses for next/prev navigation with cursor keys
    document.addEventListener('keydown', function(e){
        e = e || window.event;
        if($scope.currentview == 'album'){
            if(e.keyCode == 39 || e.keyCode == 40){
                $scope.showNext(1);
            }
            if(e.keyCode == 37 || e.keyCode == 38){
                $scope.showPrev(1);
            }
        }
    });

    //be clever and apply a top/bottom margin to each image to centre it in the page and ensure the caption is always at the bottom
    //this works on next/prev because images are already loaded but not on initial album load
    //...sooooo... yeah. I've done it in CSS instead. Works fine. Leaving this here for the moment for reference
    $scope.adjustImagePos = function(){
        var cheight = document.getElementsByClassName('image' + $scope.currentpic);
        var currimg = cheight[0];
        cheight = ($scope.albumpicheight - currimg.height) / 2;
        //console.log(cheight);
        currimg.setAttribute('style','margin-top:' + cheight + "px;" + 'margin-bottom:' + cheight + "px");
    }


    $scope.getAlbumPicSize();
    $scope.getCurrentLocation(); //on page load, check to see where we are
});

//http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};