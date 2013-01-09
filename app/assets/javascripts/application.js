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

var setUserStatus = function(uid, status, icon) {
  console.log('called');
  var el = $('#status-' + uid);
  console.log(el);

  el.attr('class', 'icon-' + icon);
  el.parent().attr('title', status);
  el.parent().tooltip('destroy');
  el.parent().tooltip({
    title: status,
    placement: 'bottom'
  });
}


jQuery(function($) {

  var options = {
    minDate: new Date(2012, 8 - 1, 13),
    maxDate: new Date(),
    dateFormat: 'yy-mm-dd',
    onSelect: function(day) {
      window.location = ('/' + day);
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

  window.fetchUserStatus = function() {
    $.ajax({
      url: '/users',
      type: 'get',
      dataType: 'json',
      success: function(data) {
        $.each(data, function(id, user) {
          setUserStatus(user.uid, user.status, user.icon);
        });
      }
    });
  };

  window.fetchUserStatus();

});
