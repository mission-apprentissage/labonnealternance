import EventEmitter from 'events'
import { getAuth } from './auth'

class AuthError extends Error {
  constructor(json, statusCode) {
    super(`Request rejected with status code ${statusCode}`)
    this.json = json
    this.statusCode = statusCode
    this.prettyMessage = 'Identifiant ou mot de passe invalide'
  }
}

class HTTPError extends Error {
  constructor(message, json, statusCode) {
    super(message)
    this.json = json
    this.statusCode = statusCode
    this.prettyMessage = 'Une erreur technique est survenue'
  }
}

const emitter = new EventEmitter()
const handleResponse = (path, response) => {
  let statusCode = response.status
  if (statusCode >= 400 && statusCode < 600) {
    emitter.emit('http:error', response)

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
  let auth = getAuth()

  return {
    Accept: 'application/json',
    ...(auth.sub !== 'anonymous' ? { Authorization: `Bearer ${auth.token}` } : {}),
    'Content-Type': 'application/json',
  }
}

export const _get = (path) => {
  return fetch(`${path}`, {
    method: 'GET',
    headers: getHeaders(),
  }).then((res) => handleResponse(path, res))
}

export const _post = (path, body) => {
  return fetch(`${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res))
}

export const _put = (path, body = {}) => {
  return fetch(`${path}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res))
}

export const _patch = (path, body = {}) => {
  return fetch(`${path}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res))
}

export const _delete = (path) => {
  return fetch(`${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then((res) => handleResponse(path, res))
}

export const buildLink = (path) => {
  let auth = getAuth()
  if (auth.sub !== 'anonymous') {
    //TODO better handle params
    return `${path}?token=${auth.token}`
  }
  return path
}

export const subscribeToHttpEvent = (eventName, callback) => emitter.on(eventName, callback)
