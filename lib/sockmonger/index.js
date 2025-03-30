import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { WebSocketServer } from 'ws';

import { deserialize, serialize } from './socky.js';

console.log('Fresh socks! Get your fresh socks here!');

function newId() {
	return randomBytes(9).toString('base64');
}

class Client extends EventEmitter {
	constructor(sm, socket, id) {
		super();

		this.id = id;
		this.sm = sm;
		this.socket = socket;
	}


	broadcast(name, data) {
		this.sm.broadcast(name, data, [ this.id ]);
	}

	close() {
		this.socket.close();
	}

	remoteEmit(name, data) {
		if (this.socket.readyState === 1) {
			this.socket.send(serialize(name, data));
		}
	}
}

export class SockMonger extends EventEmitter {
	constructor(options) {
		super();

		this.wss = new WebSocketServer(options);
		this.sockets = {};
		this.clients = {};

		this.wss.on('connection', this.onConnection.bind(this));
	}

	onConnection(socket) {
		const id = newId();

		this.sockets[id] = socket;

		const client = new Client(this, socket, id);
		this.clients[id] = client;

		socket.on('close', () => {
			delete this.sockets[id];
			delete this.clients[id];

			client.emit('close');
			client.removeAllListeners();

			this.emit('del', id);
		});

		socket.on('message', rawData => {
			const { name, data } = deserialize(rawData.toString('utf8'));
			console.log(id, '-> Server', name, data);
			client.emit(name, data);
		});

		this.emit('add', id);
	}

	broadcast(event, data, exclude = []) {
		const out = serialize(event, data);

		for (let socketId in this.sockets) {
			if (!exclude.includes(socketId)) {
				this.sockets[socketId].send(out);
			}
		}
	}
}
