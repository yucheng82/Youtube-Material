(function(angular) {
    youtubeApp.controller('videoPageController', ['$rootScope', '$scope', '$state', '$stateParams', 'searchService',
        function($rootScope, $scope, $state, $stateParams, searchService) {
            $scope.formatVideoDetails = function() {
                if (moment().format("M D YY") == moment($scope.video.snippet.publishedAt).format("M D YY")) {
                    $scope.uploadedTime = moment($scope.video.snippet.publishedAt)
                        .fromNow();
                } else {
                    $scope.uploadedTime = moment($scope.video.snippet.publishedAt)
                        .format("Do MMMM YYYY");
                }

                $rootScope.$$childHead.query = "";
                $scope.viewCount = parseInt($scope.video.statistics.viewCount).toLocaleString();
                var likes = isNaN(parseInt($scope.video.statistics.likeCount))?0:parseInt($scope.video.statistics.likeCount);
                var dislikes = isNaN(parseInt($scope.video.statistics.dislikeCount))?0:parseInt($scope.video.statistics.dislikeCount);
                $scope.likeCount = likes.toLocaleString();
                $scope.dislikeCount = dislikes.toLocaleString();
                $scope.dislikeWidth = {
                    'width' : ((dislikes / (likes + dislikes)) * 100) + '%'
                };

                if ($scope.video.snippet.description.length > 300) {
                    $scope.isExpandable = true;
                    $scope.expandDescriptionBar = "Expand Description";
                    $scope.expandDescription = function() {
                        if ($scope.description == "expanded-description") {
                            $scope.description = "";
                            $scope.expandDescriptionBar = "Expand Description";
                            angular.element(document).scrollToElementAnimated(videoInfo);
                        } else {
                            $scope.description = "expanded-description";
                            $scope.expandDescriptionBar = "Collapse Description";
                        }
                    }
                }
            }

            $scope.loadMoreComments = function(pageToken) {
                var parameters = {
                    'videoId': $scope.videoId,
                    'pageToken': pageToken,
                    'order': $scope.order
                }
                $scope.commentsLoader = true;
                searchService.getComments(parameters).then(function(moreComments) {
                    $scope.comments.items = $scope.comments.items.concat(moreComments.items);
                    $scope.comments.nextPageToken = moreComments.nextPageToken;
                    $scope.commentsLoader = false;
                });
            }

            $scope.sortComments = function(order) {
                $scope.order = order;
                var parameters = {
                    'videoId': $scope.videoId,
                    'order': ($scope.order) ? $scope.order : 'relevance'
                }
                $scope.commentsLoader = true;
                $scope.comments = null;
                searchService.getComments(parameters).then(function(comments) {
                    $scope.comments = comments;
                    $scope.commentsLoader = false;
                }, function(reason) {
                    if (reason.error.errors[0].reason = "commentsDisabled") {
                        $scope.commentsEnabled = false;
                    }
                });
            }

            $scope.init = function() {
                angular.element(document).scrollTo(0, 0, 700);
                $scope.videoId = $stateParams.id;
                $scope.order = 'relevance';
                $scope.commentsEnabled = true;
                $scope.commentsLoader = true;
                var parameters = {
                    'videoId' : $scope.videoId,
                    'part' : 'snippet,statistics',
                    'fields' : 'items(snippet(publishedAt,channelId,description,title),statistics(commentCount,dislikeCount,likeCount,viewCount))'
                }
                searchService.getVideos(parameters)
                    .then(function(video) {
                        $scope.video = video.items[0];
                        $scope.formatVideoDetails();
                        var parameters = {
                            'part': 'snippet',
                            'channelId': $scope.video.snippet.channelId,
                            'fields': 'items(id,snippet(thumbnails/default,title))'
                        }
                        searchService.getChannel(parameters)
                            .then(function(channel) {
                                $scope.channel = channel;
                            });
                    });

                var parameters = {
                    'relatedToVideoId': $scope.videoId,
                    'maxResults': 20
                }
                searchService.searchVideos(parameters)
                    .then(function(videos) {
                        $scope.relatedVideos = videos.items;

                        var parameters = {
                            'videos': $scope.relatedVideos,
                            'part': 'statistics,contentDetails'
                        }
                        searchService.getVideoDetails(parameters)
                            .then(function(videoDetails) {
                                $scope.videoDetails = videoDetails;
                            });

                        var parameters = {
                            'videosToMap': $scope.relatedVideos,
                            'fields': 'items(id,snippet/thumbnails/default)'
                        }
                        searchService.getMappedChannels(parameters)
                            .then(function(mappedChannels) {
                                $scope.channels = mappedChannels;
                            });
                    });
            }
        }
    ]);
})(window.angular);
