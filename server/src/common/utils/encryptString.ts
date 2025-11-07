import crypto from "crypto"

import config from "@/config"

const secretLba = Buffer.alloc(32, config.lbaSecret)

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
export const encryptMailWithIV = ({ value }): { email: string; iv?: string } => {
  const iv = crypto.randomBytes(16)

  if (value) {
    return {
      email: encrypt({ value, iv, secret: secretLba }),
      iv: iv.toString(outputEncoding),
    }
  } else return { email: "" }
}
