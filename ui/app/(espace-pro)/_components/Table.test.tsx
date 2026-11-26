import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import Table from "./Table"

const columns = [
  { Header: "", id: "action", srOnly: "Actions", disableSortBy: true, accessor: () => null },
  { Header: "Nom", id: "nom", accessor: "nom" },
  { Header: "Créé le", id: "createdAt", accessor: "createdAt" },
]

// Même lecture du markup que VirtualTable.test.tsx : `[\s\S]*?` traverse les <style> qu'Emotion insère.
function renderHeaders(initialSortBy: { id: string; desc: boolean }[]) {
  const html = renderToStaticMarkup(<Table caption="Test" columns={columns} data={[{ nom: "A", createdAt: "2026-01-01" }]} initialSortBy={initialSortBy} />)
  const headers = html.match(/<th[\s>][\s\S]*?<\/th>/g) ?? []
  return Object.fromEntries(columns.map((column, i) => [column.id, headers[i]]))
}

describe("Table", () => {
  it("expose l'ordre de tri courant via aria-sort sur l'en-tête de colonne", () => {
    expect(renderHeaders([{ id: "nom", desc: false }]).nom).toContain('aria-sort="ascending"')
    expect(renderHeaders([{ id: "nom", desc: true }]).nom).toContain('aria-sort="descending"')
  })

  it("marque les autres colonnes triables à none et n'en pose pas sur une colonne non triable", () => {
    const headers = renderHeaders([{ id: "nom", desc: false }])
    expect(headers.createdAt).toContain('aria-sort="none"')
    expect(headers.action).not.toContain("aria-sort")
  })

  it("nomme le bouton de tri par la colonne, sans y répéter l'état du tri", () => {
    expect(renderHeaders([{ id: "nom", desc: true }]).nom).toContain('aria-label="Trier par Nom"')
  })
})
