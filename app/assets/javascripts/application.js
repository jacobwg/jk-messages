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
//= require moment
//= require turbolinks

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

var setUserStatus = function(uid, status, icon) {
  var el = $('#status-' + uid);

  el.attr('class', 'icon-' + icon);
  el.parent().attr('title', status);
  el.parent().tooltip('destroy');
  el.parent().tooltip({
    title: status,
    placement: 'bottom'
  });
}

jwerty.key('j', function () {
  scrollNextMessage()
});

jwerty.key('k', function () {
  scrollPreviousMessage()
});


var ready = function() {

  focus_message = null;

  var blockedDays = window.unsentDays;

  var options = {
    minDate: new Date(2012, 8 - 1, 13),
    maxDate: new Date(),
    dateFormat: 'yy-mm-dd',
    onSelect: function(day) {
      Turbolinks.visit('/' + day);
    },
    beforeShowDay: function(day) {
      var show = $.inArray(moment(day).format("YYYY-MM-DD"), blockedDays) == -1;
      window.day = day;
      return [show, '', ''];
    }
  };

  if (window.defaultDate) {
    options.defaultDate = window.defaultDate;
  }

  if (window.maxDate) {
    options.maxDate = window.maxDate;
  }

  $('.datepicker').datepicker(options);

  window.fetchUserStatus();

};

$(document).ready(ready);
$(document).on('page:load', ready);


