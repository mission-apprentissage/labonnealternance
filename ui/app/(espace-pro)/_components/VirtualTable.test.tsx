import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { type ColumnDef, VirtualTable } from "./VirtualTable"

type Row = { nom: string; date: string; contact: string }

const columns: ColumnDef<Row>[] = [
  { id: "actions", header: "", meta: { srOnly: "Actions sur la ligne" }, enableSorting: false },
  { id: "nom", header: "Nom", accessorKey: "nom" },
  { id: "date", header: "Créé le", accessorKey: "date" },
  { id: "contact", header: "Contact", accessorKey: "contact", enableSorting: false },
]

function renderHeaders(defaultSortBy: { id: string; desc: boolean }[]) {
  const html = renderToStaticMarkup(<VirtualTable caption="Test" columns={columns} data={[]} defaultSortBy={defaultSortBy} hideSearch hideCount />)
    // Emotion insère ses <style> dans le rendu serveur
    .replace(/<style[^>]*>.*?<\/style>/g, "")
  const headers = html.match(/<th[\s>].*?<\/th>/g) ?? []
  expect(headers).toHaveLength(columns.length)
  return Object.fromEntries(columns.map((column, i) => [column.id, headers[i]]))
}

describe("VirtualTable", () => {
  it("expose l'ordre de tri courant via aria-sort sur l'en-tête de colonne", () => {
    expect(renderHeaders([{ id: "nom", desc: false }]).nom).toContain('aria-sort="ascending"')
    expect(renderHeaders([{ id: "nom", desc: true }]).nom).toContain('aria-sort="descending"')
  })

  it("marque aria-sort=none sur une colonne triable qui n'est pas triée", () => {
    expect(renderHeaders([{ id: "nom", desc: false }]).date).toContain('aria-sort="none"')
  })

  it("place le libellé et l'icône masquée dans un bouton focalisable", () => {
    const [button, content] = renderHeaders([]).nom.match(/<button[^>]*>(.*)<\/button>/) ?? []
    expect(button).toMatch(/^<button[^>]*type="button"/)
    expect(content).toContain('aria-hidden="true"')
    const accessibleText = content.replace(/<([a-z]+)[^>]*aria-hidden="true"[^>]*>.*?<\/\1>/g, "").replace(/<[^>]+>/g, "")
    expect(accessibleText).toBe("Nom")
  })

  it("ne rend ni bouton ni aria-sort sur une colonne non triable", () => {
    const { actions, contact } = renderHeaders([{ id: "contact", desc: false }])
    for (const header of [actions, contact]) {
      expect(header).not.toContain("<button")
      expect(header).not.toContain("aria-sort")
    }
    expect(actions).toContain('<span class="fr-sr-only">Actions sur la ligne</span>')
  })
})
