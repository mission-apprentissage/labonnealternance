import { isString } from "lodash"

function hasOnlyDigits(value) {
  return /^-?\d+$/.test(value)
}

export default function hasAlreadySubmittedCandidature({ applied = null, isOpen = false } = {}) {
  let actuallyApplied = isString(applied) && hasOnlyDigits(applied)

  return actuallyApplied && !isOpen
}
