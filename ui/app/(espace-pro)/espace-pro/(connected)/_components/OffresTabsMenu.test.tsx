import { renderToStaticMarkup } from "react-dom/server"
import { JOB_STATUS } from "shared"
import { describe, expect, it, vi } from "vitest"
import { OffresTabsMenu } from "./OffresTabsMenu"

const auth = vi.hoisted(() => ({ type: "ADMIN" }))
// renderToStaticMarkup échappe l'apostrophe.
const DELETE_LABEL = "Supprimer l&#x27;offre"
const EDIT_LABEL = "Éditer l&#x27;offre"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/context/UserContext", () => ({ useAuth: () => ({ user: { type: auth.type } }) }))
// Le menu ne s'ouvre qu'au clic : la doublure liste les actions qu'il proposerait.
vi.mock("@/app/(espace-pro)/_components/PopoverMenu", () => ({
  PopoverMenu: ({ actions }: { actions: ({ label: string } | null)[] }) => <ul>{actions.flatMap((action) => (action ? [<li key={action.label}>{action.label}</li>] : []))}</ul>,
}))

const render = ({ userType, awaitsModerationDecision }: { userType: string; awaitsModerationDecision: boolean }) => {
  auth.type = userType
  return renderToStaticMarkup(
    <OffresTabsMenu
      row={{ _id: "6ad734de852d3675eb942548", job_status: JOB_STATUS.ACTIVE, offer_title_custom: "Boulanger" }}
      openSuppression={vi.fn()}
      buildOfferEditionUrl={() => "/edition"}
      onOffreProlongationClick={vi.fn()}
      isModerable
      awaitsModerationDecision={awaitsModerationDecision}
    />
  )
}

const VIEW_ONLINE_LABEL = "Voir l&#x27;offre en ligne"
const VIEW_APPLICATIONS_LABEL = "Voir les candidatures"
const DAY = 24 * 3600 * 1000

const renderFilled = ({ userType, closedDaysAgo }: { userType: string; closedDaysAgo: number }) => {
  auth.type = userType
  return renderToStaticMarkup(
    <OffresTabsMenu
      row={{
        _id: "6ad734de852d3675eb942548",
        job_status: JOB_STATUS.POURVUE,
        offer_title_custom: "Boulanger",
        job_expiration_date: new Date(Date.now() + 30 * DAY).toISOString(),
        job_closure: { reason: "filled", date: new Date(Date.now() - closedDaysAgo * DAY).toISOString() },
      }}
      applicationsPath="/espace-pro/entreprise/offre/6ad734de852d3675eb942548/candidatures"
      openSuppression={vi.fn()}
      buildOfferEditionUrl={() => "/edition"}
      onOffreProlongationClick={vi.fn()}
    />
  )
}

describe("OffresTabsMenu, offre pourvue", () => {
  it.each(["ENTREPRISE", "CFA"])("propose seulement l'offre en ligne et les candidatures à un %s tant qu'elles sont consultables", (userType) => {
    const html = renderFilled({ userType, closedDaysAgo: 10 })

    expect(html).toContain(VIEW_ONLINE_LABEL)
    expect(html).toContain(VIEW_APPLICATIONS_LABEL)
    expect(html).not.toContain(EDIT_LABEL)
    expect(html).not.toContain(DELETE_LABEL)
  })

  it("n'affiche plus de menu une fois le délai de consultation passé", () => {
    expect(renderFilled({ userType: "ENTREPRISE", closedDaysAgo: 120 })).toBe("")
  })

  it("n'affiche pas de menu à un administrateur", () => {
    expect(renderFilled({ userType: "ADMIN", closedDaysAgo: 10 })).toBe("")
  })
})

describe("OffresTabsMenu, offre en ligne qui attend une décision de modération", () => {
  it.each(["ADMIN", "OPCO"])("ne propose pas la suppression à un %s", (userType) => {
    const html = render({ userType, awaitsModerationDecision: true })

    expect(html).not.toContain(DELETE_LABEL)
    expect(html).toContain(EDIT_LABEL)
  })

  it("propose la suppression à un administrateur sur une offre sans décision attendue", () => {
    expect(render({ userType: "ADMIN", awaitsModerationDecision: false })).toContain(DELETE_LABEL)
  })

  it("laisse le recruteur supprimer son offre qui attend une décision", () => {
    expect(render({ userType: "ENTREPRISE", awaitsModerationDecision: true })).toContain(DELETE_LABEL)
  })
})
