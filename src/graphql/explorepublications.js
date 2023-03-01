const ExplorePublicationsRequest = `
	query ExplorePublications($request: ExplorePublicationRequest!) {
		explorePublications(request: $request) {
			items {
				__typename
				... on Post {
					...PostFields
				}
			}
			pageInfo {
				...CommonPaginatedResultInfoFields
			}
		}
	}

	fragment PostFields on Post {
		id
		metadata {
			attributes {
				displayType
				traitType
				value
			}
		}
		stats {
			totalAmountOfMirrors
		}
		referenceModule {
			...ReferenceModuleFields
		}
		hidden
	}

	fragment ReferenceModuleFields on ReferenceModule {
		... on FollowOnlyReferenceModuleSettings {
		  type
		  contractAddress
		}
		... on UnknownReferenceModuleSettings {
		  type
		  contractAddress
		  referenceModuleReturnData
		}
		... on DegreesOfSeparationReferenceModuleSettings {
		  type
		  contractAddress
		  commentsRestricted
		  mirrorsRestricted
		  degreesOfSeparation
		}
	}
`;

module.exports = { ExplorePublicationsRequest };