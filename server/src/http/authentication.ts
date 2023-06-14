import * as express from "express"
import { Credential } from "../common/model/index.js"
import { ICredential } from "../common/model/schema/credentials/credential.types.js"

/**
 * @description This function is the authentication middleware. tsoa needs all parameters, even if not used.
 * @param {Request} request
 * @param {String} securityName
 * @param {Array} scope
 * @returns {Promise<ICredential>}
 */
export const expressAuthentication = async (request: express.Request, securityName?: string, scope?: string[]): Promise<any> => {
  let token
  if (request.headers && request.headers.authorization) {
    token = request.headers.authorization
  }

  if (!token) {
    return Promise.reject(new Error("Unauthorized"))
  }

  // Check if api user exists
  const user = await Credential.findOne({ api_key: token }).lean()

  if (!user) {
    return Promise.reject(new Error("Unauthorized"))
  }

  return Promise.resolve(user)
}
