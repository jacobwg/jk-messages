//= require jquery
//= require jquery_ujs
//= require bootstrap
//= require jquery.timeago
//= require turbolinks

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

  $('#load-more').on('click', function() {
    if (loading || window.done) return;

    var scroll = $(document).scrollTop();
    var firstMessage = $('.message:first');
    var curOffset = firstMessage.offset().top - $(document).scrollTop();

    $('.ajax').show();

    loading = true;
    page++;

    $.ajax({
      url: '/messages?page=' + page,
      type: 'get',
      dataType: 'script',
      success: function() {
        loading = false;
        $('.ajax').hide();
        $("abbr.timeago").timeago();
        $(document).scrollTop(firstMessage.offset().top - curOffset);
      }
    });
  });

  setInterval(pollMessages, 10000);
  scrollToBottom();
  setTimeout(scrollToBottom, 1000);

  $("abbr.timeago").timeago();
  $('.ajax').hide();
});
