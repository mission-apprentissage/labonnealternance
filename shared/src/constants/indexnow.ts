/**
 * Clé IndexNow (https://www.indexnow.org/documentation) : prouve aux moteurs que nous possédons
 * le domaine. Elle est PUBLIQUE par design — le protocole exige qu'elle soit servie en clair à
 * `https://<host>/<clé>.txt` (cf. le fichier `ui/public/<clé>.txt`, qui doit rester identique).
 * La committer ne pose donc aucun problème de sécurité ; en cas de rotation, changer la constante
 * ET renommer le fichier public.
 */
export const INDEXNOW_KEY = "01232c8a2a1225367cfe22fe770c6385"
