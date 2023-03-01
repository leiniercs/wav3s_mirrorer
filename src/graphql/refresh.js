const RefreshRequest = `
	mutation Refresh($request: RefreshRequest!) {
		refresh(request: $request) {
			accessToken
			refreshToken
		}
	}
`;

module.exports = { RefreshRequest };