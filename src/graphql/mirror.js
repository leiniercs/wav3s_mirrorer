const CreateMirrorTypedDataRequest = `
	mutation CreateMirrorTypedData($request: CreateMirrorRequest!) {
		createMirrorTypedData(request: $request) {
			id
			expiresAt
			typedData {
				types {
					MirrorWithSig {
						name
						type
					}
				}
				domain {
					name
					chainId
					version
					verifyingContract
				}
				value {
					nonce
					deadline
					profileId
					profileIdPointed
					pubIdPointed
					referenceModuleData
					referenceModule
					referenceModuleInitData
				}
			}
		}
	}
`;

module.exports = { CreateMirrorTypedDataRequest };