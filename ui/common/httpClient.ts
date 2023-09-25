import EventEmitter from "events"

import { publicConfig } from "../config.public"

import { getAuth } from "./auth"

class AuthError extends Error {
  json: any
  statusCode: number | string
  prettyMessage: string
  constructor(json, statusCode) {
    super(`Request rejected with status code ${statusCode}`)
    this.json = json
    this.statusCode = statusCode
    this.prettyMessage = "Identifiant ou mot de passe invalide"
  }
}

class HTTPError extends Error {
  json: any
  statusCode: number | string
  prettyMessage: string
  constructor(message, json, statusCode) {
    super(message)
    this.json = json
    this.statusCode = statusCode
    this.prettyMessage = "Une erreur technique est survenue"
  }
}

const emitter = new EventEmitter()
const handleResponse = (path, response) => {
  const statusCode = response.status
  if (statusCode >= 400 && statusCode < 600) {
    emitter.emit("http:error", response)

    if (statusCode === 401 || statusCode === 403) {
      throw new AuthError(response.json(), statusCode)
    } else {
      throw new HTTPError(`Server returned ${statusCode} when requesting resource ${path}`, response.json(), statusCode)
    }
  }
  return response.json()
}

const getHeaders = () => {
  /**
   * auth comes from
   */
  const auth = getAuth()

  return {
    Accept: "application/json",
    ...(auth.sub !== "anonymous" ? { Authorization: `Bearer ${auth.token}` } : {}),
    "Content-Type": "application/json",
  }
}

export const _get = (path) => {
  const normalisedEndpoint = publicConfig.apiEndpoint.endsWith("/") ? publicConfig.apiEndpoint.slice(0, -1) : publicConfig.apiEndpoint
  return fetch(`${normalisedEndpoint}/${path}`, {
    method: "GET",
    headers: getHeaders(),
  }).then((res) => handleResponse(path, res))
}

export const _post = (path, body = {}) => {
  const normalisedEndpoint = publicConfig.apiEndpoint.endsWith("/") ? publicConfig.apiEndpoint.slice(0, -1) : publicConfig.apiEndpoint
  return fetch(`${normalisedEndpoint}/${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res))
}

export const _put = (path, body = {}) => {
  const normalisedEndpoint = publicConfig.apiEndpoint.endsWith("/") ? publicConfig.apiEndpoint.slice(0, -1) : publicConfig.apiEndpoint
  return fetch(`${normalisedEndpoint}/${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res))
}

export const _patch = (path, body = {}) => {
  const normalisedEndpoint = publicConfig.apiEndpoint.endsWith("/") ? publicConfig.apiEndpoint.slice(0, -1) : publicConfig.apiEndpoint
  return fetch(`${normalisedEndpoint}/${path}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res))
}

export const _delete = (path) => {
  const normalisedEndpoint = publicConfig.apiEndpoint.endsWith("/") ? publicConfig.apiEndpoint.slice(0, -1) : publicConfig.apiEndpoint
  return fetch(`${normalisedEndpoint}/${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then((res) => handleResponse(path, res))
}

export const buildLink = (path) => {
  // TODO_AB to check
  const auth = getAuth()
  if (auth.sub !== "anonymous") {
    //TODO better handle params
    return `${path}?token=${auth.token}`
  }
  return path
}

export const subscribeToHttpEvent = (eventName, callback) => emitter.on(eventName, callback)
