import { isbot } from "isbot"

// Les robots qui exécutent le JavaScript des fiches (Googlebot…) appellent les routes de stats comme un navigateur (#5801).
// Un navigateur envoie toujours un user-agent, que fetch ne peut pas retirer : son absence désigne un script.
export const isBotUserAgent = (userAgent: string | undefined): boolean => !userAgent || isbot(userAgent)
