const ProfileRequest = `
	query Profile($request: SingleProfileQueryRequest!) {
		profile(request: $request) {
			followModule {
				... on ProfileFollowModuleSettings {
					type
				}
			}
		}
	}
`;

module.exports = { ProfileRequest };