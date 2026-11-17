import { createTable, getCoreRowModel, getSortedRowModel, type SortingState } from "@tanstack/react-table"
import type { IUserRecruteurJson } from "shared"
import { ACCOUNT_OFFER_CONFORMITIES } from "shared/models/jobs-partners-moderation.model"
import { describe, expect, it, vi } from "vitest"
import { getRecruteursColumns } from "./recruteursColumns"

const disclosure = { isOpen: false, onOpen: vi.fn(), onClose: vi.fn(), onToggle: vi.fn() }

describe("getRecruteursColumns, colonne « Conformité de l’offre » (#5757)", () => {
  it("met au premier clic les comptes les plus défavorables en tête", () => {
    const columns = getRecruteursColumns({ setCurrentEntreprise: vi.fn(), confirmationActivationUtilisateur: disclosure, confirmationDesactivationUtilisateur: disclosure })
    const data = ["conforme", "aucune_offre", "non_applicable", "a_verifier", "non_conforme", "indisponible"].map(
      (offer_conformity) => ({ offer_conformity }) as unknown as IUserRecruteurJson
    )
    let sorting: SortingState = []
    const table = createTable<IUserRecruteurJson>({
      data,
      columns,
      state: { sorting },
      onStateChange: vi.fn(),
      renderFallbackValue: null,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    })
    const column = table.getColumn("offer_conformity")
    sorting = [{ id: "offer_conformity", desc: column?.getFirstSortDir() === "desc" }]
    table.setOptions((options) => ({ ...options, state: { ...options.state, sorting } }))

    expect(table.getRowModel().rows.map(({ original }) => (original as unknown as { offer_conformity: string }).offer_conformity)).toEqual([...ACCOUNT_OFFER_CONFORMITIES])
  })
})
