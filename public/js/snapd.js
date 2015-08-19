
angular.module('snapd',[]).controller('snapdc',function($scope,$http,$window,$timeout){
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
        console.log(here);
        if(here.length > 0){
            if(here[0] == 'album'){
                var url = '/album-data/' + here[1] + '/' + here[2] + '/' + here[3] + '/' + here[4] + '/'; //FIXME
                $scope.currentpic = parseInt(here[5]);
                $scope.getAlbum(url,here[0]);
            }
            else if(here[0] == 'thumbs'){
            }
        }
        else {
            $scope.getAlbumList(); //we're on the homepage, init
        }
    }

    //retrieve JSON list of all albums via ajax (on homepage load)
    $scope.getAlbumList = function(event){
        if($scope.albums.length){
            $scope.currentview = 'home';
            $scope.currentpic = 0;
            $scope.album = 0;
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
    $scope.getAlbumPicSize = function(){
        $scope.albumpicwidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
        $scope.albumpicheight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        console.log('getAlbumPicSize ',$scope.albumpicwidth,$scope.albumpicheight);
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
            });
            rp.error(function(data, status, headers, config) {
                alert("AJAX failed!");
            });
        }
        else {
            $scope.currentview = view;
        }
    }

    //show album
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

    //navigate to previous picture
    $scope.showPrev = function(){
        $scope.currentpic = Math.max($scope.currentpic - 1,0);
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
    }
    //navigate to next picture
    $scope.showNext = function(){
        $scope.currentpic = Math.min($scope.currentpic + 1,$scope.album.size);
        $scope.updatePageURL($scope.url_sitepath + '/album' + $scope.album.link + $scope.currentpic); //FIXME
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
    };

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