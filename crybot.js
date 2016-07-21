var credentials = require('./credentials')
var login = require('facebook-chat-api')
var low = require('lowdb')
var storage = require('lowdb/lib/file-sync')
var db = low('counts.json', { storage })
var fs = require('fs')

// Literally bad
state = 'fine'
/*
state = 'ohgod'
state = 'ohgod2'
*/
stateData = 0

function run() {
    login(credentials.data, handleLogin)
}

run()

function handleLogin(err, api) {
    if (err) {
	fs.appendFileSync('log.txt', err)
	fs.appendFileSync('log.txt', '\n')
    }

    api.setOptions({
	logLevel: 'silent'
    })

    handleAPI(api)
}

function handleAPI(api) {
    var cryFace = '\u{1F602}'
    api.listen(function processMessages(err, message) {
	if (err) {
	    fs.appendFileSync('log.txt', err)
	    fs.appendFileSync('log.txt', '\n')
	}

	if (state == 'ohgod') {
	    api.sendMessage(cryFace, message.threadID, function callback(err, message) {})
	    state = 'fine'
	} 
	else if (state == 'ohgod2') {
	    var msg = { body: String(stateData) }
	    api.sendMessage(msg, message.threadID, function callback(err, message) {})
	    state = 'fine'
	}

	var currentCountObj = db.get('counts').find({ threadID: message.threadID }).value()
	var currentCount = currentCountObj['count']
	var counter = 0

	if (message.body === '!cry') {
	    api.sendMessage(cryFace, message.threadID, function callback(err, message) {
		if (err) {
		    fs.appendFileSync('log.txt', '!cry error\n')
		    fs.appendFileSync('log.txt', err.error)
		    fs.appendFileSync('log.txt', '\n')
		    fs.appendFileSync('log.txt', err.detail)
		    fs.appendFileSync('log.txt', '\n')
		    fs.appendFileSync('log.txt', 'Rerunning bot')
		    fs.appendFileSync('log.txt', '\n')
		    state = 'ohgod'
		    run()
		    fs.appendFileSync('log.txt', 'After rerunning')
		    fs.appendFileSync('log.txt', '\n')
		    return stopListening()
		}
	    })
	    counter = 1
	}
	else if (message.body === '!count') {
	    var msg = { body: String(currentCount) }
	    api.sendMessage(msg, message.threadID, function callback(err, message) {
		if (err) {
		    fs.appendFileSync('log.txt', '!count error\n')
		    fs.appendFileSync('log.txt', err)
		    fs.appendFileSync('log.txt', '\n')
		    fs.appendFileSync('log.txt', err.error)
		    fs.appendFileSync('log.txt', '\n')
		    fs.appendFileSync('log.txt', err.detail)
		    fs.appendFileSync('log.txt', '\n')
		    stateData = currentCount
		    fs.appendFileSync('log.txt', 'Rerunning bot')
		    fs.appendFileSync('log.txt', '\n')
		    state = 'ohgod2'
		    run()
		    fs.appendFileSync('log.txt', 'After rerunning')
		    fs.appendFileSync('log.txt', '\n')
		    return stopListening()
		}
	    })
	}
	else if (message.body) {
	    counter = message.body.split(cryFace).length - 1
	}

	if (counter > 0) {
	    var update = currentCount + counter
	    db.get('counts')
		.chain()
		.find({ threadID: message.threadID })
		.assign({ count: update })
		.value()
	}
    })
}
