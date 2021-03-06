
angular.module('snapd',['ngTouch']).controller('snapdc',function($scope,$http,$window,$timeout,$compile){
    $scope.albums = 0; //minimal details of all albums
    $scope.album = 0; //the album currently being viewed
    $scope.currentview = 'home'; //will either be 'home','album' or 'thumbs'
    $scope.currentpic = 0;
    $scope.albumpicwidth = 0;
    $scope.albumpicheight = 0;
    $scope.promise;
    $scope.loading;
    $scope.loginstatus = 0;
    $scope.showloginform = 0;
    $scope.loginmsg = '';

    //aspects of the url, used for ajax requests and url manipulation
    //FIXME might not need all of these eventually
    $scope.url_base = window.location['protocol'] + '//' + window.location['host'];
    $scope.url_sitepath = '/snapd'; //FIXME
    $scope.url_fullpath = $scope.url_base + $scope.url_sitepath;
    $scope.url_mediapath = $scope.url_fullpath + '/public/img/';

    //map variables
    $scope.map = 0;
    $scope.markers = [];
    $scope.infolinks = [];
    $scope.mapstate = 1;
    $scope.infowindow = new google.maps.InfoWindow();
    $scope.albumClutter = 1;
    
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
    
    $scope.doMasonry = function(){
        //console.log('doMasonry');
		var msnry = new Masonry('.grid',{
			itemSelector: '.col'
		});
	}

    //retrieve JSON list of all albums via ajax (on homepage load)
    $scope.getAlbumList = function(event){
        document.title = 'snapd';
        $scope.album = 0;
        if($scope.albums.length){
            $scope.currentview = 'home';
            $scope.currentpic = 0;
            $scope.updatePageURL($scope.url_sitepath);
            $timeout($scope.doMasonry,0);
        }
        else {
            var rp = $http.get($scope.url_fullpath + "/home-data");
            $scope.loading = 'on';
            rp.success(function(data, status, headers, config) {
                $scope.loginstatus = data['loginstatus'];
                $scope.albums = data['albums'];
                $scope.currentview = 'home';
                $scope.updatePageURL($scope.url_sitepath);
                $scope.loading = '';
                $timeout($scope.doMasonry,0);
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
    }

    //change view, retrieve JSON of an album if necessary
    $scope.getAlbum = function(url,view){
        if(!$scope.album){
            var rp = $http.get($scope.url_fullpath + url);
            $scope.loading = 'on';
            rp.success(function(data, status, headers, config) {
                $scope.album = data;
                $scope.switchView(view);
                $scope.mapstate = 1;
                document.title = $scope.album.title + ' | snapd';
                $scope.loading = '';
            });
            rp.error(function(data, status, headers, config) {
                alert("AJAX failed!");
            });
        }
        else {
            $scope.switchView(view);
        }
    }

    //generic function for changing view, consolidating due to map
    $scope.switchView = function(view){
        $scope.currentview = view;
        $scope.doMap(); //if we load thumbs first then go to album, map is initialised in a hidden state and therefore breaks
    }

    //show album, called on click of album link or clicking on thumbnail in thumbs view
    $scope.loadAlbum = function(url,fakeurl,pic){
        //console.log('loadAlbum');
        pic = typeof pic !== 'undefined' ? pic : 0;
        $scope.updatePageURL(fakeurl);
        $scope.getAlbum(url,'album');
        $scope.currentpic = pic;
        $scope.highlightMarker(1);
    }

    //show thumbs, called on click from main page
    $scope.loadThumbs = function(url,fakeurl){
        $scope.updatePageURL(fakeurl);
        $scope.getAlbum(url,'thumbs');
    }

    //navigate to previous picture
    $scope.showPrev = function(apply){
        $scope.currentpic = Math.max($scope.currentpic - 1,0);
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
        $scope.highlightMarker(1);
        if(apply){
            $scope.$apply(); //needed to action keypress event for some reason, but causes problem on ng-click
        }
    }
    //navigate to next picture
    $scope.showNext = function(apply){
        $scope.currentpic = Math.min($scope.currentpic + 1,$scope.album.size);
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
        $scope.highlightMarker(1);
        if(apply){
            $scope.$apply();
        }
    }

    //show or hide everything in an album apart from navigation
    $scope.toggleAlbumClutter = function(state,apply){
        $scope.albumClutter = state;
        if(apply){
            $scope.$apply(); //needed to action keypress event for some reason, but causes problem on ng-click
        }
    }

    //triggered when we navigate to a new photo, highlight the current photo on the map
    //resetmap flags whether we should move the map to show all markers - true when next/prev, not so elsewhere
    $scope.highlightMarker = function(resetmap){
        var curr = $scope.currentpic;
        if(curr <= $scope.album.size){ //fixme weird bug here - if we're on the last image in an album this doesn't work, but that's kind of what we want
            var bounds = new google.maps.LatLngBounds(null);
            for(var i = 0; i < $scope.markers.length; i++){
                if($scope.markers[i]){ //not all photos may have a marker, so check first
                    $scope.markers[i].setIcon($scope.url_mediapath + 'marker.png');
                    $scope.markers[i].setZIndex(i);
                    $scope.infowindow.close();
                    if(resetmap){
                        bounds.extend($scope.markers[i].position);
                    }
                }
            }
            if(resetmap){
                //setTimeout(function() {$scope.map.fitBounds(bounds);},1);
                $timeout(function(){
					$scope.map.fitBounds(bounds);
		            //google.maps.event.trigger($scope.map, "resize");
		        },500);
            }
            if($scope.markers[curr]){ //because photo may not have a position
                $scope.markers[curr].setIcon($scope.url_mediapath + 'marker_current.png');
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
        $scope.switchView(view);
        $scope.currentpic = pic;
        $scope.album = album;
        //console.log($scope.currentview);
        $scope.$apply();
    }

    //click in an infowindow, change to picture chosen
    $scope.switchPic = function(pic){
        $scope.currentpic = pic;
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
        $scope.highlightMarker();
        $scope.toggleMap(1);
    }
    
    //open current image at full size
    $scope.viewFullSize = function(){
        //console.log($scope.album[$scope.currentpic]['pic']);
        document.getElementById('fullimage').innerHTML = '<img src="' + $scope.url_mediapath + 'pics/' + $scope.album[$scope.currentpic]['pic'] + '"/>';
        $scope.fullimage = 'on';
    }
    
    $scope.closeFullSize = function(){
        $scope.fullimage = '';
    }

    //FIXME still a bug going from thumbs to album, map not initing correctly
    //given an album with lat long data, generate and insert a google map for it
    $scope.doMap = function(){
        //console.log('doMap');
        //only init the map if we're on the album page, where it is visible
        if($scope.currentview == 'album'){
            //only create a map if it doesn't exist already
            if($scope.map == 0){
                //console.log('creating map');
                $scope.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 20,
                    disableDefaultUI: true
                });
            }
            else {
                //console.log('clearing map');
                $scope.deleteMarkers();
            }
    
            $scope.infolinks = [];
            var bounds = new google.maps.LatLngBounds(null);
    
            for(var i = 0; i <= $scope.album.size; i++){
                var latlong = $scope.album[i]['latlong'];
                //console.log(latlong);
                if(latlong.length){
                    latlong = latlong.split(',');
                    latlong = {lat:parseFloat(latlong[0]), lng:parseFloat(latlong[1].trim())};
                    //console.log(latlong);
                    var markerimg = 'marker.png';
                    var zindex = i;
                    if(i == $scope.currentpic){
                        markerimg = 'marker_current.png';
                        zindex = 100;
                    }
                    /* zoom is apparently needed even though we don't use it - http://stackoverflow.com/questions/19704609/google-maps-api-3-type-error-a-is-undefined */
                    var marker = new google.maps.Marker({
                        position: latlong,
                        map: $scope.map,
                        zIndex: zindex,
                        icon: $scope.url_mediapath + markerimg,
                        zoom:1
                    });
    
                    bounds.extend(marker.position);
                    //links to go into the infowindows
                    //in order for the ng-click to work, we need to $compile them against the scope
                    //however, doing so repeats itself, which is why each has to be done as a separate entity
                    var lnk = '<span ng-click="switchPic(' + i + ')">' + $scope.album[i]['desc'] + '<br/><span class="faux_link">View</span></span>';
                    $scope.infolinks[i] = $compile(lnk)($scope);
                    google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        return function() {
                            $scope.infowindow.setContent($scope.infolinks[i][0]);
                            $scope.infowindow.open($scope.map, marker);
                        }
                      })(marker, i));
                    $scope.markers[i] = marker; //add marker to our list but retain index
                }
            }
            google.maps.event.addListener($scope.map, "click", function() {$scope.infowindow.close();});
            //fitbounds doesn't work the second time, leaves the map too zoomed out
            //hacky but works: http://stackoverflow.com/questions/3873195/calling-map-fitbounds-multiple-times-in-google-maps-api-v3-0
            setTimeout(function() {$scope.map.fitBounds(bounds);},1);
        }
    }

    //remove markers from map
    $scope.deleteMarkers = function() {
        if($scope.markers.length){
            for(var i = 0; i < $scope.markers.length; i++) {
                if($scope.markers[i]){
                    $scope.markers[i].setMap(null);
                }
            }
        }
        $scope.markers = [];
        $scope.map.setZoom(20);
    }
    

    //show/hide map on click of element, triggered action mostly handled by CSS
    $scope.toggleMap = function(stat){
        $scope.mapstate = stat;
        $scope.highlightMarker(1);
        //setTimeout(function() {$scope.map.fitBounds(bounds);},1);
        $timeout(function(){
            google.maps.event.trigger($scope.map, "resize");
            $scope.highlightMarker(1);
        },500); //FIXME do all the other settimeouts need to use $timeout??
        //FIXME this is getting close but needs to refit the map to bounds on resize
    }

    $scope.showLogin = function(showhide){
        $scope.showloginform = showhide;
        $scope.loginmsg = '';
        if(showhide == 1){
            $timeout(function(){
                document.getElementById('username').focus();
            },0);
        }
    }

    $scope.login = function(){
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        if(username.length && password.length){
            var postdata = {
                            'username':username,
                            'password':password
            };
            //console.log(username,password);
            var rp = $http.post($scope.url_fullpath + "/login",postdata);
            $scope.loading = 'on';
            rp.success(function(data, status, headers, config) {
                if(data['loginstatus'] == '1'){
                    $scope.loginstatus = data['loginstatus'];
                    $scope.albums = data['albums'];
                    $scope.currentview = 'home';
                    $scope.updatePageURL($scope.url_sitepath);
                    $scope.loading = '';
                    $scope.showLogin(0);
                    $timeout($scope.doMasonry,0);
                }
                else {
                    $scope.loginmsg = 'Incorrect username or password';
                    $scope.loading = '';
                }
            });
            rp.error(function(data, status, headers, config) {
                alert("AJAX failed!");
            });
        }
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    $scope.logout = function(){
        var rp = $http.get($scope.url_fullpath + "/logout");
        $scope.loading = 'on';
        rp.success(function(data, status, headers, config) {
            $scope.loginstatus = data['loginstatus'];
            $scope.albums = data['albums'];
            $scope.currentview = 'home';
            $scope.updatePageURL($scope.url_sitepath);
            $scope.loading = '';
            $timeout($scope.doMasonry,0);
            //console.log(data);
        });
        rp.error(function(data, status, headers, config) {
            alert("AJAX failed!");
        });
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
        if($scope.currentview == 'album' && $scope.fullimage != 'on'){ //only do the keys if in the album and full size is not active
            if(e.keyCode == 39){ //right
                $scope.showNext(1);
            }
            if(e.keyCode == 37){ //left
                $scope.showPrev(1);
            }
            if(e.keyCode == 40){ //down
                $scope.toggleAlbumClutter(0,1); //hide caption, map, etc.
            }
            if(e.keyCode == 38){ //up
                $scope.toggleAlbumClutter(1,1); //show map, caption, etc.
            }
        }
    });

    //be clever and apply a top/bottom margin to each image to centre it in the page and ensure the caption is always at the bottom
    //this works on next/prev because images are already loaded but not on init ial album load
    //...sooooo... yeah. I've done it in CSS instead. Works fine. Leaving this here for the moment for reference
    /*
    $scope.adjustImagePos = function(){
        var cheight = document.getElementsByClassName('image' + $scope.currentpic);
        var currimg = cheight[0];
        cheight = ($scope.albumpicheight - currimg.height) / 2;
        //console.log(cheight);
        currimg.setAttribute('style','margin-top:' + cheight + "px;" + 'margin-bottom:' + cheight + "px");
    }
    */
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

