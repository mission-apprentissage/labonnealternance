import * as sha512Utils from "../../common/utils/sha512Utils.js"
import { User } from "../model/index.js"

/**
 * KBA 3/11 : To be refactored and merged with userRecuteur.js
 */

/**
 * @description Hash password
 * @param {User} user
 * @param {String} password
 * @returns {Promise<User>}
 */
const rehashPassword = (user, password) => {
  user.password = sha512Utils.hash(password)

  return user.save()
}

export default () => ({
  /**
   * @description Authenticates user from its username and password.
   * @param {String} username
   * @param {String} password
   * @returns {Promise<null|User>}
   */
  authenticate: async (username, password) => {
    const user = await User.findOne({ username })
    if (!user) {
      return null
    }

    const current = user.password
    if (sha512Utils.compare(password, current)) {
      if (sha512Utils.isTooWeak(current)) {
        await rehashPassword(user, password)
      }

      return user.toObject()
    }

    return null
  },

  /**
   * @description Returns user from its username.
   * @param username
   * @returns {Promise<*>}
   */
  getUser: async (username) => User.findOne({ username }),

  /**
   * @description Returns user from its identifier.
   * @param {String} userId
   * @returns {Promise<User>}
   */
  getUserById: async (userId) => User.findById(userId),

  /**
   * @description Updates item.
   * @param {String} id - ObjectId
   * @param {User} params
   * @returns {Promise<User>}
   */
  update: async (id, params) => User.findOneAndUpdate({ _id: id }, params, { new: true }),

  /**
   * @description Creates an user.
   * @param {String} username
   * @param {String} password
   * @param {User} options
   * @returns {Promise<User>}
   */
  createUser: async (username, password, options = {}) => {
    const hash = options.hash || sha512Utils.hash(password)
    const { firstname, lastname, phone, email, role } = options

    const user = new User({
      username,
      password: hash,
      firstname,
      lastname,
      phone,
      email,
      role,
    })

    await user.save()

    return user.toObject()
  },

  /**
   * @description Returns items.
   * @param {Object} conditions
   * @returns {Promise<User[]>}
   */
  find: (conditions) => User.find(conditions),

  /**
   * @description Returns one item.
   * @param {Object} conditions
   * @returns {Promise<User>}
   */
  findOne: async (conditions) => User.findOne(conditions),

  /**
   * @description Removes an user from its username.
   * @param username
   * @returns {Promise<User>}
   */
  removeUser: async (username) => {
    const user = await User.findOne({ username })
    if (!user) {
      throw new Error(`Unable to find user ${username}`)
    }

    return user.deleteOne({ username })
  },

  /**
   * @description Updates user's password.
   * @param {String} username
   * @param {String} newPassword
   * @returns {Promise<User>}
   */
  changePassword: async (username, newPassword) => {
    const user = await User.findOne({ username })
    if (!user) {
      throw new Error(`Unable to find user ${username}`)
    }

    user.password = sha512Utils.hash(newPassword)
    await user.save()

    return user.toObject()
  },
})
