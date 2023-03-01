const ChallengeRequest = `
	query Challenge($request: ChallengeRequest!) {
		challenge(request: $request) {
			text
		}
	}
`;

module.exports = { ChallengeRequest };