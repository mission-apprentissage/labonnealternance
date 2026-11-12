import { createReadStream } from "node:fs"
import { mkdtemp, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Readable } from "node:stream"
import Ftp from "basic-ftp"
import type { SFTPWrapper } from "ssh2"
import { Client as SFTPClient } from "ssh2"
import { logger } from "@/common/logger"
import { sentryCaptureException } from "./sentry-utils"

class FTPClient {
  client = new Ftp.Client()

  async connect(options) {
    logger.info(`Connecting to FTP....`)

    try {
      await this.client.access(options)
    } catch (error) {
      sentryCaptureException(error)
      logger.error(error, "FTP connection failed")
    }
  }

  async list() {
    console.info(await this.client.list())
  }

  async disconnect() {
    logger.info(`Closing FTP....`)
    await this.client.close()
    logger.info(`Connection closed.`)
  }

  async downloadFile(remoteFile, destinationPath) {
    try {
      this.client.trackProgress((info) => logger.info(`${(info.bytes / 1000000).toFixed(2)} MB`))
      await this.client.downloadTo(destinationPath, remoteFile)
      this.client.trackProgress()
      logger.info(`File successfully downloaded.`)
    } catch (error) {
      sentryCaptureException(error)
      logger.error(error, "Download failed:")
    }
  }
}

export { FTPClient }

type SFTPConnectOptions = {
  host: string
  port?: number
  username: string
  // Authentification par mot de passe (APEC) ou par clé privée (LinkedIn) : au moins l'une des deux.
  password?: string
  privateKey?: string
  // Requis uniquement si la clé privée est chiffrée.
  passphrase?: string
}

// Les clés privées stockées au vault sont sur une seule ligne (le template .env ne supporte pas
// le multi-ligne) : on restaure les retours à la ligne avant de les passer à ssh2.
export const normalizeSshPrivateKey = (privateKey: string): string => {
  const normalized = privateKey.replace(/\\n/g, "\n")
  return normalized.endsWith("\n") ? normalized : `${normalized}\n`
}

// Téléchargement parallélisé : `fastGet` maintient 64 requêtes SFTP en vol là où
// `createReadStream` en fait une à la fois. Sur le flux LinkedIn (46 Mo, serveur hors
// Europe), mesuré à 8,9 s contre 256 s — le RTT domine sur un transfert séquentiel.
// Le fichier transite par un temporaire, ce qui libère la connexion SSH avant le parsing.
const FASTGET_OPTIONS = { concurrency: 64, chunkSize: 32768 }

// ssh2 abandonne le handshake après 20 s par défaut. Le serveur LinkedIn, hors Europe, a dépassé
// cette borne en preview le 21/09/2026 (erreur à 20,4 s, run suivant OK) : la limite est portée à
// 60 s, et un second essai couvre le cas d'un serveur indisponible quelques secondes.
const SFTP_READY_TIMEOUT_MS = 60_000
const SFTP_CONNECT_ATTEMPTS = 2

const isHandshakeTimeout = (err: unknown): boolean => (err as { level?: string } | null)?.level === "client-timeout"

export type SFTPFileStats = { mtime: Date | null; size: number | null }

const runSftpSession = <T>(options: SFTPConnectOptions, task: (sftp: SFTPWrapper) => Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const conn = new SFTPClient()

    conn.on("ready", () => {
      conn.sftp((err, sftp) => {
        if (err) {
          conn.end()
          return reject(err)
        }

        task(sftp).then(
          (value) => {
            conn.end()
            resolve(value)
          },
          (taskError) => {
            conn.end()
            reject(taskError)
          }
        )
      })
    })

    conn.on("error", (err) => {
      conn.end()
      reject(err)
    })

    const { privateKey, ...rest } = options
    conn.connect({
      port: 22,
      readyTimeout: SFTP_READY_TIMEOUT_MS,
      ...rest,
      ...(privateKey ? { privateKey: normalizeSshPrivateKey(privateKey) } : {}),
    })
  })

const runSftpSessionWithRetry = async <T>(options: SFTPConnectOptions, task: (sftp: SFTPWrapper) => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await runSftpSession(options, task)
    } catch (err) {
      if (!isHandshakeTimeout(err) || attempt >= SFTP_CONNECT_ATTEMPTS) {
        throw err
      }
      logger.warn({ err, host: options.host, attempt }, "SFTP: handshake expiré, nouvelle tentative")
    }
  }
}

