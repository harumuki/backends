const { Roles } = require('@orbiting/backend-modules-auth')

const { findBySlug } = require('../../../lib/elections')

/**
 * Allows candidates with admin role to cancel their own candidacy.
 */
module.exports = async (_, { slug }, { pgdb, user: me }) => {
  Roles.ensureUserIsInRoles(me, ['admin'])

  const election = await findBySlug(slug, null, pgdb)

  if (!election) {
    throw new Error(`No election for slug ${slug}`)
  }

  await pgdb.public.electionCandidacies
    .deleteOne({ userId: me.id, electionId: election.id })

  return findBySlug(slug, null, pgdb)
}