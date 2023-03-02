const { ApolloClient, from, InMemoryCache, ApolloLink, HttpLink } = require('@apollo/client/core');
const gql = require('graphql-tag');
const { SQLiteDatabase } = require('./sqlite');
const { ChallengeRequest } = require('./graphql/challenge');
const { AuthenticateRequest } = require('./graphql/authenticate');
const { RefreshRequest } = require('./graphql/refresh');
const { DefaultProfileRequest } = require('./graphql/defaultprofile');
const { ProfileRequest } = require('./graphql/profile');
const { ExplorePublicationsRequest } = require('./graphql/explorepublications');
const { CreateFollowTypedData } = require('./graphql/follow');
const { CreateMirrorTypedDataRequest } = require('./graphql/mirror');


class GraphQL {
	constructor() {
		const defaultOptions = {
			watchQuery: {
				fetchPolicy: 'no-cache',
				errorPolicy: 'ignore'
			},
			query: {
				fetchPolicy: 'no-cache'
			}
		};
		this._database = new SQLiteDatabase();
		this._cache = new InMemoryCache();
		this._authLink = new ApolloLink((operation, forward) => {
			if (this._accessToken) {
				operation.setContext({
					headers: {
						'x-access-token': `Bearer ${this._accessToken}`
					}
				});
			}
		 
			return forward(operation);
		});		 
		this._httpLink = new HttpLink({
			uri: process.env.LENS_API_SERVER
		});
		this.client = new ApolloClient({
			cache: this._cache,
			link: from([ this._authLink, this._httpLink ]),
			name: 'wav3s-mirrorer',
			version: '0.1.0',
			defaultOptions: defaultOptions
		});
	}

	destroy() {
		delete this._authLink;
		delete this._httpLink;
		delete this._cache;
		delete this.client;
	}

	async query(query, variables) {
		return this.client.query({ query: gql`${query}`, variables: variables });
	}

	async mutate(mutation, variables) {
		return this.client.mutate({ mutation: gql`${mutation}`, variables: variables });
	}

	challenge(walletAddress) {
		return new Promise((resolve, reject) => {
			this.query(
				ChallengeRequest,
				{
					request: {
						address: walletAddress
					}
				}
			).then((value) => {
				resolve(value.data.challenge);
			}).catch(reject);
		});
	}

	authenticate(walletAddress, signedMessage) {
		return new Promise((resolve, reject) => {
			this.mutate(
				AuthenticateRequest,
				{
					request: {
						address: walletAddress,
						signature: signedMessage
					}
				}
			).then((value) => {
				this._accessToken = value.data.authenticate.accessToken;
				resolve(value.data.authenticate);
			}).catch(reject);
		});
	}

	refreshAccessToken(refreshToken) {
		return new Promise((resolve, reject) => {
			this.mutate(
				RefreshRequest,
				{
					request: {
						refreshToken: refreshToken
					}
				}
			).then((value) => {
				this._accessToken = value.data.refresh.accessToken;
				resolve(value.data.refresh);
			}).catch(reject);
		});
	}

	getDefaultProfileId(walletAddress) {
		return new Promise((resolve, reject) => {
			this.query(
				DefaultProfileRequest,
				{
					request: {
						ethereumAddress: walletAddress
					}
				}
			).then((value) => {
				resolve(value.data.defaultProfile);
			}).catch(reject);
		});
	}

	getProfileById(id) {
		return new Promise((resolve, reject) => {
			this.query(
				ProfileRequest,
				{
					request: {
						profileId: id
					}
				}
			).then((value) => {
				resolve(value.data.profile);
			}).catch(reject);
		});
	}

	getLatestWav3sCampaigns() {
		return new Promise((resolve, reject) => {
			return this.query(
				ExplorePublicationsRequest,
				{
					request: {
						sortCriteria: 'LATEST',
						publicationTypes: [ 'POST' ],
						sources: [ 'wav3s' ],
						limit: 50
					}
				}
			).then(async (value) => {
				const publications = [];

				for (let publication of value.data.explorePublications.items) {
					if (await this._database.isPublicationIndexed(publication.id) === false) {
						let rewardCurrency = 0.0;
						let rewardAmount = '';

						for (let attribute of publication.metadata.attributes) {
							switch (attribute.traitType) {
								case 'currency':
									rewardCurrency = attribute.value;
									break;
								case 'mirrorReward':
									rewardAmount = Number(attribute.value);
									break;
								default:
									break;
							}
						}

						this._database.indexPublication(publication.id, rewardCurrency, rewardAmount);
						publications.push(publication);
					}
				}

				resolve(publications);
			}).catch(reject);
		});
	}

	createFollowTypedData(defaultProfileId, profileIds) {
		return new Promise(async (resolve, reject) => {
			const followData = [];
			
			for (let profileId of profileIds) {
				const profileData = await this.getProfileById(profileId);

				if (!profileData.followModule) {
					followData.push({
						profile: profileId
					});
				} else if (profileData.type === 'ProfileFollowModule') {
					followData.push({
						profile: profileId,
						followModule: {
							profileFollowModule: {
								profileId: defaultProfileId
							}  
						}
					});
				}
			}

			if (followData.length === 0) {
				reject('No profiles to follow');
			} else {
				this.mutate(
					CreateFollowTypedData,
					{
						request: {
							follow: followData
						}
					}
				).then((value) => {
					resolve(value.data.createFollowTypedData);
				}).catch(reject);
			}
		});
	}

	createMirrorTypedData(profileId, publicationId) {
		return new Promise((resolve, reject) => {
			this.mutate(
				CreateMirrorTypedDataRequest,
				{
					request: {
						profileId: profileId,
						publicationId: publicationId,
						referenceModule: {
							followerOnlyReferenceModule: false
						}
					}
				}
			).then((value) => {
				resolve(value.data.createMirrorTypedData);
			}).catch(reject);
		});
	}

	mirror(publicationId) {
		this._database.mirrorPublication(publicationId);
	}
}

module.exports = { GraphQL };