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
