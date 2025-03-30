import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

function getUserPath(id) {
	return './users/' + id + '.json';
}

const fileOptions = { encoding: 'utf8' };

export class User {
	constructor(data) {
		Object.assign(this, data);
	}

	save() {
		const userPath = getUserPath(this.id);
		const data = JSON.stringify(this, null, '\t');

		return writeFile(userPath, data, fileOptions);
	}
}

User.create = function ({ name }) {
	const id = randomUUID();
	const now = Date.now();

	name = name || 'Apprentice User';

	return new User({
		color: `#${Math.random().toString(16).slice(-6)}`,
		id,
		lastLogin: now,
		lastLogout: now,
		name,
		created: now,
	});
};

User.load = function (id) {
	const userPath = getUserPath(id);

	return readFile(userPath, fileOptions).then(function (data) {
		let parsedData = {};

		try {
			parsedData = JSON.parse(data);
		} catch (e) {
			console.log('error parsing:', userPath, data);
			throw e;
		}

		return new User(parsedData);
	});
};
