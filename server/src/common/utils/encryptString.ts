import crypto from "crypto"

import config from "../../config"

const secretLba = Buffer.alloc(32, config.secretUpdateRomesMetiers)
const secret1j1s = Buffer.alloc(32, config.secret1j1s)

const algo = "aes-256-ctr"
const inputEncoding = "utf8"
const outputEncoding = "hex"

const encrypt = ({ value, iv, secret }) => {
  const cipher = crypto.createCipheriv(algo, secret, iv)
  let crypted = cipher.update(value, inputEncoding, outputEncoding)
  crypted += cipher.final(outputEncoding)
  return crypted.toString()
}

// caller est un paramètre optionnel passé aux appels apis pour identifier la source
const encryptMailWithIV = ({ value, caller }) => {
  const iv = crypto.randomBytes(16)

  const secret = caller === "1jeune1solution" ? secret1j1s : secretLba

  if (value) {
    return {
      email: encrypt({ value, iv, secret }),
      iv: iv.toString(outputEncoding),
    }
  } else return { email: "" }
}

const encryptIdWithIV = (id) => {
  const iv = crypto.randomBytes(16)

  if (id) {
    return {
      id: encrypt({ value: id, iv, secret: secretLba }),
      iv: iv.toString(outputEncoding),
    }
  } else return { id: "" }
}

const decrypt = ({ value, iv, secret }) => {
  const decipher = crypto.createDecipheriv(algo, secret, iv)
  let decrypted = decipher.update(value, outputEncoding, inputEncoding)
  decrypted += decipher.final(inputEncoding)

  const decryptedString = decrypted.toString()

  return decryptedString
}

const decryptWithIV = (value, ivHex) => {
  const iv = Buffer.from(ivHex, "hex")
  return decrypt({ value, iv, secret: secretLba })
}

export { encrypt, encryptMailWithIV, encryptIdWithIV, decrypt, decryptWithIV }
