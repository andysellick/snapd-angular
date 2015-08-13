
angular.module('snapd',[]).controller('snapdc',function($scope,$http){
    $scope.albums = 0; //minimal details of all albums
    $scope.album = 0; //the album currently being viewed
    $scope.currentview; //will either be 'home','album' or 'thumbs'
    $scope.currentpic = 0;

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
        console.log('updatePageURL: ',url);
        window.history.pushState({"view":$scope.currentview,"pageTitle":document.title,"pic":$scope.currentpic,"album":$scope.album},"",url);
    }

    //called on browser back, updates relevant stuff
    $scope.setView = function(view,pic,album){
        console.log('setView ',view,pic,album);
        $scope.currentview = view;
        $scope.currentpic = pic;
        $scope.album = album;
        console.log($scope.currentview);
        $scope.$apply();
    }


});

angular.element(document).ready(function(){
    window.onpopstate = function(e){
        if(e.state){
            document.title = e.state.pageTitle;
            angular.element(document.getElementById('sitecontent')).scope().setView(e.state.view,e.state.pic,e.state.album);
        }
    };
});

