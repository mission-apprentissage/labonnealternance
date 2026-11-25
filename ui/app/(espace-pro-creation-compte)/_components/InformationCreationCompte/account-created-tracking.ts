export type AccountCreatedTracking = {
  account_type: "entreprise" | "cfa"
  account_validated: "true" | "false"
}

export function getAccountCreatedTracking(type: "CFA" | "ENTREPRISE", validated: boolean): AccountCreatedTracking {
  return {
    account_type: type === "CFA" ? "cfa" : "entreprise",
    account_validated: validated ? "true" : "false",
  }
}
