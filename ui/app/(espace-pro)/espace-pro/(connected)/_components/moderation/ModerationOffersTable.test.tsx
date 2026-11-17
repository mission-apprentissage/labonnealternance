import { createTable, getCoreRowModel, type SortingState } from "@tanstack/react-table"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { describe, expect, it } from "vitest"
import { SERVER_SORTING_OPTIONS } from "@/app/(espace-pro)/_components/VirtualTable"
import { getModerationColumns, MODERATION_DEFAULT_SORTING, toModerationSort } from "./ModerationOffersTable"
import type { IModerationQueueItemJson } from "./moderation.types"

// Dates en chaîne, comme dans la réponse JSON : tanstack trie d'abord en ordre croissant une colonne de chaînes.
const rows = [
  { _id: "1", offer_title: "Graveur", offer_status: JOB_STATUS_ENGLISH.ACTIVE, created_at: "2023-11-02T10:00:00.000Z", recruiter: { raison_sociale: "Gravure" } },
  { _id: "2", offer_title: "Boulanger", offer_status: JOB_STATUS_ENGLISH.EN_MODERATION, created_at: "2026-11-02T10:00:00.000Z", recruiter: { raison_sociale: "Boulangerie" } },
] as IModerationQueueItemJson[]

/** Clics sur les en-têtes, avec l'état contrôlé de VirtualTable : chaque clic rend le tri demandé au serveur. */
const clickHeaders = (ids: string[]) => {
  let sorting: SortingState = MODERATION_DEFAULT_SORTING
  const table = createTable<IModerationQueueItemJson>({
    ...SERVER_SORTING_OPTIONS,
    data: rows,
    columns: getModerationColumns("ADMIN", () => null),
    getCoreRowModel: getCoreRowModel(),
    state: {},
    onStateChange: () => undefined,
    renderFallbackValue: null,
  })
  return ids.map((id) => {
    table.setOptions((prev) => ({
      ...prev,
      state: { ...table.initialState, sorting },
      onSortingChange: (updater) => {
        sorting = typeof updater === "function" ? updater(sorting) : updater
      },
    }))
    table.getColumn(id)?.getToggleSortingHandler()?.({ shiftKey: true })
    const { sort, order } = toModerationSort(sorting)
    return `${sort} ${order}`
  })
}

describe("tri des tableaux d'offres de la modération (#5757)", () => {
  it("inverse le tri par date dès le premier clic depuis le tri par défaut", () => {
    expect(clickHeaders(["created_at", "created_at"])).toEqual(["created_at asc", "created_at desc"])
  })

  it("alterne croissant et décroissant sans retomber sur le tri par défaut, sur une seule colonne à la fois", () => {
    expect(clickHeaders(["offer_title", "offer_title", "offer_title", "created_at", "created_at", "created_at"])).toEqual([
      "offer_title asc",
      "offer_title desc",
      "offer_title asc",
      "created_at asc",
      "created_at desc",
      "created_at asc",
    ])
  })
})
