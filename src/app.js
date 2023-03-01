require('dotenv').config();
const { Lens } = require('./lens');
const lensConnection = new Lens();
let _defaultProfileId = '';
let timerWav3sMonitorization = null;


function getLatestWav3s() {
	lensConnection.getLatestWav3sCampaigns()
		.then((publications) => {
			for (let publication of publications) {
				if (!publication.referenceModule) {
					for (let attribute of publication.metadata.attributes) {
						if (attribute.traitType === 'mirrorGoal') {
							if (Number(publication.stats.totalAmountOfMirrors) < Number(attribute.value)) {
								lensConnection.mirror(_defaultProfileId, publication.id);
							}
						}
					}
				}
			}
	})
		.catch((reason) => {
			console.error(reason);
		});
}

function startWav3sMonitorization() {
	timerWav3sMonitorization = setInterval(getLatestWav3s, 60000);
	getLatestWav3s();
}

process.on('SIGINT', function () {
	if (lensConnection.isLoggedIn() === true) {
		if (timerWav3sMonitorization != null) {
			clearInterval(timerWav3sMonitorization);
		}

		lensConnection.logOut();
	}
});

lensConnection.logIn()
	.then(() => {
		lensConnection.getDefaultProfileId()
			.then((value) => {
				_defaultProfileId = value.id;
				
				lensConnection.mirror(
					_defaultProfileId,
					'0x019c4c-0x01ec'
				).then((value) => {
					console.log(value);
				}).catch((reason) => {
					console.error(reason);
				});

//				startWav3sMonitorization();
			})
			.catch((reason) => {
				console.error(reason);
			})
		;
	})
	.catch((reason) => {
		console.error(reason);
	})
;
