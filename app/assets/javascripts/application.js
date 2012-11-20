// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require foundation
//= require_tree .

var page = 1;
var loading = false;
var el, prevHeight;

window.done = false;


jQuery(function($) {

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

  var startScrollWatch = function() {
    $(document).on('scroll', function() {
      if (loading || window.done) return;

      var scroll = $(document).scrollTop();

      if (scroll < 200) {
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
      }
    });
  };

  setInterval(pollMessages, 10000);
  setTimeout(scrollToBottom, 10);
  setTimeout(startScrollWatch, 1000);

  $("abbr.timeago").timeago();
  $('.ajax').hide();
});
