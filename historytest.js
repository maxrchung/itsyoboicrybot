var credentials = require('./credentials2')
var login = require('facebook-chat-api')

login(credentials.data, handleLogin)

function handleLogin(err, api) {
    if (err) return console.error(err)
    handleAPI(api)
}

function handleAPI(api) {
    var cryFace = '\u{1F602}'
    api.listen(function processMessages(err, message) {
	if (err) return console.error(err)

	if (message.body === '!checkhistory') {
	    api.getThreadHistory(message.threadID, 0, 999999, null, function(err, history) {
		if (err) return console.error(err)

		console.log(history.length)

		var msg = { body: history.length }
		api.sendMessage(msg, message.threadID)
	    })
	}
    })
}
