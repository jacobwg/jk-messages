var app = angular.module('app', []);

var formatDuration = function(duration) {
  var days = parseInt(duration.asDays());
  return days === 1 ? '1 day' : days + ' days';
};

var getAuthorName = function(author_id) {
  if (author_id === 100003843585453) {
    return 'Kathryn Elizabeth';
  } else {
    return 'Jacob Gillespie';
  }
};

var getAuthorKey = function(author_id) {
  if (author_id === 100003843585453) {
    return 'kathryn';
  } else {
    return 'jacob';
  }
};

var formatDate = function(date) {
  return date.format('default');
};

var messageHeader = function(message) {
  return formatDate(new Date(message.created_time * 1000)) + ' - ' + getAuthorName(message.author_id) + ':';
};

var simpleFormat = function(content) {
  content = content.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
  content = '<p>' + content + '</p>';
  return content.autoLink();
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

    // Authentication
    $scope.loggedIn = false;
    $scope.authenticated = 'loading';
    $scope.auth = {};

    // Messages
    $scope.hasMessagesCache = store.get('messages') !== undefined;
    $scope.messages = store.get('messages') || {};

    // Data
    $scope.data = {currentMessage: 0};
    $scope.firstDate = 1344867195;
    $scope.currentDate = 1344867195; //moment().unix();
    $scope.loading = true;
    $scope.durationMessages = formatDuration(moment.duration(moment() - moment('2012-08-13 9:13am CST')));
    $scope.durationRelationship = formatDuration(moment.duration(moment() - moment('2012-10-21 1pm CST')));


    $scope.firstMoment = function() {
      return moment.unix($scope.firstDate);
    };

    $scope.currentMoment = function() {
      return moment.unix($scope.currentDate);
    };

    $scope.lastDate = function() {
      return _.max($scope.messages, function(message) { return message.created_time; }).created_time || $scope.firstDate;
    };

    $scope.lastId = function() {
      return _.max($scope.messages, function(message) { return message.local_id; }).local_id || 0;
    };

    $scope.lastMoment = function() {
      return moment.unix($scope.lastDate());
    };

    $scope.nextDay = function() {
      return moment($scope.currentMoment()).add('days', 1).format('YYYY-MM-DD');
    };

    $scope.prevDay = function() {
      return moment($scope.currentMoment()).subtract('days', 1).format('YYYY-MM-DD');
    };

    $scope.currentMessages = function() {
      return _.filter($scope.messages, function(message) {
        var m = moment.unix(message.created_time);
        return ($scope.currentMoment().year() === m.year() && $scope.currentMoment().month() === m.month() && $scope.currentMoment().date() === m.date());
      });
    };

    $scope.dateRange = function() {
      var dates = [];
      for(var i = moment($scope.firstMoment()); i.isBefore($scope.lastMoment()); i.add('days', 1)) {
        dates.push(i.format('YYYY-MM-DD'));
      }
      return dates;
    };

    $scope.messageDays = function() {
      return _.uniq(_.map($scope.messages, function(message) { return moment.unix(message.created_time).format('YYYY-MM-DD'); }));
    };

    $scope.emptyDays = function() {
      return _.difference($scope.dateRange(), $scope.messageDays());
    };

    $scope.wordCount = function() {
      var counts = _.map($scope.messages, function(message) {
        return ((message.body || ' ').match(/\S+/g) || []).length;
      });
      return _.reduce(counts, function(memo, count) {
        return memo + count;
      }, 0);
    };

    $scope.hasMessagesToday = function() {
      return $scope.currentMessages().length !== 0 || $scope.loading;
    };

    var db = new Firebase('https://jacob-and-kathryn.firebaseio.com/');

    var usersDB = db.child('users');
    var messagesDB = db.child('messages');
    var dataDB = db.child('data');

    var updateMessage = function(snap) {
      $timeout(function() {
        $scope.safeApply(function() {
          $scope.loading = false;
          var message = snap.val();
          message.body = simpleFormat(message.body);
          message.header = messageHeader(message);
          message.author_key = getAuthorKey(message.author_id);
          message.seen_by = message.seen_by || [];
          message.filtered_seen_by = _.filter(message.seen_by, function(item, id) { return true; });
          message.has_seen_by = message.filtered_seen_by.length > 0;
          message.formatted_seen_by = '✓ Seen by ' + _.map(message.filtered_seen_by, function(person) { return '<span title="' + moment.unix(person.time).format("dddd, MMMM Do YYYY, h:mm:ss a") + '">' + person.name + '</span>'; }).join(', ');
          $scope.messages[snap.name()] = message;
        });
      });
    };

    var watchMessages = function() {
      console.log('limit', $scope.data.currentMessage - $scope.lastId());
      messagesDB.startAt($scope.lastDate() + 1).limit($scope.data.currentMessage - $scope.lastId()).on('child_added', function(snap) {
        console.log('snap', snap.name());
        updateMessage(snap);
      });
      messagesDB.on('child_changed', function(snap) {
        console.log('child_changed', snap.name());
        updateMessage(snap);
      });
    };

    var authClient = new FirebaseAuthClient(db, function(error, user) {
      if (error) {
        console.log(error);
      } else if (user) {
        $scope.safeApply(function() {
          $scope.auth = user;
          $scope.loggedIn = true;
        });

        usersDB.child('fb-' + user.id).once('value', function(snap) {
          $scope.safeApply(function() {
            $scope.authenticated = snap.val();
          });
          if (snap.val() === true) {
            dataDB.on('value', function(snap) {
              $scope.safeApply(function() {
                $scope.data = snap.val();
              });
              watchMessages();
            });
          }
        });
      } else {
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

    // Watchers
    $scope.$watch('currentDate', function() {
      document.title = $scope.currentMoment().format('dddd, MMMM Do YYYY') + ' | The J&K Messages';
    });

    $scope.$watch('authenticated + loggedIn + currentDate', function() {
      return;
      if ($scope.loggedIn && $scope.authenticated) {
        _.each($scope.currentMessages(), function(message, id) {
          messagesDB.child(message.message_id.replace('510521608973600_', '')).child('seen_by').child('fb-' + $scope.auth.id).set({
            name: $scope.auth.first_name,
            time: moment().unix()
          });
        });
      }
    });

    $scope.$watch('messages + loading', function() {
      $timeout(function() {
        if (!$scope.loading)
          store.set('messages', $scope.messages);
      });
    });

    // Routing
    var goToDate = function(date) {
      $timeout(function() {
        $scope.safeApply(function() {
          $scope.currentDate = moment(date).unix();
        });
      });
    };

    var goToLast = function() {
      $scope.safeApply(function() {
        $scope.currentDate = $scope.lastDate();
      });
    };

    var routes = {
      '/:date' : goToDate,
      '/' : goToLast
    };

    var router = Router(routes);
    router.init('/');

    window.s = $scope;

  }
]);
