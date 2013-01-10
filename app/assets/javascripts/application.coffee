#= require jquery
#= require jquery_ujs
#= require bootstrap
#= require bootbox
#= require jquery.timeago
#= require heroku
#= require jwerty
#= require jquery.scrollTo
#= require jquery.ui.datepicker
#= require mobile
#= require moment
#= require turbolinks

page = 1
loading = false

window.done = false;

focus_message = null;

scrollNextMessage = ->
  focus_message = focus_message || $('.message').first()
  focus_message = $(focus_message).next('.message') if ($(focus_message).next('.message').size() != 0)
  $(document).scrollTo(focus_message, {offset: -30})


scrollPreviousMessage = ->
  focus_message = focus_message || $('.message').first()
  focus_message = $(focus_message).prev('.message') if (focus_message && $(focus_message).prev('.message').size() != 0)
  $(document).scrollTo(focus_message, {offset: -30})

window.fetchUserStatus = ->
  $.ajax
    url: '/users',
    type: 'get',
    dataType: 'json',
    success: (data) ->
      $.each data, (id, user) ->
        setUserStatus(user.uid, user.status, user.icon)

setUserStatus = (uid, status, icon) ->
  el = $('#status-' + uid)
  el.attr('class', 'icon-' + icon)
  el.parent().attr('title', status)
  el.parent().tooltip('destroy')
  el.parent().tooltip
    title: status,
    placement: 'bottom'

jwerty.key 'j', ->
  scrollNextMessage()

jwerty.key 'k', ->
  scrollPreviousMessage()

ready = ->
  focus_message = null
  blockedDays = window.unsentDays

  options =
    minDate: new Date(2012, 8 - 1, 13),
    maxDate: new Date(),
    dateFormat: 'yy-mm-dd',
    onSelect: (day) ->
      Turbolinks.visit('/' + day)
    beforeShowDay: (day) ->
      show = $.inArray(moment(day).format("YYYY-MM-DD"), blockedDays) == -1
      window.day = day
      [show, '', '']


  options.defaultDate = window.defaultDate if (window.defaultDate)
  options.maxDate = window.maxDate if (window.maxDate)

  $('.datepicker').datepicker(options)

  window.fetchUserStatus()

$(document).ready(ready)
$(document).on('page:load', ready)