const statRemoteFile = (sftp: SFTPWrapper, remotePath: string): Promise<SFTPFileStats> =>
  new Promise((resolve, reject) => {
    sftp.stat(remotePath, (err, stats) => (err ? reject(err) : resolve({ mtime: new Date(stats.mtime * 1000), size: stats.size })))
  })

const fastGetRemoteFile = (sftp: SFTPWrapper, remotePath: string, localPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    sftp.fastGet(remotePath, localPath, FASTGET_OPTIONS, (err) => (err ? reject(err) : resolve()))
  })

const assertCredentials = (options: SFTPConnectOptions) => {
  // Sans identifiant, ssh2 tente l'auth « none » et échoue avec « All configured authentication
  // methods failed », qui ne dit pas que c'est la configuration qui manque.
  if (!options.password && !options.privateKey) {
    throw new Error(`SFTP: aucun identifiant fourni pour ${options.username}@${options.host} (password ou privateKey requis)`)
  }
}

/** Date de modification et taille du fichier distant, sans le télécharger. */
export const statFileOnSFTP = async (remotePath: string, options: SFTPConnectOptions): Promise<SFTPFileStats> => {
  assertCredentials(options)
  return runSftpSessionWithRetry(options, (sftp) => statRemoteFile(sftp, remotePath))
}

/**
 * Télécharge un fichier distant et retourne un stream de lecture sur une copie locale, avec la date
 * de modification et la taille lues dans la même session.
 *
 * Le fichier temporaire est supprimé à la fermeture du stream. L'appelant DOIT donc soit le
 * consommer jusqu'au bout, soit le détruire — un `try/finally { stream.destroy() }` suffit :
 * sans cela le fichier reste sur disque (plusieurs dizaines de Mo par flux).
 */
export const downloadFileFromSFTP = async (remotePath: string, options: SFTPConnectOptions): Promise<{ stream: Readable; stats: SFTPFileStats }> => {
  assertCredentials(options)

  // mkdtemp plutôt qu'un nom aléatoire dans /tmp : répertoire en 0700, non lisible par les autres
  // utilisateurs du conteneur.
  const localDir = await mkdtemp(join(tmpdir(), "sftp-"))
  const localPath = join(localDir, "download")
  const discard = () => rm(localDir, { recursive: true, force: true })

  let stats: SFTPFileStats
  try {
    stats = await runSftpSessionWithRetry(options, async (sftp) => {
      // les stats ne servent qu'au signal de changement (#5669) : leur échec ne doit pas bloquer l'import
      const remoteStats = await statRemoteFile(sftp, remotePath).catch((err): SFTPFileStats => {
        logger.warn({ err, host: options.host, remotePath }, "SFTP: stat du fichier distant impossible, téléchargement sans date ni taille")
        return { mtime: null, size: null }
      })
      await fastGetRemoteFile(sftp, remotePath, localPath)
      return remoteStats
    })

    // `fastGet` appelle son callback sans erreur quand le fichier distant est vide (cf. `fastXfer`
    // dans ssh2 : `if (fsize <= 0) return onerror()`, sans argument). Sans ce contrôle, un flux
    // tronqué côté partenaire remonterait comme un simple « aucune offre importée », sans la cause.
    const { size } = await stat(localPath)
    if (size === 0) {
      throw new Error(`SFTP: le fichier distant ${remotePath} est vide`)
    }
  } catch (err) {
    // ssh2 ne supprime pas la destination quand le transfert échoue en cours de route : sans ça,
    // chaque échec laisse un fichier partiel de plusieurs dizaines de Mo.
    await discard()
    throw err
  }

  let cleaned = false
  const cleanup = () => {
    // `close` est émis après `error` sur un stream fs : sans garde, le second appel échouerait.
    if (cleaned) {
      return
    }
    cleaned = true
    discard().catch((err) => logger.warn({ err, localDir }, "SFTP: suppression du fichier temporaire impossible"))
  }

  const stream = createReadStream(localPath)
  stream.on("close", cleanup)
  stream.on("error", cleanup)

  return { stream, stats }
}
