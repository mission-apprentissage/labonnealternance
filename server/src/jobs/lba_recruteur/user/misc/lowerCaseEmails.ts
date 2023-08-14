import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
import { runScript } from "../../../scriptWrapper.js"
import { IUserRecruteur } from "../../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { CFA, ENTREPRISE, etat_utilisateur } from "../../../../common/constants.js"
import { groupBy, flatMap } from "lodash-es"

/**
 * @description lowercase all email of the UserRecruter collection documents
 * @param {Object} db database connector
 * @returns {Promise}
 */
const lowercaseAllEmail = (db) => db.collection("userrecruteurs").updateMany({}, { $set: { email: { $toLower: "email" } } })

/**
 * @description get related users based on an email, case insensitive, sorted by last_connection date
 * @param {string} user email
 * @returns {Promise}
 */
const getduplicatesOfTheSameUser = (email: IUserRecruteur["email"]) =>
  UserRecruteur.find({ email: { $regex: new RegExp(email, "i") } })
    .sort({ last_connection: -1 })
    .lean()
/**
 * @description remove ENTREPRISE from UserRecruteurs & Recruiter collection
 * @param {Object} user user object
 * @returns {Promise}
 */
const removeUserAndCompany = ({ establishment_id, _id }: Pick<IUserRecruteur, "establishment_id" | "_id">) =>
  Promise.all([Recruiter.findOneAndDelete({ establishment_id }), UserRecruteur.findByIdAndDelete(_id)])

/**
 * @description remove CFA from UserRecruteurs & delegatee of the CFA from Recruiter collection
 * @param {Object} user user object
 * @returns {Promise}
 */
const removeUserAndDelegatee = ({ establishment_siret, _id }: Pick<IUserRecruteur, "establishment_siret" | "_id">) =>
  Promise.all([Recruiter.deleteMany({ cfa_delegated_siret: establishment_siret }), UserRecruteur.findByIdAndDelete(_id)])

/**
 * @description find duplicates from a given array of users, base on their email, whatever the casing
 * @param {string} users list of users from UserRecruteur collection
 * @returns {Array} list of duplicated user matched on case insensitive email
 */
const findDuplicates = (users: IUserRecruteur[]) =>
  Object.entries(groupBy(users, (user) => user.email.toLowerCase())).flatMap(([email, users]: [email: string, users: string[]]) => (users.length > 1 ? [email] : []))

/**
 * @description clean up UserRecruteur & Recruiters collection of document from type ENTREPRISE
 * @param {Object} establishments
 */
const cleanUsersOfTypeENTREPRIE = async (establishments: IUserRecruteur[]) => {
  // get all duplicated users of type ENTREPRISE
  const duplicatedLowerCaseEmails = findDuplicates(establishments)

  // triage logic
  await asyncForEach(duplicatedLowerCaseEmails, async (email) => {
    const duplicatesOfTheSameUser = await getduplicatesOfTheSameUser(email)

    // create stash
    const stash = { user: null, establishment: null }

    // if only two duplicates (most of the cases) and at least one of them is inactive, remove UserRecruters & Recruiters documents
    if (duplicatesOfTheSameUser.length === 2) {
      const inactiveUser = duplicatesOfTheSameUser.filter((x) => x.status.pop().status !== etat_utilisateur.VALIDE)
      if (inactiveUser.length) {
        await removeUserAndCompany(inactiveUser[0])
        return
      }
    } else {
      await asyncForEach(duplicatesOfTheSameUser, async (user: IUserRecruteur) => {
        // if user is inactive, remove UserRecruters & Recruiters documents
        if (user.status.pop().status !== etat_utilisateur.VALIDE) {
          await removeUserAndCompany(user)
          return
        }

        // get related Recruiters document
        const establishment = await Recruiter.findOne({ establishment_id: user.establishment_id })

        // update stash and accumulate jobs into a single establishment
        if (!stash.user) {
          stash.user = user
          stash.establishment = establishment
        } else {
          stash.establishment.jobs = [...stash.establishment.jobs, ...establishment.jobs]
        }
      })
    }
    // save stashed establishment with accumulated jobs. user does not change
    await Recruiter.findByIdAndUpdate(stash.establishment._id, stash.establishment)
  })
}

/**
 * @description clean up UserRecruteur & Recruiters collection of document from type ENTREPRISE
 * @param cfas
 */
const cleanUsersOfTypeCFA = async (cfas: IUserRecruteur[]) => {
  // get all duplicates
  const duplicatedLowerCaseEmails = findDuplicates(cfas)

  // triage logic
  await asyncForEach(duplicatedLowerCaseEmails, async (email) => {
    const duplicatesOfTheSameUser = await getduplicatesOfTheSameUser(email)

    const stash = []

    // if only two duplicates (most of the cases) and at least one of them is inactive, remove UserRecruters & Recruiters documents
    if (duplicatesOfTheSameUser.length === 2) {
      const inactiveUser = duplicatesOfTheSameUser.filter((x) => x.status.pop().status !== etat_utilisateur.VALIDE)
      if (inactiveUser.length) {
        await removeUserAndCompany(inactiveUser[0])
        return
      }
    } else {
      await asyncForEach(duplicatesOfTheSameUser, async (user: IUserRecruteur) => {
        // if user is inactive, remove UserRecruters & Recruiters documents
        if (user.status.pop().status !== etat_utilisateur.VALIDE) {
          await removeUserAndDelegatee(user)
          return
        }

        if (!stash.length) {
          // stash user
          stash.push(user)
        } else {
          // check if stashed CFA is already stashed
          const found = stash.find((x) => x.establishment_siret === user.establishment_siret)
          if (found) {
            // remove duplicate from UserRecruteur collection. Link with Recruiters is kept intact.
            await UserRecruteur.findByIdAndDelete(user._id)
          }
        }
      })
    }
  })
}

runScript(async ({ db }) => {
  const [establishments, cfas] = await Promise.all([UserRecruteur.find({ type: ENTREPRISE }).lean(), UserRecruteur.find({ type: CFA }).lean()])

  await cleanUsersOfTypeENTREPRIE(establishments)
  await cleanUsersOfTypeCFA(cfas)
  await lowercaseAllEmail(db)
})
