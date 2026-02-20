import { Readable } from "stream"
import { describe, expect, it, vi } from "vitest"

import { getFileFromApecFTP } from "./apec.client"

vi.mock("@/common/utils/ftpUtils")
vi.mock("@/common/logger")

describe("getFileFromApecFTP", () => {
  it("should return a readable stream from SFTP", async () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?><offres><offre><id>1</id></offre></offres>`

    const { downloadFileFromSFTP } = await import("@/common/utils/ftpUtils")
    vi.mocked(downloadFileFromSFTP).mockResolvedValue(Readable.from(xmlContent))

    const stream = await getFileFromApecFTP()

    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    expect(Buffer.concat(chunks).toString()).toBe(xmlContent)
  })
})
