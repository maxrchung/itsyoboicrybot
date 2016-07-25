var credentials = require('./credentials')
var login = require('facebook-chat-api')
var low = require('lowdb')
var storage = require('lowdb/lib/file-sync')
var db = low('counts.json', { storage })
var fs = require('fs')

var checkTime = Date.now()
var rebootTime = 3600000

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
    var stopListening = api.listen(function processMessages(err, message) {
	if (err) {
	    fs.appendFileSync('log.txt', err)
	    fs.appendFileSync('log.txt', '\n')
	}

	if (message) {
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
		    }

		    if (Date.now() - checkTime > rebootTime) {
			checkTime = Date.now()
			login(credentials.data, function(err, api) {
			    handleLogin(err, api)
			    return stopListening()
			})
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
		    }

		    if (Date.now() - checkTime > rebootTime) {
			checkTime = Date.now()
			login(credentials.data, function(err, api) {
			    handleLogin(err, api)
			    return stopListening()
			})
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
	}

	if (Date.now() - checkTime > rebootTime) {
	    checkTime = Date.now()
	    login(credentials.data, handleLogin)
	    return stopListening()
	}
    })
}
