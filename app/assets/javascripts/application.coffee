#= require jquery
#= require jquery_ujs
#= require pickadate
#= require moment
#= require bootstrap
#= require emojify

jQuery ($) ->
  $dp = $('.datepicker')

  $dp.hide()
  emojify.run()

  blockedDays = window.unsentDays

  input = $dp.pickadate
    clear: false
    dateMin: [2012, 8, 13]
    dateMax: (window.maxDate || true)
    datesDisabled: blockedDays
    onSelect: () ->
      window.location = "/#{this.getDate( 'yyyy-mm-dd' )}"
  calendar = input.data( 'pickadate' )

  calendar.setDate( window.defaultDate[0], window.defaultDate[1], window.defaultDate[2], true ) if window.defaultDate

  window.c = calendar

  $('#pick-day').on 'click', ->
    window.c.open()
    false


