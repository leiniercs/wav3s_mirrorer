const { GraphQL } = require('./graphql');
const { HDWallet } = require('./wallet');
const { Contract, parseUnits } = require('ethers');
const omitDeep = require('omit-deep');
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util')


class Lens {
	constructor() {
		this._wallet = new HDWallet();
		this._loggedIn = false;
		this._abiLensHub = JSON.parse(fs.readFileSync(
			path.join(__dirname, 'abi/lenshub.json'),
			'utf8'
		));
		this.refreshTokens = this.refreshTokens.bind(this);
	}

	isLoggedIn() {
		return this._loggedIn;
	}

	updateTokens(accessToken, refreshToken) {
		this._accessToken = accessToken;
		this._refreshToken = refreshToken;
	}

	logIn() {
		return new Promise((resolve, reject) => {
			if (this._loggedIn === true) { throw new Error('Already logged in.'); }

			const walletAddress = this._wallet.getWalletAddress();
			
			this._graphQL = new GraphQL();
			this._graphQL.challenge(walletAddress)
				.then((challenge) => {
					this._wallet.signMessage(challenge.text)
						.then((value) => {
							this._graphQL.authenticate(walletAddress, value)
								.then((authenticate) => {
									this.updateTokens(authenticate.accessToken, authenticate.refreshToken);
									this._updateTokensTimer = setInterval(this.refreshTokens, 28 * 60 * 1000);
									this._loggedIn = true;

									resolve();
								})
								.catch((reason) => {
									reject(`[Lens::GraphQL::Authenticate] Error: ${reason}`);
								})
							;
						})
						.catch((reason) => {
							reject(`[Lens::Wallet::signMessage] Error: ${reason}`);
						})
					;
				})
				.catch((reason) => {
					reject(`[Lens::GraphQL::Challenge] Error: ${reason}`);
				})
			;
		});
	}

	logOut() {
		if (this._loggedIn === false) { throw new Error('Not logged in.'); }

		clearInterval(this.updateTokensTimer);
		this._updateTokensTimer = undefined;
		delete this._accessToken;
		delete this._refreshToken;
		this._graphQL.destroy();
		delete this._graphQL;
		delete this._wallet;

		this._loggedIn = false;
	}

	refreshTokens() {
		if (this._loggedIn === true) {
			this._graphQL.refreshAccessToken(
				this._refreshToken
			).then((refresh) => {
				this.updateTokens(refresh.accessToken, refresh.refreshToken);
			}).catch((reason) => {
				reject(`[Lens::GraphQL::RefreshTokens] Error: ${reason}`);
			});
		}
	}

	getDefaultProfileId() {
		if (this._loggedIn === false) { throw new Error('Not logged in.'); }

		return this._graphQL.getDefaultProfileId(this._wallet.getWalletAddress());
	}

	getLatestWav3sCampaigns() {
		if (this._loggedIn === false) { throw new Error('Not logged in.'); }

		return this._graphQL.getLatestWav3sCampaigns();
	}

	mirror(profileId, publicationId) {
		if (this._loggedIn === false) { throw new Error('Not logged in.'); }

		return new Promise((resolve, reject) => {
			this._graphQL.createMirrorTypedData(
				profileId,
				publicationId
			).then((mirrorTypedData) => {
				this._wallet.signTypedData(
					omitDeep(mirrorTypedData.typedData.domain, [ '__typename' ]),
					omitDeep(mirrorTypedData.typedData.types, [ '__typename' ]),
					omitDeep(mirrorTypedData.typedData.value, [ '__typename' ])
				).then(async (signedTypedData) => {
					const { v, r, s } = this._wallet.splitSignature(signedTypedData);
					const lensHub = new Contract(process.env.LENS_CONTRACT_HUB, this._abiLensHub, this._wallet.getWallet());

					lensHub.mirrorWithSig({
						profileId: mirrorTypedData.typedData.value.profileId,
						profileIdPointed: mirrorTypedData.typedData.value.profileIdPointed,
						pubIdPointed: mirrorTypedData.typedData.value.pubIdPointed,
						referenceModuleData: mirrorTypedData.typedData.value.referenceModuleData,
						referenceModule: mirrorTypedData.typedData.value.referenceModule,
						referenceModuleInitData: mirrorTypedData.typedData.value.referenceModuleInitData,
						sig: {
							v, r, s,
							deadline: mirrorTypedData.typedData.value.deadline
						}
					}, { gasLimit: 400000 }).then((tx) => {
						console.log(util.inspect(tx, false, 5, true));
						resolve(true);
						return;
						tx.wait(
							1
						).then((receipt) => {
							resolve(receipt);
						}).catch((reason) => {
							reject(`[Lens::Contract::mirrorWithSig::TX] Error: ${reason}`);
						});
					}).catch((reason) => {
						reject(`[Lens::Contract::mirrorWithSig] Error: ${reason}`);
					});
				})
				.catch((reason) => {
					reject(`[Lens::Wallet::SignTypedData] Error: ${reason}`);
				});
			})
			.catch((reason) => {
				reject(`[Lens::GraphQL::CreateMirrorTypedData] Error: ${reason}`);
			});
		});
	}
}

module.exports = { Lens };