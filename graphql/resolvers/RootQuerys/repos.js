const { githubApolloFetch } = require('../../../lib/github')
const { ensureUserHasRole } = require('../../../lib/Roles')
const {
  GITHUB_LOGIN,
  REPOS_NAME_FILTER
} = process.env

module.exports = async (_, args, { user }) => {
  ensureUserHasRole(user, 'editor')

  const { first } = args

  const {
    data: {
      search: {
        nodes: repositories
      }
    }
  } = await githubApolloFetch({
    query: `
      query repositories(
        $first: Int!
        $query: String!
      ) {
        search(
          first: $first
          query: $query
          type: REPOSITORY
        ) {
          nodes {
            ... on Repository {
              name
              owner {
                login
              }
            }
          }
        }
      }
    `,
    variables: {
      query: `org:${GITHUB_LOGIN} ${REPOS_NAME_FILTER ? REPOS_NAME_FILTER + ' in:name' : ''}`,
      first
    }
  })

  return repositories.map(repo => ({
    id: `${repo.owner.login}/${repo.name}`
  }))
}
