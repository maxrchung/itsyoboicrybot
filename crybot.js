var credentials = require('./credentials')
var login = require('facebook-chat-api')
var low = require('lowdb')
var storage = require('lowdb/lib/file-sync')
var db = low('counts.json', { storage })
var fs = require('fs')

var checkTime = Date.now()
var rebootTime = 3600000

const Discord = require("discord.js");
const client = new Discord.Client();

var cryFace = '\u{1F602}'

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`);
});

client.on('message', msg => {
    var currentCountObj = db.get('counts').find({ threadID: msg.guild.id }).value()
    var currentCount = 0
    if (currentCountObj) {
	currentCount = currentCountObj['count']
    }
    var counter = 0

    if (msg.content === '!cry') {
	msg.channel.sendMessage(cryFace)
	counter = 1
    }
    else if (msg.content === '!count') {
	msg.channel.sendMessage(currentCount)
    }
    else if (msg.author.id !== client.user.id) {
	counter = msg.content.split(cryFace).length - 1
    }
    if (counter > 0) {
	var update = currentCount + counter

	if (currentCount == 0) {
	    db.get('counts')
		.chain()
		.push({ threadID: msg.guild.id, count: update })
		.value()
	}
	else {
	    db.get('counts')
		.chain()
		.find({ threadID: msg.guild.id })
		.assign({ count: update })
		.value()
	}
    }
});

client.login(credentials.token);

function run() {
    login(credentials.data, handleLogin)
}

run()

function handleLogin(err, api) {
    if (err) {
	fs.appendFileSync('handleLogin error', '\n')
	fs.appendFileSync('log.txt', err)
	fs.appendFileSync('log.txt', '\n')
    }

    api.setOptions({
	logLevel: 'silent'
    })

    handleAPI(api)
}

function handleAPI(api) {
    var stopListening = api.listen(function processMessages(err, message) {
	if (err) {
	    fs.appendFileSync('handleAPI error', err)
	    fs.appendFileSync('log.txt', err)
	    fs.appendFileSync('log.txt', '\n')
	}

	if (message) {
	    var currentCountObj = db.get('counts').find({ threadID: message.threadID }).value()
	    var currentCount = 0
	    if (currentCountObj) {
		currentCount = currentCountObj['count']
	    }
	    var counter = 0

	    if (message.body === '!cry') {
		api.sendMessage(cryFace, message.threadID, function callback(err, message) {		    
		    if (err) {
			fs.appendFileSync('log.txt', '!cry error\n')
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
			    handleAPI(api)
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
			    handleAPI(api)
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

		if (currentCount == 0) {
		    db.get('counts')
			.chain()
			.push({ threadID: message.threadID, count: update })
			.value()
		}
		else {
		    db.get('counts')
			.chain()
			.find({ threadID: message.threadID })
			.assign({ count: update })
			.value()
		}
	    }
	}

	if (Date.now() - checkTime > rebootTime) {
	    checkTime = Date.now()
	    login(credentials.data, handleLogin)
	    return stopListening()
	}
    })
}
