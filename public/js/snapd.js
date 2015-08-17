
angular.module('snapd',[]).controller('snapdc',function($scope,$http,$window,$timeout){
    $scope.albums = 0; //minimal details of all albums
    $scope.album = 0; //the album currently being viewed
    $scope.currentview; //will either be 'home','album' or 'thumbs'
    $scope.currentpic = 0;
    $scope.albumpicwidth = 0;
    $scope.albumpicheight = 0;
    $scope.promise;

    //aspects of the url, used for ajax requests and url manipulation
    //FIXME might not need all of these eventually
    $scope.url_base = window.location['protocol'] + '//' + window.location['host'];
    $scope.url_sitepath = '/snapd-angular'; //FIXME
    $scope.url_fullpath = $scope.url_base + $scope.url_sitepath;

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
    $scope.getAlbumList();

    //called on page resize, checks size of page and sets dimensions for album pics accordingly
    $scope.getAlbumPicSize = function(){
        var page = document.getElementsByTagName('html')[0];
        $scope.albumpicheight = page.offsetHeight - 100;
        //var im = document.getElementsByClassName('imagewrapper selected');
        //$scope.albumpicwidth = im.offsetWidth;
        $scope.albumpicwidth = page.offsetWidth;
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
        $scope.getAlbumPicSize();
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
        console.log('updatePageURL: ',url);
        window.history.pushState({"view":$scope.currentview,"pageTitle":document.title,"pic":$scope.currentpic,"album":$scope.album},"",url);
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
});

