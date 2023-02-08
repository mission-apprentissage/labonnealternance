import crypto from "crypto"
import config from "../../config.js"
import { sha512crypt } from "sha512crypt-node"

const hash = (password, rounds = config.auth.passwordHashRounds) => {
  const salt = crypto.randomBytes(16).toString("hex")
  return sha512crypt(password, `$6$rounds=${rounds}$${salt}`)
}

const compare = (password, hash) => {
  const array = hash.split("$")
  array.pop()

  return sha512crypt(password, array.join("$")) === hash
}

const isTooWeak = (hash) => {
  const array = hash.split("$")
  const round = array[2].split("=")[1]
  return round < config.auth.passwordHashRounds
}

export { hash, compare, isTooWeak }
