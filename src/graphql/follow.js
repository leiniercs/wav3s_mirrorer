const CreateFollowTypedData = `
	mutation CreateFollowTypedData($request: FollowRequest!) {
		createFollowTypedData(request: $request) {
			id
			expiresAt
			typedData {
				domain {
					name
					chainId
					version
					verifyingContract
				}
				types {
					FollowWithSig {
						name
						type
					}
				}
				value {
					nonce
					deadline
					profileIds
					datas
				}
			}
		}
	}
`;

module.exports = { CreateFollowTypedData };