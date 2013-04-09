#= require jquery
#= require jquery_ujs
#= require bootstrap
#= require jwerty
#= require jquery.scrollTo
#= require pickadate
#= require moment

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

  $('.datepicker').hide();

  focus_message = null
  blockedDays = window.unsentDays

  #options.maxDate = window.maxDate if (window.maxDate)

  input = $('.datepicker').pickadate
    format: 'yyyy-mm-dd'
    formatSubmit: 'yyyy-mm-dd'
    dateMin: [2012, 8, 13]
    dateMax: true
    datesDisabled: blockedDays
    onSelect: () ->
      window.location = "/#{this.getDate( 'yyyy-mm-dd' )}"
  calendar = input.data( 'pickadate' )

  calendar.setDate( window.defaultDate.getFullYear(), window.defaultDate.getMonth(), window.defaultDate.getDay(), true ) if window.defaultDate

  window.c = calendar

  $('#pick-day').on 'click', ->
    calendar.open()

$(document).ready(ready)


