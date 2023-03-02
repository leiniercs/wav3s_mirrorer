const path = require('node:path');
const sqlite3 = require('sqlite3');

class SQLiteDatabase {
	constructor() {
		this._db = new sqlite3.Database(path.join(__dirname, 'lens.db'));

		this._db.run("CREATE TABLE IF NOT EXISTS publications (pubId TEXT NOT NULL, rewardCurrency TEXT NOT NULL, rewardAmount REAL NOT NULL, timestamp INTEGER DEFAULT CURRENT_TIMESTAMP, mirrored INTEGER DEFAULT 0)");
	}

	isPublicationIndexed(id) {
		return new Promise((resolve, reject) => {
			this._db.get(`SELECT pubId FROM publications WHERE (pubId = '${id}') LIMIT 1`, (err, row) => {
				if (err || !row) {
					resolve(false);
				} else {
					resolve(true);
				}
			});
		});
	}

	indexPublication(id, rewardCurrency, rewardAmount) {
		this._db.run("INSERT INTO publications (pubId, rewardCurrency, rewardAmount) VALUES (?, ?, ?)", [ id, rewardCurrency, rewardAmount ]);
	}

	mirrorPublication(id) {
		this._db.run("UPDATE publications SET mirrored = 1 WHERE pubId = ?", [ id ]);
	}
}

module.exports = { SQLiteDatabase };
