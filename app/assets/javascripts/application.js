//= require jquery
//= require jquery_ujs
//= require bootstrap
//= require jquery.timeago
//= require heroku


// require turbolinks

var page = 1;
var loading = false;
var el, prevHeight;

window.done = false;


jQuery(function($) {

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

  var pollMessages = function() {
    $.ajax({
      url: '/messages?since=' + window.since.toString(),
      type: 'get',
      dataType: 'script',
      success: function() {
        $("abbr.timeago").timeago();
      }
    });
  };

  var scrollToBottom = function() {
    //$('body').scrollTop($('body').prop('scrollHeight'));
    window.scrollTo(0, document.body.scrollHeight);
  };

  //setInterval(pollMessages, 10000);
  //scrollToBottom();
  //setTimeout(scrollToBottom, 1000);

  $("abbr.timeago").timeago();
  $('.ajax').hide();
});
