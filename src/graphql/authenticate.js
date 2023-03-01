const AuthenticateRequest = `
	mutation authenticate($request: SignedAuthChallenge!) {
		authenticate(request: $request) {
			accessToken
			refreshToken
		}
	}
`;

module.exports = { AuthenticateRequest };