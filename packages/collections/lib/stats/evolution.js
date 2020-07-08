const debug = require('debug')('collections:lib:stats:evolution')

const { cache: { create } } = require('@orbiting/backend-modules-utils')

const QUERY_CACHE_TTL_SECONDS = 60 * 60 * 24 // A day

const query = `
WITH "documentsMedias" AS (
  SELECT
    to_char(cdi."createdAt", 'YYYY-MM') "key",
    cdi."collectionId",
    cdi."repoId" "id",
    cdi."userId",
    'document' "type"

  FROM "collectionDocumentItems" cdi

  /* UNION

  SELECT 
    to_char(cmi."createdAt", 'YYYY-MM') "key",
    cmi."collectionId",
    cmi."mediaId" "id",
    cmi."userId",
    'media' "type"

  FROM "collectionMediaItems" cmi */
)

SELECT
  dm.key,
  dm."collectionId",
  COUNT(*) "records",
  COUNT(DISTINCT dm.id) FILTER (WHERE dm.type = 'document') "documents",
  COUNT(DISTINCT dm.id) FILTER (WHERE dm.type = 'media') "medias",
  COUNT(DISTINCT dm."userId") "users"

FROM "documentsMedias" dm
GROUP BY 1, 2
`

const createCache = (context) => create(
  {
    namespace: 'collections',
    prefix: 'stats:evolution',
    key: 'any',
    ttl: QUERY_CACHE_TTL_SECONDS
  },
  context
)

const populate = async (context, resultFn) => {
  debug('populate')

  const { pgdb } = context

  // Generate date for range
  const result = await pgdb.query(query)

  if (resultFn) {
    return resultFn(result)
  }

  // Cache said data.
  await createCache(context).set({ result, updatedAt: new Date() })
}

module.exports = {
  createCache,
  populate
}