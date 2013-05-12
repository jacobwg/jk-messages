
var formatDuration = function(duration) {
  var out = [];
  if (duration.years() > 0)
    out.push((duration.years() === 1 ? '1 year' : duration.years() + ' years'));
  if (duration.months() > 0)
    out.push((duration.months() === 1 ? '1 month' : duration.months() + ' months'));
  if (duration.days() > 0)
    out.push((duration.days() === 1 ? '1 day' : duration.days() + ' days'));

  return out.join(', ');
};

var app = {
  loggedIn: ko.observable(false),
  authenticated: ko.observable('loading'),
  auth: ko.observable({}),
  cache: store.get('messages') !== undefined,
  messages: ko.observableArray(store.get('messages')),
  data: ko.observable({currentMessage: 0}),
  firstDate: ko.observable(1344920399),
  currentDate: ko.observable(moment.unix()),
  loading: ko.observable(true),
  durationMessages: formatDuration(moment.duration(moment() - moment('2012-08-13 9:13am CST'))),
  durationRelationship: formatDuration(moment.duration(moment() - moment('2012-10-21 1pm CST')))
};

app.firstMoment = ko.computed(function() {
  return moment.unix(app.firstDate());
});

app.currentMoment = ko.computed(function() {
  return moment.unix(app.currentDate());
});

app.lastDate = ko.computed(function() {
  return _.max(app.messages(), function(message) { return message.created_time; }).created_time || app.firstDate();
});

app.lastMoment = ko.computed(function() {
  return moment.unix(app.lastDate());
});

app.nextDay = ko.computed(function() {
  return moment(app.currentMoment()).add('days', 1).format('YYYY-MM-DD');
});

app.prevDay = ko.computed(function() {
  return moment(app.currentMoment()).subtract('days', 1).format('YYYY-MM-DD');
});

app.currentMessages = ko.computed(function() {
  return _.filter(app.messages(), function(message) {
    var m = moment.unix(message.created_time);
    return (app.currentMoment().year() === m.year() && app.currentMoment().month() === m.month() && app.currentMoment().date() === m.date());
  });
});

app.getAuthorName = function(author_id) {
  if (author_id === 100003843585453) {
    return 'Kathryn Elizabeth';
  } else {
    return 'Jacob Gillespie';
  }
};

app.getAuthorKey = function(author_id) {
  if (author_id === 100003843585453) {
    return 'kathryn';
  } else {
    return 'jacob';
  }
};

app.messageHeader = function(message) {
  return moment.unix(message.created_time).format("dddd, MMMM Do YYYY, h:mm:ss a") + ' - ' + app.getAuthorName(message.author_id) + ':';
};

app.simpleFormat = function(content) {
  content = content.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
  content = '<p>' + content + '</p>';
  return content.autoLink();
};

app.dateRange = ko.computed(function() {
  var dates = [];
  for(var i = moment(app.firstMoment()); i.isBefore(app.lastMoment()); i.add('days', 1)) {
    dates.push(i.format('YYYY-MM-DD'));
  }
  return dates;
});

app.messageDays = ko.computed(function() {
  return _.uniq(_.map(app.messages(), function(message) { return moment.unix(message.created_time).format('YYYY-MM-DD'); }));
});

app.emptyDays = ko.computed(function() {
  return _.difference(app.dateRange(), app.messageDays());
});

app.wordCount = ko.computed(function() {
  var counts = _.map(app.messages(), function(message) {
    return message.body.match(/\S+/g).length;
  });
  return _.reduce(counts, function(memo, count) {
    return memo + count;
  }, 0);
});

app.seen = function(data) {
  return data.seenBy || [];
};

app.filteredSeenBy = function(seenBy) {
  return _.filter(seenBy, function(item, id) { return true; });
};

app.formattedSeenBy = function(seenBy) {
  var people = app.filteredSeenBy(seenBy);
  return '✓ Seen by ' + _.map(people, function(person) { return person.name; }).join(', ');
};

var goToDate = function(date) {
  app.currentDate(moment(date).unix());
};

var goToLast = function() {
  app.currentDate(app.lastDate());
};


// Document title updater
ko.computed(function() {
  document.title = app.currentMoment().format('dddd, MMMM Do YYYY') + ' | The J&K Messages';
});

// Seen updater
ko.computed(function() {
  if (app.loggedIn() && app.authenticated()) {
    _.each(app.currentMessages(), function(message, id) {
      messagesDB.child(message.message_id.replace('510521608973600_', '')).child('seenBy').child('fb-' + app.auth().id).set({
        name: app.auth().first_name,
        time: moment().unix()
      });
    });
  }
});

var routes = {
  '/:date' : goToDate,
  '/' : goToLast
};

var router = Router(routes);

router.init('/');

// Firebase adapter - no need to do any writing...
var db = new Firebase('https://jacob-and-kathryn.firebaseio.com/');

var usersDB = db.child('users');
var messagesDB = db.child('messages');
var dataDB = db.child('data');

var listenToMessages = function() {
  messagesDB.on('value', function(snap) {
    app.messages(snap.val());
    app.loading(false);
    store.set('messages', app.messages());
  });
};

var authClient = new FirebaseAuthClient(db, function(error, user) {
  if (error) {
    console.log(error);
  } else if (user) {
    app.auth(user);
    app.loggedIn(true);
    usersDB.child('fb-' + user.id).once('value', function(userSnap) {
      app.authenticated(userSnap.val());
      if (userSnap.val() === true) {
        listenToMessages();
        dataDB.on('value', function(snap) {
          app.data(snap.val());
        });
      }
    }, function() {
      app.logout();
    });
  } else {
    app.auth({});
    app.loggedIn(false);
    app.authenticated(false);
    app.loading(true);
    app.currentDate(moment().unix());
  }
});

app.login = function() {
  authClient.login('facebook', {
    rememberMe: true,
    scope: 'email'
  });
};

app.logout = function() {
  authClient.logout();
};

ko.applyBindings(app);

var m2DB = db.child('days');

var move = function() {
  _.each(app.messages(), function(message, id) {
    var date = moment.unix(message.created_time).format('YYYY-MM-DD');
    m2DB.child(date).push(message);
  });
};




var app = angular.module('app', []);








