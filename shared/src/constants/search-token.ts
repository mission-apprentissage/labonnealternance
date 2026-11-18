// Jeton de recherche du site : émis par l'UI après une preuve de travail (/bff/jeton), vérifié par l'API
// sur /v1/search et /v1/search/suggest. Constantes lisibles côté navigateur ; la cryptographie est dans
// shared/utils/search-token (node:crypto).

export const SEARCH_TOKEN_COOKIE_NAME = "lba_st"
export const SEARCH_TOKEN_HEADER = "x-lba-search-token"
export const SEARCH_CHANNEL_HEADER = "x-lba-channel"

// Le jeton reste valable sur sa tranche horaire et la suivante : entre 1 et 2 h selon l'heure d'émission.
export const SEARCH_TOKEN_SLOT_SECONDS = 3600
export const SEARCH_TOKEN_COOKIE_MAX_AGE = 2 * SEARCH_TOKEN_SLOT_SECONDS

// Recherches (pages comprises) servies par jeton ; au-delà le client refait une preuve de travail.
export const SEARCH_TOKEN_QUOTA = 100

export const SEARCH_CHANNELS = ["site", "widget"] as const
export type ISearchSiteChannel = (typeof SEARCH_CHANNELS)[number]

// Messages des 401 de l'API : le client UI relance une preuve de travail sur l'un ou l'autre.
export const SEARCH_TOKEN_REQUIRED = "JETON_REQUIS"
export const SEARCH_TOKEN_EXHAUSTED = "JETON_EPUISE"
