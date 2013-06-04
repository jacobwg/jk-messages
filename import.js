// import.js

// Modules
var fb = require('fb'),
    Firebase = require('firebase'),
    moment = require('moment'),
    nconf = require('nconf'),
    when = require('when');

// Load configuration
nconf.argv()
     .env()
     .file({ file: 'config.json' });

// Set Facebook access token
fb.setAccessToken(nconf.get('ACCESS_TOKEN'));

// URL pattern for autolinking
var url_pattern = /(^|\s)(\b(https?|ftp):\/\/[\-A-Z0-9+\u0026@#\/%?=~_|!:,.;]*[\-A-Z0-9+\u0026@#\/%=~_|])/gi;

// Convenience method for performing FQL queries
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

// Connect and authorize Firebase
var db = new Firebase('https://jacob-and-kathryn.firebaseio.com');
db.auth(nconf.get('FIREBASE_SECRET'));
var dataDB = db.child('data');
var messagesDB = db.child('messages');

// Method to load message by ID
var loadMessage = function(id) {
  // Set up promise
  var deferred = when.defer();

  // Build query
  var q = 'SELECT attachment, author_id, body, created_time, message_id, source, thread_id FROM message WHERE message_id="510521608973600_' + id + '"';

  // Make query
  queryFB(q).then(function(data) {
    var message = data.data[0];

    // Calculate data
    message.word_count = ((message.body || ' ').match(/\S+/g) || []).length;
    message.author_key = (message.author_id == '100000505263000') ? 'jacob' : 'kathryn';
    message.name = (message.author_id == '100000505263000') ? 'Jacob Gillespie' : 'Kathryn Elizabeth';
    message.header = moment.unix(message.created_time).format("dddd, MMMM Do YYYY, h:mm:ss a") + ' - ' + message.name + ':';
    message.local_id = parseInt(message.message_id.replace('510521608973600_', ''), 10);

    // Build HTML display
    message.html = message.body.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>');
    message.html = '<p>' + message.html + '</p>';
    message.html = message.html.replace(url_pattern, "$1<a href='$2'>$2</a>");

    // Save message with priority
    messagesDB.child(id).setWithPriority(message, message.created_time);

    // Increment the current message ID
    dataDB.child('currentMessage').transaction(function(currentMessage) {
      if (currentMessage < id)
        return id;
      else
        return currentMessage;
    });

    // Set the last message send time
    dataDB.child('lastMessageTime').transaction(function(lastMessageTime) {
      if (lastMessageTime < message.created_time)
        return message.created_time;
      else
        return lastMessageTime;
    });

    // Increment word count
    dataDB.child('wordCount').transaction(function(wordCount) {
      return wordCount + message.word_count;
    });

    // Resolve the promise
    deferred.resolve(message);

  }, function(err) {

    // Reject the promise
    deferred.reject(err);

  });

  // Return the promise
  return deferred.promise;
};

// Function for the success message
var successMessage = function(message) {
  console.log('Fetched message ID ' + message.local_id);
};

// Method to check for new messages
var checkForMessages = function(data) {
  console.log('\nChecking for messages...');
  dataDB.once('value', function(snap) {
    var data = snap.val();
    queryFB('SELECT message_count FROM thread WHERE thread_id=' + nconf.get('THREAD_ID')).then(function(fb) {
      var count = fb.data[0]['message_count'];
      var lastMessage = count - 1;
      console.log('There are ' + count + ' messages');

      if (lastMessage > data.currentMessage) {
        for (var i = data.currentMessage + 1; i <= lastMessage; i++) {
          loadMessage(i).then(successMessage);
        }
      } else {
        console.log('Messages already imported.');
      }
    });
  });
};

// Check for messages on first run
checkForMessages();

// Check for messages afterwards every minute
setInterval(checkForMessages, 60 * 1000);
