import express from 'express';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';

const Tome = (await import('@bjornstar/tomes')).default;

import { SockMonger } from './lib/sockmonger/index.js';
import { User } from './lib/user.js';

const tUsers = Tome.conjure({});
const tChats = Tome.conjure({});

const clientUserMap = {};
const loggingIn = {};
const newThisTurn = {};

let merging = false;

function msToNextTurn() {
	return Date.now() % 1000;
}

function nextTurn() {
	sendTurn();

	setTimeout(nextTurn, msToNextTurn());
}

function delClient(clientId) {
	console.log(clientId + ' disconnected.');

	delete newThisTurn[clientId];
}

function mergeChat(diff) {
	if (!diff) {
		return;
	}

	const userId = clientUserMap[this.id];

	// Validate that the client is updating the data for the correct user
	if (diff.chain[0] !== userId) return console.warn('bad client detected, not merging');

	merging = true;

	// Merge the diff
	tChats.merge(diff);

	// Throw away the diff since we don't want to do anything with it.
	tChats.read();

	merging = false;

	// We can simply broadcast the diff which sends it to all clients except
	// for the one that sent it.
	this.broadcast('chats.diff', diff);
}

function login(client, user) {
	const clientId = client.id;
	const userId = user.id;

	clientUserMap[clientId] = userId;

	const chatData = [];

	// Sneakily bump the lastLogin before it gets turned into a tome.
	user.lastLogin = Date.now();

	// Add the user to our users tome and all clients will automagically
	// get updated at the end of this turn.
	tUsers.set(userId, user);

	// Add the user to our chats tome, which gets updated in realtime.
	tChats.set(userId, chatData);

	client.once('close', function () {
		console.log(clientId, 'disconnected. logging out', userId, '.');

		tUsers[userId].set('lastLogout', Date.now());

		user.save().catch(function (error) {
			console.log('error saving:', userId, error)
		}).then(function () {
			tUsers.del(userId);
			tChats.del(userId);
			delete clientUserMap[clientId];
		});
	});

	// Tell the client who is logging in what their userId is.
	client.remoteEmit('loggedIn', userId);
}

function handleLogin(userId) {
	const client = this;
	const clientId = client.id;

	// The first thing we do is check to see if that user is already logging
	// in.

	if (loggingIn[userId]) {
		console.error(userId, 'is already logging in');
		return client.remoteEmit('userError', 'alreadyLoggingIn');
	}

	loggingIn[userId] = true;

	if (tUsers.hasOwnProperty(userId)) {
		console.error(userId, 'is already logged in');
		return client.remoteEmit('userError', 'alreadyLoggedIn');
	}

	User.load(userId).then(function (user) {
		if (!sm.clients.hasOwnProperty(clientId)) {
			return console.error('client disconnected before data loaded.', clientId, userId);
		}

		delete loggingIn[userId];
		login(client, user);
	}).catch(function (error) {
		if (error.code === 'ENOENT') {
			console.error(`Unknown user: ${userId}`);
			return client.remoteEmit('userError', 'userNotFound');
		}

		console.error('error logging in:', error);
		client.remoteEmit('userError', error);
	});
}

function handlePing() {
	this.remoteEmit('pong', null);
}

function handleRegister(name) {
	if (clientUserMap[this.id]) {
		console.log(this.id, 'already registered');
		return this.remoteEmit('userError', 'already registered');
	}

	login(this, User.create({ name }));
}

function addClient(clientId) {
	console.log(clientId, 'connected.');

	newThisTurn[clientId] = tUsers.getVersion();

	const client = sm.clients[clientId];

	// On diff, the client sent us a change to their chat.
	client.on('diff', mergeChat);

	client.on('login', handleLogin);
	client.on('ping', handlePing);
	client.on('register', handleRegister);

	// When a client connects, we send them a copy of the users. This is
	// synchronized once per turn.
	client.remoteEmit('users', tUsers);

	// We also send them the chats tome. This is synchronized in realtime.
	client.remoteEmit('chats', tChats);
}

// This starts our websocket server through express listening on a port.
const sm = new SockMonger({ server: express().listen(8081) });

sm.on('add', addClient);
sm.on('del', delClient);

function handleChatsReadable() {
	// If we are merging we will use broadcast to send the diff to all clients
	// except for the one who sent it.

	if (merging || !tChats.isDirty()) {
		return;
	}

	const diffs = tChats.readAll();

	if (!diffs) {
		return;
	}

	sm.broadcast('chats.diff', diffs);
}

tChats.on('readable', handleChatsReadable);

function sendTurn() {
	if (!tUsers.isDirty()) {
		return;
	}

	const currentVersion = tUsers.getVersion();

	const diffs = tUsers.readAll();

	const exclude = [];

	for (let newId in newThisTurn) {
		exclude.push(newId);

		let trimmedDiffs = diffs.slice(diffs.length - (currentVersion - newThisTurn[newId]));
		sm.clients[newId].remoteEmit('users.diff', trimmedDiffs);

		delete newThisTurn[newId];
	}

	sm.broadcast('users.diff', diffs, exclude);
}

// Start the turnEngine.
nextTurn();

const httpServer = express();
httpServer.use(express.static('dist'));

const viteServer = await createViteServer({
	appType: 'custom',
	server: { middlewareMode: true },
});

httpServer.use(viteServer.middlewares);

httpServer.get('/', async (req, res, next) => {
  try {
    const indexHtml = await readFile(resolve('index.html'), 'utf-8');

    res.send(await viteServer.transformIndexHtml(req.url, indexHtml));
  } catch (e) {
    return next(e);
  }
});

httpServer.listen(8080);

httpServer.get('/health', (_, res) => {
	res.status(200).send('OK');
});
