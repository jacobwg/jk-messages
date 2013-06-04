var fb = require('fb'),
    Firebase = require('firebase'),
    nconf = require('nconf'),
    when = require('when'),
    moment = require('moment');

nconf.argv()
   .env()
   .file({ file: 'config.json' });

var queryFB = function(query) {
  var deferred = when.defer();

  fb.api('fql', { q: query }, function (res) {
    if (!res || res.error) {
      deferred.reject(new Error(res.error));
    } else {
      deferred.resolve(res);
    }
  });

  return deferred.promise;
};

var db = new Firebase('https://jacob-and-kathryn.firebaseio.com');
db.auth(nconf.get('FIREBASE_SECRET'));

var dataDB = db.child('data');
var messagesDB = db.child('messages');

var url_pattern = /(^|\s)(\b(https?|ftp):\/\/[\-A-Z0-9+\u0026@#\/%?=~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~_|])/gi;

var loadMessage = function(id) {
  var deferred = when.defer();

  var q = 'SELECT attachment, author_id, body, created_time, message_id, source, thread_id FROM message WHERE message_id="510521608973600_' + id + '"';
  queryFB(q).then(function(data) {
    var message = data.data[0];

    message.word_count = ((message.body || ' ').match(/\S+/g) || []).length;
    message.author_key = (message.author_id == '100000505263000') ? 'jacob' : 'kathryn';
    message.name = (message.author_id == '100000505263000') ? 'Jacob Gillespie' : 'Kathryn Elizabeth';
    message.header = moment.unix(message.created_time).format("dddd, MMMM Do YYYY, h:mm:ss a") + ' - ' + message.name + ':';

    message.local_id = parseInt(message.message_id.replace('510521608973600_', ''), 10);

    message.html = message.body.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
    message.html = '<p>' + message.html + '</p>';
    message.html = message.html.replace(url_pattern, "$1<a href='$2'>$2</a>");

    console.log('Fetched message ID ' + id);
    messagesDB.child(id).setWithPriority(message, message.created_time);
    dataDB.child('currentMessage').transaction(function(currentMessage) {
      if (currentMessage < id)
        return id;
      else
        return currentMessage;
    });

    dataDB.child('lastMessageTime').transaction(function(lastMessageTime) {
      if (lastMessageTime < message.created_time)
        return message.created_time;
      else
        return lastMessageTime;
    });

    dataDB.child('wordCount').transaction(function(wordCount) {
      return wordCount + message.word_count;
    });

    deferred.resolve(message);
  }, function(err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

var checkMessage = function(id) {
  var deferred = when.defer();

  messagesDB.child(id).once('value', function(snap) {
    if (!snap.val()) {
      console.log('Fetching message ID ' + id);
      deferred.resolve(loadMessage(id));
    }
  });

  return deferred.promise;
};

var checkForMessages = function(data) {
  console.log('Checking for messages...');
  dataDB.once('value', function(snap) {
    var data = snap.val();
    queryFB('SELECT message_count FROM thread WHERE thread_id=' + nconf.get('THREAD_ID')).then(function(fb) {
      var count = fb.data[0]['message_count'];
      var lastMessage = count - 1;
      console.log('There are ' + count + ' messages');

      if (lastMessage > data.currentMessage) {
        for (var i = data.currentMessage + 1; i <= lastMessage; i++) {
          checkMessage(i);
        }
      } else {
        console.log('All messages imported...');
      }
    });
  });
};

fb.setAccessToken(nconf.get('ACCESS_TOKEN'));

// check for messages
checkForMessages();

// check for messages every minute
setInterval(checkForMessages, 60 * 1000);


