import passport from "passport"

type TStrategy = "api-key" | "basic" | "jwt-password" | "jwt-bearer" | "jwt-token" | "jwt-rdv-admin"

export default (strategyName: TStrategy) => passport.authenticate(strategyName, { session: false })
