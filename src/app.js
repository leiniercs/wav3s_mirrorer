require('dotenv').config();
const { Lens } = require('./lens');
const lensConnection = new Lens();
let _defaultProfile = {};
let _updateTokensTimer = null;
let _timerWav3sMonitorization = null;


function refreshTokens() {
	lensConnection.refreshTokens()
		.then(() => {
			getDefaultProfileData();
		})
		.catch(console.error)
	;
}

function getDefaultProfileData(callback) {
	lensConnection.getDefaultProfileId()
		.then((value) => {
			_defaultProfile = {
				id: value.id,
				followers: Number(value.stats.totalFollowers)
			};

			if (callback) { callback(); }
		})
		.catch(console.error)
	;
}

function getLatestWav3s() {
	lensConnection.getLatestWav3sCampaigns()
		.then((publications) => {
			const profileIdsToFollow = [];
			const publicationsToMirror = [];

			for (let publication of publications) {
				let mirrorPublication = false;
				let minimumFollowers = false;
				let followProfile = false;

				if (!publication.referenceModule) {
					for (let attribute of publication.metadata.attributes) {
						switch (attribute.traitType) {
							case 'onlyFollowersFilter':
								if (attribute.value === 'true' && publication.profile.isFollowedByMe === false) {
									followProfile = true;
								}
								break;
							case 'mirrorMinimumFollowers':
								if (_defaultProfile.followers >= Number(attribute.value)) {
									minimumFollowers = true;
								}
								break;
							case 'mirrorGoal':
								if (Number(publication.stats.totalAmountOfMirrors) < Number(attribute.value)) {
									mirrorPublication = true;
								}
								break;
							default:
								break;
						}
					}
				}

				if (mirrorPublication && minimumFollowers) {
					publicationsToMirror.push(publication.id);

					if (followProfile) {
						profileIdsToFollow.push(publication.id.split('-')[0]);
					}
				}
			}

			if (profileIdsToFollow.length > 0) {
				lensConnection.follow(_defaultProfile.id, profileIdsToFollow).catch(console.error);
			}

			if (publicationsToMirror.length > 0) {
				for (let publicationId of publicationsToMirror) {
					lensConnection.mirror(_defaultProfile.id, publicationId).catch(console.error);
				}
			}
		})
		.catch(console.error)
	;
}

function startWav3sMonitorization() {
	_timerWav3sMonitorization = setInterval(getLatestWav3s, 60000);
	getLatestWav3s();
}

process.on('SIGINT', function () {
	if (lensConnection.isLoggedIn() === true) {
		if (_updateTokensTimer != null) {
			clearInterval(_updateTokensTimer);
		}
		if (_timerWav3sMonitorization != null) {
			clearInterval(_timerWav3sMonitorization);
		}

		lensConnection.logOut();
	}
});

lensConnection.logIn()
	.then(() => {
		_updateTokensTimer = setInterval(refreshTokens, 28 * 60 * 1000);
		getDefaultProfileData(startWav3sMonitorization);
	})
	.catch(console.error)
;
