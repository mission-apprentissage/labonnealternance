/**
 * Hides the DSFR scroll-shadow pseudo-element added on `.fr-table__wrapper` when the table can
 * scroll horizontally. Apply on the `fr-table__wrapper` Box.
 *
 * Return type is left inferred (a plain object) rather than typed `SxProps<Theme>`: that union type
 * breaks when spread into another `sx` object literal alongside other properties.
 */
export function getFlatTableWrapperSx() {
  return { "&::after": { display: "none !important" } }
}

/**
 * Removes the default DSFR/browser table border so it can be redrawn by `getFlatTableCellBordersSx`.
 * Apply on the element carrying `component="table"`, or on a local `"& table"` rule when styling a
 * container that wraps a raw `<table>`.
 */
export function getFlatTableResetSx() {
  return { borderCollapse: "collapse !important", border: "none !important" }
}

/**
 * Flat DSFR table borders: no per-cell border, a dark rule under the header, a lighter rule under
 * each body row. These are descendant selectors, so they apply unchanged whether `sx` sits directly
 * on the `<table>` or on a container that wraps it.
 *
 * Colors use the DSFR grey tokens (`--border-plain-grey` = #3a3a3a, `--border-contrast-grey` =
 * #929292 in the light theme) instead of hardcoded hex so they follow the DSFR color scheme.
 */
export function getFlatTableCellBordersSx() {
  return {
    "& th, & td": { border: "none !important", backgroundImage: "none !important" },
    "& thead": { borderBottom: "1px solid var(--border-plain-grey) !important" },
    "& tbody tr": { borderBottom: "1px solid var(--border-contrast-grey) !important" },
  }
}
