import { renderToStaticMarkup } from "react-dom/server"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { describe, expect, it, vi } from "vitest"
import { ModerationSearchMenu } from "./ModerationSearch"
import type { IModerationQueueItemJson } from "./moderation.types"

// Le menu ne s'ouvre qu'au clic : la doublure liste les actions qu'il proposerait.
vi.mock("@/app/(espace-pro)/_components/PopoverMenu", () => ({
  PopoverMenu: ({ actions }: { actions: ({ label: string } | null)[] }) => <ul>{actions.flatMap((action) => (action ? [<li key={action.label}>{action.label}</li>] : []))}</ul>,
}))

const row = (offer_status: JOB_STATUS_ENGLISH) =>
  ({
    _id: "6ad734de852d3675eb942548",
    offer_title: "Boulanger",
    offer_rome_appellation: "Boulanger / Boulangère",
    offer_status,
    workplace_siret: "11000001500013",
    recruiter: { user_id: "6ad734de852d3675eb942549", account_type: "ENTREPRISE", raison_sociale: "Boulangerie" },
  }) as IModerationQueueItemJson

const labels = (offer_status: JOB_STATUS_ENGLISH) =>
  [...renderToStaticMarkup(<ModerationSearchMenu row={row(offer_status)} />).matchAll(/<li>([^<]+)<\/li>/g)].map(([, label]) => label)

describe("ModerationSearchMenu, actions de la maquette selon le statut de l'offre (#5757)", () => {
  it.each([JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION])("propose la modération, l'édition et le compte pour une offre %s", (status) => {
    expect(labels(status)).toEqual(["Modérer l’offre", "Éditer l’offre", "Voir le compte recruteur"])
  })

  it("ajoute le lien vers l'offre en ligne pour une offre publiée", () => {
    expect(labels(JOB_STATUS_ENGLISH.ACTIVE)).toEqual(["Modérer l’offre", "Éditer l’offre", "Voir l’offre en ligne", "Voir le compte recruteur"])
  })

  it.each([JOB_STATUS_ENGLISH.ANNULEE, JOB_STATUS_ENGLISH.POURVUE])("ne laisse que la modération pour une offre close (%s)", (status) => {
    expect(labels(status)).toEqual(["Voir la modération"])
  })
})
