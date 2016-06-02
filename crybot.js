var credentials = require('./credentials')
var login = require('facebook-chat-api')
var low = require('lowdb')
var storage = require('lowdb/file-sync')
var db = low('counts.json', { storage })
var fs = require('fs')

login(credentials.data, handleLogin)

function handleLogin(err, api) {
    if (err) {
	fs.appendFileSync('log.txt', err)
    }

    api.setOptions({
	logLevel: "silent"
    })

    handleAPI(api)
}

function handleAPI(api) {
    var cryFace = '\u{1F602}'
    api.listen(function processMessages(err, message) {
	if (err) {
	    fs.appendFileSync('log.txt', err)
	}

	var currentCountObj = db('counts').find({ threadID: message.threadID })
	var currentCount
	if (currentCountObj !== undefined) {
	    currentCount = currentCountObj['count']
	}
	else {
	    currentCount = 0
	    db('counts').push({ threadID: message.threadID, count: 0 })
	}

	var counter = 0
	if (message.body === '!cry') {
	    api.sendMessage(cryFace, message.threadID)
	    counter = 1
	}
	else if (message.body === '!count') {
	    var msg = { body: currentCount }
	    api.sendMessage(msg, message.threadID)
	}
	else if (message.body) {
	    counter = message.body.split(cryFace).length - 1
	}

	if (counter > 0) {
	    var update = currentCount + counter
	    db('counts')
		.chain()
		.find({ threadID: message.threadID })
		.assign({ count: update })
		.value()
	}
    })
}
