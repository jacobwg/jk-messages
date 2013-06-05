var app = angular.module('app', []);

if (store.get('version') !== 8) {
  store.remove('messages');
  store.set('version', 8);
}

var formatDuration = function(duration) {
  var days = parseInt(duration.asDays(), 10);
  return days === 1 ? '1 day' : days + ' days';
};

app.controller('MessagesController', ['$scope', '$timeout',
  function($scope, $timeout) {

    // Safe apply
    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };

    // Application State (loading, anonymous, authorizing, authorized-updating, authorized-current, unauthorized)
    $scope.state = 'loading';

    // Authentication
    $scope.auth = {};
    $scope.users = {};
    $scope.onlineUsers = [];

    // Messages
    $scope.messages = [];
    $scope.seen = {};
    $scope.hasMessagesToday = false;

    // Data
    $scope.data = {currentMessage: 0};
    $scope.firstDate = 1344867195;
    $scope.firstMoment = moment.unix($scope.firstDate);
    $scope.currentDate = 1344867195; //moment().unix();
    $scope.durationMessages = formatDuration(moment.duration(moment() - moment('2012-08-13 9:13am CST')));
    $scope.durationRelationship = formatDuration(moment.duration(moment() - moment('2012-10-21 1pm CST')));

    $scope.cache = {
      currentMoment: {},
      currentDateStart: {},
      currentDateEnd: {},
      nextDay: {},
      prevDay: {}
    };

    var cache = function(store, key, value) {
      store[key] = store[key] || value();
      return store[key];
    };

    $scope.$watch('currentDate', function() {
      $scope.currentMoment = cache($scope.cache.currentMoment, $scope.currentDate, function() {
        return moment.unix($scope.currentDate);
      });

      $scope.nextDay = cache($scope.cache.nextDay, $scope.currentDate, function() {
        return moment($scope.currentMoment).add('days', 1).format('YYYY-MM-DD');
      });

      $scope.prevDay = cache($scope.cache.prevDay, $scope.currentDate, function() {
        return moment($scope.currentMoment).subtract('days', 1).format('YYYY-MM-DD');
      });

      $scope.startOfCurrentDay = cache($scope.cache.currentDateStart, $scope.currentDate, function() {
        return $scope.currentMoment.startOf('day').unix();
      });

      $scope.endOfCurrentDay = cache($scope.cache.currentDateEnd, $scope.currentDate, function() {
        return $scope.currentMoment.endOf('day').unix();
      });

      document.title = $scope.currentMoment.format('dddd, MMMM Do YYYY') + ' | The J&K Messages';
    });

    $scope.showSeen = function(id) {
      return !!($scope.seen[id]);
    };

    $scope.formattedSeen = function(id) {
      if ($scope.showSeen(id)) {
        return '✓ Seen by ' + _.map($scope.seen[id], function(person) { return '<span title="' + moment.unix(person.time).format("dddd, MMMM Do YYYY, h:mm:ss a") + '">' + person.name + '</span>'; }).join(', ');
      }
    };

    $scope.showOnline = function() {
      return $scope.onlineUsers.length > 0;
    };

    $scope.formattedOnline = function() {
      return _.map($scope.onlineUsers, function(user) { return user.name; }).join(', ');
    };

    var db = new Firebase('https://jacob-and-kathryn.firebaseio.com/');

    var usersDB = db.child('users');
    var messagesDB = db.child('messages');
    var dataDB = db.child('data');
    var seenDB = db.child('seen');
    var connectedDB = db.child('.info/connected');

    var loadMessages = function() {
      $scope.messages = [];
      $scope.state = 'authorized-updating';
      messagesDB.off();
      messagesDB.startAt($scope.startOfCurrentDay).endAt($scope.endOfCurrentDay).on('value', function(snap) {
        $scope.safeApply(function() {
          $scope.messages = _.filter(snap.val(), function(message) { return message !== undefined; });
          $scope.hasMessagesToday = ($scope.messages.length > 0);
          $scope.state = 'authorized-current';
        });
      });
    };

    $scope.$watch('currentDate', function() {
      if ($scope.state === 'authorized-current' || $scope.state === 'authorized-updating') {
        loadMessages();
      }
    });

    var trackPresence = function() {
      var onlineRef = usersDB.child('fb-' + $scope.auth.id).child('online');
      connectedDB.on('value', function(snap) {
        if (snap.val() === true) {
          // We're connected (or reconnected)!  Set up our presence state and tell
          // the server to remove it when we leave.
          onlineRef.onDisconnect().remove();
          onlineRef.set(true);
        }
      });
    };

    var authSetUp = false;
    var setUpAuth = function(user) {
      if (authSetUp) return;
      authSetUp = true;

      if ($scope.users['fb-' + user.id]) {
        $scope.auth = user;
        $scope.state = 'authorized-updating';

        seenDB.on('value', function(snap) {
          $scope.safeApply(function() {
            $scope.seen = snap.val();
          });
        });

        dataDB.on('value', function(snap) {
          $scope.safeApply(function() {
            $scope.data = snap.val();
          });
          loadMessages();
        });

        trackPresence();
      } else {
        $scope.state = 'unauthorized';
      }
    };

    var authClient = new FirebaseAuthClient(db, function(error, user) {
      if (error) {
        console.log(error);
      } else if (user) {
        $scope.safeApply(function() {
          $scope.auth = user;
          $scope.state = 'authorizing';
        });

        usersDB.on('value', function(snap) {
          $scope.safeApply(function() {
            $scope.users = snap.val();
            $scope.onlineUsers = _.filter($scope.users, function(user) { return user.online; });

            setUpAuth(user);
          });
        });
      } else {
        $scope.safeApply(function() {
          $scope.state = 'anonymous';
        });
      }
    });

    $scope.login = function() {
      authClient.login('facebook', {
        rememberMe: true,
        scope: 'email'
      });
    };

    $scope.logout = function() {
      authClient.logout();
      window.location.reload();
    };

    $scope.$watch('state + currentDate + messages', function() {
      if ($scope.state === 'authorized-current') {
        _.each($scope.messages, function(message, id) {
          seenDB.child(message.local_id).child('fb-' + $scope.auth.id).set({
            name: $scope.auth.first_name,
            time: moment().unix()
          });
        });
      }
    });

    // Routing
    var goToDate = function(date) {
      $scope.safeApply(function() {
        $scope.currentDate = moment(date).unix();
      });
    };

    var goToLast = function() {
      $scope.safeApply(function() {
        $scope.currentDate = $scope.data.lastMessageTime || $scope.firstDate;
      });
    };

    var routes = {
      '/:date' : goToDate,
      '/' : goToLast
    };

    var router = Router(routes);
    router.init('/');

    $scope.$watch('messages', function() {
      if (router.getRoute()[0] === '') {
        goToLast();
      }
    });

    // Expose scope for debugging
    window.s = $scope;

  }
]);
