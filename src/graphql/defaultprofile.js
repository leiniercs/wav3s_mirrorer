const DefaultProfileRequest = `
	query defaultProfile($request: DefaultProfileRequest!) {
		defaultProfile(request: $request) {
			id
			stats {
				totalFollowers
			}
		}
	}
`;

module.exports = { DefaultProfileRequest };