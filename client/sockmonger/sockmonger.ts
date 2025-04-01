import * as events from 'events';

const { EventEmitter } = events;

const SEPARATOR = ':';

function deserialize(str: string) {
	const dataAfter = str.indexOf(SEPARATOR);
	const name = str.substring(0, dataAfter);
	const rawData = str.substring(dataAfter + 1)

	let data;
	if (rawData !== 'undefined') {
		try {
			data = JSON.parse(rawData);
		} catch (e) {
			console.error('Failed to parse', rawData);
		}
	}

	return { name, data };
}

function serialize(name: string, data: any) {
	return `${name}${SEPARATOR}${JSON.stringify(data)}`;
}

const RECONNECT_DELAY = 1000;

export class SockMonger extends EventEmitter {
	reconnect: boolean;
	timeout?: number;
	url: string;
	ws?: WebSocket;

	constructor(url: string) {
		super();

		this.reconnect = false;
		this.remoteEmit = this.remoteEmit.bind(this);
		this.url = url;
	}

	connect() {
		this.reconnect = true;
		const ws = new WebSocket(this.url);

		ws.onclose = this.onclose.bind(this);
		ws.onerror = this.onerror.bind(this);
		ws.onmessage = this.onmessage.bind(this);
		ws.onopen = this.onopen.bind(this);

		this.ws = ws;
	}

	disconnect() {
		this.reconnect = false;
		this.ws?.close();
	}

	onclose(event: CloseEvent) {
		this.emit('close', event);

		if (this.ws) {
			this.ws.onclose = null;
			this.ws.onerror = null;
			this.ws.onmessage = null;
			this.ws.onopen = null;
		}

		clearTimeout(this.timeout);

		if (!this.reconnect) return;

		setTimeout(() => {
			this.connect();
		}, RECONNECT_DELAY);
	}

	onerror(event: Event) {
		this.emit('error', event);
	}

	onmessage(event: MessageEvent) {
		const { data, name } = deserialize(event.data);
		this.emit(name, data);
		this.startTimer();
	}

	onopen(event: Event) {
		this.emit('open', event);
		this.startTimer();
	}

	remoteEmit(name: string, data: any = null) {
		this.ws?.send(serialize(name, data));
		this.startTimer();
	}

	startTimer() {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.remoteEmit('ping');
		}, 45000);
	}
}
