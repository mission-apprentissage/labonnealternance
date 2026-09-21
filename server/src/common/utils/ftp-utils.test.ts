import { text } from "node:stream/consumers"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { downloadFileFromSFTP, normalizeSshPrivateKey } from "./ftp-utils"

type ConnectOutcome = "handshake-timeout" | "auth-failure" | "ok"

// Scénario consommé par chaque `connect()` successif ; vide = succès.
const { connectOutcomes, connectCalls } = vi.hoisted(() => ({
  connectOutcomes: [] as ConnectOutcome[],
  connectCalls: [] as Array<Record<string, unknown>>,
}))

vi.mock("ssh2", async () => {
  const { EventEmitter } = await import("node:events")
  const { writeFile } = await import("node:fs/promises")

  class Client extends EventEmitter {
    connect(cfg: Record<string, unknown>) {
      connectCalls.push(cfg)
      const outcome = connectOutcomes.shift() ?? "ok"
      setImmediate(() => {
        if (outcome === "handshake-timeout") {
          this.emit("error", Object.assign(new Error("Timed out while waiting for handshake"), { level: "client-timeout" }))
        } else if (outcome === "auth-failure") {
          this.emit("error", Object.assign(new Error("All configured authentication methods failed"), { level: "client-authentication" }))
        } else {
          this.emit("ready")
        }
      })
    }

    sftp(cb: (err: undefined, sftp: unknown) => void) {
      cb(undefined, {
        fastGet: (_remote: string, local: string, _opts: unknown, done: (err?: Error) => void) => {
          writeFile(local, "<feed/>").then(() => done(), done)
        },
      })
    }

    end() {
      // Rien à fermer : aucune socket n'est ouverte par ce mock.
    }
  }
  return { Client }
})

// Contenu volontairement non réaliste : la fonction ne fait que normaliser des retours à la ligne,
// elle ne lit pas le format. Un en-tête PEM ou un corps en base64 ferait échouer gitleaks.
const KEY = ["--- debut ---", "ligne du milieu", "--- fin ---"].join("\n")

describe("normalizeSshPrivateKey", () => {
  it("restaure les retours à la ligne des clés stockées sur une seule ligne au vault", () => {
    const stored = KEY.replaceAll("\n", "\\n")

    expect(normalizeSshPrivateKey(stored)).toBe(`${KEY}\n`)
  })

  it("laisse intacte une clé déjà multi-ligne", () => {
    expect(normalizeSshPrivateKey(`${KEY}\n`)).toBe(`${KEY}\n`)
  })

  it("ajoute la newline finale que ssh2 exige", () => {
    // Sans elle, ssh2 rejette la clé avec "Cannot parse privateKey: Unsupported key format".
    expect(normalizeSshPrivateKey(KEY)).toBe(`${KEY}\n`)
    expect(normalizeSshPrivateKey(KEY).endsWith("\n")).toBe(true)
  })
})

describe("downloadFileFromSFTP", () => {
  it("refuse un appel sans password ni privateKey avant toute connexion", async () => {
    // L'hôte est un TLD réservé (RFC 2606) : si le guard ne s'exécutait pas, l'erreur serait
    // une résolution DNS ou « All configured authentication methods failed », pas ce message.
    await expect(downloadFileFromSFTP("/feed.xml", { host: "sftp.invalid", username: "lba" })).rejects.toThrow(
      "SFTP: aucun identifiant fourni pour lba@sftp.invalid (password ou privateKey requis)"
    )
  })
})

describe("downloadFileFromSFTP (connexion)", () => {
  const options = { host: "sftp.invalid", username: "lba", password: "secret" }

  beforeEach(() => {
    connectOutcomes.length = 0
    connectCalls.length = 0
  })

  it("porte le timeout de handshake ssh2 à 60 s", async () => {
    const stream = await downloadFileFromSFTP("/feed.xml", options)
    await text(stream)

    expect(connectCalls).toHaveLength(1)
    expect(connectCalls[0]).toMatchObject({ readyTimeout: 60_000, port: 22 })
  })

  it("retente une fois après un timeout de handshake", async () => {
    connectOutcomes.push("handshake-timeout", "ok")

    const stream = await downloadFileFromSFTP("/feed.xml", options)

    await expect(text(stream)).resolves.toBe("<feed/>")
    expect(connectCalls).toHaveLength(2)
  })

  it("abandonne après deux timeouts de handshake", async () => {
    connectOutcomes.push("handshake-timeout", "handshake-timeout")

    await expect(downloadFileFromSFTP("/feed.xml", options)).rejects.toThrow("Timed out while waiting for handshake")
    expect(connectCalls).toHaveLength(2)
  })

  it("ne retente pas sur une erreur autre que le timeout de handshake", async () => {
    connectOutcomes.push("auth-failure")

    await expect(downloadFileFromSFTP("/feed.xml", options)).rejects.toThrow("All configured authentication methods failed")
    expect(connectCalls).toHaveLength(1)
  })
})
