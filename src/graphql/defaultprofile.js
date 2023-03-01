const DefaultProfileRequest = `
	query defaultProfile($request: DefaultProfileRequest!) {
		defaultProfile(request: $request) {
			id
		}
	}
`;

module.exports = { DefaultProfileRequest };