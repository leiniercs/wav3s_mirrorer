const { ApolloClient, from, InMemoryCache, ApolloLink, HttpLink } = require('@apollo/client/core');
const gql = require('graphql-tag');
const { ChallengeRequest } = require('./graphql/challenge');
const { AuthenticateRequest } = require('./graphql/authenticate');
const { RefreshRequest } = require('./graphql/refresh');
const { DefaultProfileRequest } = require('./graphql/defaultprofile');
const { ExplorePublicationsRequest } = require('./graphql/explorepublications');
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
			}).catch((reason) => {
				reject(reason);
			});
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
			}).catch((reason) => {
				reject(reason);
			});
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
			}).catch((reason) => {
				reject(reason);
			});
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
			}).catch((reason) => {
				reject(reason);
			});
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
						limit: 10
					}
				}
			).then((value) => {
				resolve(value.data.explorePublications.items);
			}).catch((reason) => {
				reject(reason);
			});
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
			}).catch((reason) => {
				reject(reason);
			});
		});
	}
}

module.exports = { GraphQL };