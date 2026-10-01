import { fr } from "@codegouvfr/react-dsfr"

// L'Input DSFR place son `action` à côté du champ dans .fr-input-wrap--action (flex) : ces règles, posées sur un parent, le ramènent dans le champ
export const searchClearButtonSx = {
  "& .fr-input-wrap--action": { position: "relative" },
  "& .fr-input-wrap--action > .fr-input": { pr: fr.spacing("10v") },
  "& .fr-input-wrap--action > .fr-btn": { position: "absolute", top: "50%", right: fr.spacing("1v"), transform: "translateY(-50%)", ml: 0 },
}

/**
 * À passer en `action` de l'Input DSFR, `null` quand la croix est masquée : avec `undefined`, l'Input retire .fr-input-wrap,
 * le champ est remonté et perd le focus à la première frappe.
 */
export function SearchClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={fr.cx("fr-btn", "fr-btn--tertiary-no-outline", "fr-btn--sm", "fr-icon-close-line")} title="Effacer la recherche" onClick={onClick}>
      <span className="fr-sr-only">Effacer la recherche</span>
    </button>
  )
}
