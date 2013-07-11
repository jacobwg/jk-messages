docpadConfig = {

	templateData:

		site:
			url: "http://messages.jacobandkathryn.com"

			oldUrls: [
				'kathryn.jacobwg.com'
			]

			title: "J&K Messages"

			styles: [
				'/vendor/toast.css'
				'/styles/style.css'
			]

			scripts: [
				'https://cdn.firebase.com/v0/firebase.js'
				'https://cdn.firebase.com/v0/firebase-simple-login.js'
				'https://www.firebase.com/js/libs/idle.js'
				'/vendor/vendor.js'
				'/scripts/app.js'
			]

		getPreparedTitle: ->
			if @document.title
				"#{@document.title} | #{@site.title}"
			else
				@site.title

	events:

		# Server Extend
		# Used to add our own custom routes to the server before the docpad routes are added
		serverExtend: (opts) ->
			# Extract the server from the options
			{server} = opts
			docpad = @docpad

			# As we are now running in an event,
			# ensure we are using the latest copy of the docpad configuraiton
			# and fetch our urls from it
			latestConfig = docpad.getConfig()
			oldUrls = latestConfig.templateData.site.oldUrls or []
			newUrl = latestConfig.templateData.site.url

			# Redirect any requests accessing one of our sites oldUrls to the new site url
			server.use (req,res,next) ->
				if req.headers.host in oldUrls
					res.redirect(newUrl+req.url, 301)
				else
					next()
}

module.exports = docpadConfig
