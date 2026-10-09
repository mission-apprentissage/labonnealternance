import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import type { ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { describe, expect, it } from "vitest"

import { JobPostingSchema } from "./JobPostingSchema"

function render(job: Record<string, unknown>, ideaType = LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
  const item = { ideaType, job } as unknown as ILbaItemPartnerJobJson
  return renderToStaticMarkup(createElement(JobPostingSchema, { title: "Boulanger", description: "Description", id: "id", job: item }))
}

const DANS_UN_AN = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

describe("JobPostingSchema", () => {
  it("émet le JobPosting d'une offre active non expirée", () => {
    expect(render({ status: "Active", jobExpirationDate: DANS_UN_AN })).toContain('<script type="application/ld+json"')
  })

  it("émet le JobPosting d'une offre LBA active", () => {
    expect(render({ status: "Active", jobExpirationDate: DANS_UN_AN }, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)).toContain('"@type":"JobPosting"')
  })

  it.each([["Pourvue"], ["Annulée"], ["En attente"]])("n'émet rien pour une offre %s dont l'expiration est future", (status) => {
    expect(render({ status, jobExpirationDate: DANS_UN_AN })).toBe("")
  })

  it("n'émet rien pour une offre active expirée", () => {
    expect(render({ status: "Active", jobExpirationDate: "2020-01-01T00:00:00.000Z" })).toBe("")
  })
})
