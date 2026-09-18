import { createReadStream } from "node:fs"
import { mkdtemp, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Readable } from "node:stream"
import Ftp from "basic-ftp"
import { Client as SFTPClient } from "ssh2"
import { logger } from "@/common/logger"
import { sentryCaptureException } from "./sentry-utils"

class FTPClient {
  client = new Ftp.Client()

  /**
   * @description Open an FTP connection
   * @param {object} options
   */
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

  /**
   * @description Disconnect an FTP connection
   */
  async disconnect() {
    logger.info(`Closing FTP....`)
    await this.client.close()
    logger.info(`Connection closed.`)
  }

  /**
   * @description Download a file from a remote FTP location
   * @param {string} remoteFile
   * @param {string} destinationPath
   */
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

/**
 * Télécharge un fichier distant et retourne un stream de lecture sur une copie locale.
 *
 * Le fichier temporaire est supprimé à la fermeture du stream. L'appelant DOIT donc soit le
 * consommer jusqu'au bout, soit le détruire — un `try/finally { stream.destroy() }` suffit :
 * sans cela le fichier reste sur disque (plusieurs dizaines de Mo par flux).
 */
export const downloadFileFromSFTP = async (remotePath: string, options: SFTPConnectOptions): Promise<Readable> => {
  // mkdtemp plutôt qu'un nom aléatoire dans /tmp : répertoire en 0700, non lisible par les autres
  // utilisateurs du conteneur.
  const localDir = await mkdtemp(join(tmpdir(), "sftp-"))
  const localPath = join(localDir, "download")
  const discard = () => rm(localDir, { recursive: true, force: true })

  try {
    await new Promise<void>((resolve, reject) => {
      const conn = new SFTPClient()

      conn.on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end()
            return reject(err)
          }

          sftp.fastGet(remotePath, localPath, FASTGET_OPTIONS, (err) => {
            conn.end()
            return err ? reject(err) : resolve()
          })
        })
      })

      conn.on("error", (err) => {
        conn.end()
        reject(err)
      })

      const { privateKey, ...rest } = options
      conn.connect({ port: 22, ...rest, ...(privateKey ? { privateKey: normalizeSshPrivateKey(privateKey) } : {}) })
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

  return stream
}
