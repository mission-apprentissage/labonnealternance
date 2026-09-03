import { PassThrough, pipeline, type Readable } from "node:stream"
import { createGunzip } from "node:zlib"
import axios from "axios"
import type { CollectionName } from "shared/models/models"

import { logger } from "@/common/logger"
import { importFromStreamInXml } from "./import-from-stream-in-xml"

// un membre gzip commence toujours par 1f 8b (RFC 1952), du xml par '<'
const GZIP_MAGIC = Buffer.from([0x1f, 0x8b])

/**
 * Consomme les premiers octets du flux, sans les remettre en place.
 *
 * `read(size)` rend null tant que le buffer interne est plus court que `size` : il faut
 * accumuler sur plusieurs `readable` plutôt que décider sur un chunk d'un octet. Le flux
 * peut aussi finir avant d'atteindre `size`, auquel cas on rend ce qu'on a.
 */
const readFirstBytes = (stream: Readable, size: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let length = 0
    const cleanup = () => {
      stream.removeListener("readable", onReadable)
      stream.removeListener("end", onEnd)
      stream.removeListener("error", onError)
    }
    const finish = () => {
      cleanup()
      resolve(Buffer.concat(chunks))
    }
    const onReadable = () => {
      while (length < size) {
        const chunk = stream.read()
        if (chunk === null) return // buffer épuisé : on attend le prochain readable, ou end
        // on compte les octets du buffer et non la longueur du chunk, qui serait un nombre
        // de caractères si la source était en mode string
        const buffer = Buffer.from(chunk)
        chunks.push(buffer)
        length += buffer.length
      }
      finish()
    }
    const onEnd = () => finish()
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    stream.on("readable", onReadable)
    stream.once("end", onEnd)
    stream.once("error", onError)
  })

/**
 * Décompresse le flux s'il s'agit d'un fichier gzip, quels que soient les headers.
 *
 * On décide sur le contenu et non sur les headers : axios décompresse lui-même un
 * `content-encoding` connu *et supprime le header* avant de le remonter, donc un test sur
 * `content-encoding` ne voit jamais rien et un partenaire qui sert un `.gz` en ajoutant ce
 * header ferait décompresser deux fois. Symétriquement, un `.gz` servi en
 * `application/octet-stream` échapperait à un test sur `content-type`.
 *
 * Ne peut pas être appelée deux fois sur le même flux : les octets lus ne sont pas remis
 * dans la source, ils sont réécrits dans le flux rendu. `isGzip` est renvoyé pour
 * l'observabilité plutôt que re-testé par l'appelant.
 */
export const gunzipIfNeeded = async (stream: Readable): Promise<{ stream: Readable; isGzip: boolean }> => {
  const output = new PassThrough()
  // posé avant la lecture et jamais retiré : une erreur survenant entre la fin de la lecture
  // et le branchement de l'aval doit ressortir sur le flux rendu, pas en exception non capturée
  stream.on("error", (err) => output.destroy(err))
  output.on("error", () => {
    // rien à faire ici : ce listener évite juste une exception non capturée si l'erreur
    // survient avant que l'aval ne consomme, l'erreur reste portée par le flux
  })

  const head = await readFirstBytes(stream, GZIP_MAGIC.length)
  const isGzip = head.subarray(0, GZIP_MAGIC.length).equals(GZIP_MAGIC)

  // pipeline() et non pipe() : il propage les erreurs vers l'aval *et* la destruction vers
  // l'amont. L'appelant fait son propre pipeline(stream, ...) sur le flux rendu ; sans ça un
  // parsing en échec ne fermerait plus la socket http, qui resterait ouverte jusqu'au timeout
  const onPipelineDone = (err: Error | null) => {
    if (err) output.destroy(err)
  }

  // la source peut avoir échoué juste après la lecture des premiers octets : output porte déjà
  // l'erreur, et pipeline() lèverait un « Cannot pipe to a closed or destroyed stream » qui
  // masquerait la cause réelle
  if (output.destroyed) {
    return { stream: output, isGzip }
  }

  if (!isGzip) {
    // les octets lus sont réinjectés avant le reste du flux
    if (head.length) output.write(head)
    pipeline(stream, output, onPipelineDone)
    return { stream: output, isGzip }
  }

  const gunzip = createGunzip()
  gunzip.write(head)
  pipeline(stream, gunzip, output, onPipelineDone)
  return { stream: output, isGzip }
}

export const importFromUrlInXml = async ({
  url,
  destinationCollection,
  offerXmlTag,
  partnerLabel,
  conflictingOpeningTagWithoutAttributes = false, // ex : si la source est <xml><jobs><job>...</job>...</jobs><xml> et que le tag est job il faut mettre true
}: {
  url: string
  destinationCollection: CollectionName
  offerXmlTag: string
  partnerLabel: string
  conflictingOpeningTagWithoutAttributes?: boolean
}) => {
  const response = await axios.get(url, {
    responseType: "stream",
  })
  const { stream, isGzip } = await gunzipIfNeeded(response.data)
  logger.info({ partnerLabel, contentType: response.headers["content-type"], isGzip }, "flux téléchargé")

  return importFromStreamInXml({ destinationCollection, offerXmlTag, stream, importName: partnerLabel, conflictingOpeningTagWithoutAttributes })
}
