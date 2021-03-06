const Redis = require('@orbiting/backend-modules-base/lib/Redis')
const getRepos = require('@orbiting/backend-modules-publikator/graphql/resolvers/_queries/repos')
const {
  latestPublications: getLatestPublications,
} = require('@orbiting/backend-modules-publikator/graphql/resolvers/Repo')
const {
  upsert: repoCacheUpsert,
} = require('@orbiting/backend-modules-publikator/lib/cache/upsert')

const iterateRepos = async (context, callback) => {
  let pageInfo
  let pageCounter = 0

  do {
    console.info(`requesting repos (page ${pageCounter++}) ...`)

    const repos = await getRepos(
      null,
      {
        first: 20,
        orderBy: {
          field: 'PUSHED_AT',
          direction: 'DESC',
        },
        ...(pageInfo && pageInfo.hasNextPage
          ? { after: pageInfo.endCursor }
          : {}),
      },
      context,
    )

    pageInfo = repos.pageInfo

    for (const repo of repos.nodes) {
      await callback(repo, await getLatestPublications(repo, null, context))
    }
  } while (pageInfo && pageInfo.hasNextPage)
}

module.exports = {
  before: () => {},
  insert: async ({ indexName, type: indexType, elastic, pgdb }) => {
    const stats = { [indexType]: { added: 0, total: 0 } }
    const statsInterval = setInterval(() => {
      console.log(indexName, stats)
    }, 1 * 1000)

    const context = {
      redis: Redis.connect(),
      pgdb,
      user: {
        name: 'publikator-pullelasticsearch',
        email: 'ruggedly@republik.ch',
        roles: ['editor'],
      },
    }

    await iterateRepos(context, async (repo, publications) => {
      stats[indexType].total++
      stats[indexType].added++

      await repoCacheUpsert(
        {
          commit: repo.latestCommit,
          content: repo.latestCommit.document.content,
          createdAt: repo.createdAt,
          isArchived: repo.isArchived,
          isTemplate: repo.isTemplate,
          id: repo.id,
          meta: repo.meta,
          name: repo.id.split('/')[1],
          publications,
          tags: repo.tags,
          updatedAt: repo.updatedAt,
          refresh: false,
        },
        { elastic },
      )
    })

    clearInterval(statsInterval)

    console.log(indexName, stats)
  },
  after: () => {},
}
