import type { Readable } from "node:stream"
import axios, { type AxiosResponseHeaders, type RawAxiosResponseHeaders } from "axios"

import type { SFTPFileStats } from "@/common/utils/ftp-utils"
import type { FluxSource, FluxValidators } from "./import-flux-if-changed"

// le flux Hellowork répond 406 « This feed is gzip-compressed » sans cet en-tête. axios l'envoie
// déjà par défaut et décompresse lui-même la réponse, mais un import critique ne doit pas reposer
// sur un défaut de librairie
const HTTP_FLUX_HEADERS = { "Accept-Encoding": "gzip, deflate, br" }

const readHeader = (headers: RawAxiosResponseHeaders | AxiosResponseHeaders, name: string): string | null => {
  const value = headers[name]
  return typeof value === "string" && value !== "" ? value : null
}

const readHttpValidators = (headers: RawAxiosResponseHeaders | AxiosResponseHeaders): FluxValidators => {
  const lastModified = readHeader(headers, "last-modified")
  const lastModifiedTime = lastModified === null ? Number.NaN : Date.parse(lastModified)
  const contentLength = Number(readHeader(headers, "content-length") ?? Number.NaN)
  return {
    etag: readHeader(headers, "etag"),
    last_modified: Number.isNaN(lastModifiedTime) ? null : new Date(lastModifiedTime),
    content_length: Number.isFinite(contentLength) ? contentLength : null,
  }
}

// Un HEAD sans réponse bloquerait le worker qui porte aussi les crons fréquents ; l'erreur de délai
// retombe sur le téléchargement (cf. hasUnchangedValidators). Le GET n'a pas de délai global, qui
// couperait un téléchargement long mais légitime.
export const HTTP_PROBE_TIMEOUT_MS = 30_000

export const httpFluxSource = (url: string, { probeTimeoutMs = HTTP_PROBE_TIMEOUT_MS }: { probeTimeoutMs?: number } = {}): FluxSource => ({
  probe: async () => readHttpValidators((await axios.head(url, { headers: HTTP_FLUX_HEADERS, timeout: probeTimeoutMs })).headers),
  download: async () => {
    const response = await axios.get<Readable>(url, { responseType: "stream", headers: HTTP_FLUX_HEADERS })
    return { stream: response.data, validators: readHttpValidators(response.headers) }
  },
})

const sftpStatsToValidators = ({ mtime, size }: SFTPFileStats): FluxValidators => ({ etag: null, last_modified: mtime, content_length: size })

export const sftpFluxSource = ({ stat, download }: { stat: () => Promise<SFTPFileStats>; download: () => Promise<{ stream: Readable; stats: SFTPFileStats }> }): FluxSource => ({
  probe: async () => sftpStatsToValidators(await stat()),
  download: async () => {
    const { stream, stats } = await download()
    return { stream, validators: sftpStatsToValidators(stats) }
  },
})
