//= require jquery
//= require jquery_ujs
//= require bootstrap
//= require bootbox
//= require jquery.timeago
//= require heroku
//= require jwerty
//= require jquery.scrollTo
//= require jquery.ui.datepicker
//= require mobile

var page = 1;
var loading = false;
var el, prevHeight;

window.done = false;

var focus_message = null;

var scrollNextMessage = function() {
  focus_message = focus_message || $('.message').first();

  if ($(focus_message).next('.message').size() != 0) {
    focus_message = $(focus_message).next('.message');
  }
  $(document).scrollTo(focus_message, {offset: -30});
};

var scrollPreviousMessage = function() {
  focus_message = focus_message || $('.message').first();
  if (focus_message && $(focus_message).prev('.message').size() != 0) {
    focus_message = $(focus_message).prev('.message');
  }
  $(document).scrollTo(focus_message, {offset: -30});
};

var setUserStatus = function(uid, status) {
  var el = $('#status-' + uid);

  el.attr('src', '/assets/status/' + status + '.png');
  var message = '';
  var name = el.data('name');
  message = name;
  switch (status) {
    case 'offline':
      message += ' is offline and has not started on today\'s message...'
      break;
    case 'online':
      message += ' is online but has not started on today\'s message...'
      break;
    case 'writing':
      message += ' has started on today\'s message...'
      break;
    case 'sent':
      title = 'Sent';
      message += ' has sent today\'s message...'
      break;
  }
  el.parent().attr('title', message);
  el.parent().tooltip('destroy');
  el.parent().tooltip({
    title: message,
    placement: 'bottom'
  });
}


jQuery(function($) {

  var options = {
    minDate: new Date(2012, 8 - 1, 13),
    maxDate: new Date(),
    dateFormat: 'yy-mm-dd',
    showButtonPanel: true,
    onSelect: function(day) {
      window.location = ('/?day=' + day);
    }
  };

  if (window.defaultDate) {
    options.defaultDate = window.defaultDate;
  }

  if (window.maxDate) {
    options.maxDate = window.maxDate;
  }

  $('.datepicker').datepicker(options);

  jwerty.key('j', function () {
    scrollNextMessage()
  });

  jwerty.key('k', function () {
    scrollPreviousMessage()
  });

  $('#status-jacob').popover({
    title: 'Jacob\'s Message Status',
    content: 'Stuff goes here...',
    trigger: 'hover',
    placement: 'bottom'
  });

  $('#status-kathryn').popover({
    title: 'Kathryn\'s Message Status',
    content: 'Stuff goes here...',
    trigger: 'hover',
    placement: 'bottom'
  });

  window.fetchUserStatus = function() {
    $.ajax({
      url: '/users',
      type: 'get',
      dataType: 'json',
      success: function(data) {
        $.each(data, function(id, user) {
          setUserStatus(user.uid, user.status);
        });
      }
    });
  };

  window.fetchUserStatus();

  PUBNUB.subscribe({
    channel    : "pubnub",
    restore    : false,              // STAY CONNECTED, EVEN WHEN BROWSER IS CLOSED
    callback   : function(message) { // RECEIVED A MESSAGE.
      message = $.parseJSON(message);
      switch (message.action) {
        case 'status':
          setUserStatus(message.data.uid, message.data.status);
          break;
        case 'message':
          bootbox.alert(message.data.message);
          break;
      }
    },
    disconnect : function() {},
    reconnect  : function() {},
    connect    : function() {},
  });

});
