// @ts-nocheck
import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
import { runScript } from "../../../scriptWrapper.js"
import { IUserRecruteur } from "../../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { logger } from "../../../../common/logger.js"
import { CFA, ENTREPRISE, etat_utilisateur } from "../../../../common/constants.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"

/**
 * @description lowercase all email of the UserRecruter collection documents
 * @param {Object} db database connector
 * @returns {Promise}
 */
const lowercaseAllEmail = (db) => db.collection("userrecruteurs").updateMany({}, { $set: { email: { $toLower: "email" } } })

/**
 * @description get related users based on an email, case insensitive, sorted by last_connection date
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
const removeUserAndCompany = ({ establishment_id, _id }: { establishment_id: IUserRecruteur["establishment_id"]; _id: IUserRecruteur["_id"] }) =>
  Promise.all([Recruiter.findOneAndDelete({ establishment_id }), UserRecruteur.findByIdAndDelete(_id)])

/**
 * @description remove CFA from UserRecruteurs & delegatee of the CFA from Recruiter collection
 * @param {Object} user user object
 * @returns {Promise}
 */
const removeUserAndDelegatee = ({ establishment_siret, _id }: { establishment_siret: IUserRecruteur["establishment_siret"]; _id: IUserRecruteur["_id"] }) =>
  Promise.all([Recruiter.deleteMany({ cfa_delegated_siret: establishment_siret }), UserRecruteur.findByIdAndDelete(_id)])

/**
 * @description find duplicates from a given array of users, base on their email, whatever the casing
 * @param {string} users list of users from UserRecruteur collection
 * @returns {Array} list of duplicated user matched on case insensitive email
 */
const findDuplicates = (users: IUserRecruteur) => {
  const duplicates = {}
  const processedEmails = []

  users.forEach((user) => {
    const lowercaseEmail = user.email.toLowerCase()

    if (processedEmails.includes(lowercaseEmail)) {
      if (!duplicates[lowercaseEmail]) {
        duplicates[lowercaseEmail] = [user.email]
      } else {
        duplicates[lowercaseEmail].push(user.email)
      }
    } else {
      processedEmails.push(lowercaseEmail)
    }
  })
  return duplicates
}

/**
 * @description clean up UserRecruteur & Recruiters collection of document from type ENTREPRISE
 * @param {Object} establishments
 */
const cleanUsersOfTypeENTREPRIE = async (establishments: IUserRecruteur[]) => {
  // get all duplicated users of type ENTREPRISE
  const duplicatedUsers = findDuplicates(establishments)

  // triage logic
  await asyncForEach(Object.keys(duplicatedUsers), async (email) => {
    const duplicatesOfTheSameUser = await UserRecruteur.find({ email: { $regex: new RegExp(email, "i") } })
      .sort({ last_connection: -1 })
      .lean()

    // create stash
    const stash = { user: null, establishment: null }

    // if only two duplicates (most of the cases) and at least one of them is inactive, remove UserRecruters & Recruiters documents
    if (duplicatesOfTheSameUser.length === 2) {
      const inactiveUser = duplicatesOfTheSameUser.filter((x) => x.status.pop().status !== etat_utilisateur.VALIDE)
      if (inactiveUser.length) {
        await removeUserAndCompany(inactiveUser)
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
  })
}

/**
 * @description clean up UserRecruteur & Recruiters collection of document from type ENTREPRISE
 * @param cfas
 */
const cleanUsersOfTypeCFA = async (cfas: IUserRecruteur[]) => {
  // get all duplicates
  const duplicatedUsers = findDuplicates(cfas)

  // triage logic
  await asyncForEach(Object.keys(duplicatedUsers), async (email) => {
    const duplicatesOfTheSameUser = await UserRecruteur.find({ email: { $regex: new RegExp(email, "i") } })
      .sort({ last_connection: -1 })
      .lean()

    const stash = []

    // if only two duplicates (most of the cases) and at least one of them is inactive, remove UserRecruters & Recruiters documents
    if (duplicatesOfTheSameUser.length === 2) {
      const inactiveUser = duplicatesOfTheSameUser.filter((x) => x.status.pop().status !== etat_utilisateur.VALIDE)
      if (inactiveUser.length) {
        await removeUserAndCompany(inactiveUser)
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
            // remove CFA
            await UserRecruteur.findByIdAndDelete(user._id)
          }
        }
      })
    }
  })
}

runScript(async () => {
  const [establishments, cfas] = await Promise.all([UserRecruteur.find({ type: ENTREPRISE }).lean(), UserRecruteur.find({ type: CFA }).lean()])
  await cleanUsersOfTypeENTREPRIE(establishments)
  await cleanUsersOfTypeCFA(cfas)
  await lowercaseAllEmail()
})
