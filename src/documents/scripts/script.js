var app = angular.module('app', []);

if (store.get('version') !== 3) {
  store.remove('messages');
  store.set('version', 3);
}

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
  return moment.unix(message.created_time).format("dddd, MMMM Do YYYY, h:mm:ss a") + ' - ' + getAuthorName(message.author_id) + ':';
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
    $scope.messages = store.get('messages') || [];
    $scope.seen = {};

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
      return $scope.messages.length - 1;
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

    $scope.showSeen = function(id) {
      return !!($scope.seen[id]);
    };

    $scope.formattedSeen = function(id) {
      if ($scope.showSeen(id)) {
        return '✓ Seen by ' + _.map($scope.seen[id], function(person) { return '<span title="' + moment.unix(person.time).format("dddd, MMMM Do YYYY, h:mm:ss a") + '">' + person.name + '</span>'; }).join(', ');
      }
    };

    var db = new Firebase('https://jacob-and-kathryn.firebaseio.com/');

    var usersDB = db.child('users');
    var messagesDB = db.child('messages');
    var dataDB = db.child('data');
    var seenDB = db.child('seen');

    var buildMessage = function(message) {
      message.body = simpleFormat(message.body);
      message.header = messageHeader(message);
      message.author_key = getAuthorKey(message.author_id);
      message.local_id = parseInt(message.message_id.replace('510521608973600_', ''));
      return message;
    };

    var updateMessage = function(snap) {
      $scope.safeApply(function() {
        $scope.loading = false;
        var message = buildMessage(snap);
        $scope.messages[message.local_id] = message;
        store.set('messages', $scope.messages);
      });
    };

    var watchMessages = function() {
      var limit = $scope.data.currentMessage - $scope.lastId();
      if (limit > 100) {
        messagesDB.once('value', function(snap) {
          $scope.safeApply(function() {
            $scope.messages = _.map(snap.val(), buildMessage);
            $scope.loading = false;
          });
          store.set('messages', $scope.messages);
          watchMessages();
        });
      } else {
        if (limit === 0)
          $scope.safeApply(function() {
            $scope.loading = false;
          });
        messagesDB.startAt($scope.lastDate() + 1).limit($scope.data.currentMessage - $scope.lastId() + 20).on('child_added', function(snap) {
          updateMessage(snap.val());
        });
        messagesDB.on('child_changed', function(snap) {
          updateMessage(snap.val());
        });
      }
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
            seenDB.on('value', function(snap) {
              $scope.safeApply(function() {
                $scope.seen = snap.val();
              });
            });

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
      if ($scope.loggedIn && $scope.authenticated) {
        _.each($scope.currentMessages(), function(message, id) {
          seenDB.child(message.local_id).child('fb-' + $scope.auth.id).set({
            name: $scope.auth.first_name,
            time: moment().unix()
          });
        });
      }
    });

    $scope.$watch('messages', function() {
      if (router.getRoute()[0] === '') {
        goToLast();
      }
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
