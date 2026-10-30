import Button from "@codegouvfr/react-dsfr/Button"
import type { CSSProperties } from "react"

// aria-disabled plutôt que disabled : un bouton désactivé perd le focus, qui retombe en haut de page. Le DSFR ne stylant que :disabled, l'apparence est reproduite ici
export function PaginationButton({
  label,
  targetPage,
  pageCount,
  isAvailable,
  onClick,
}: {
  label: string
  targetPage: number
  pageCount: number
  isAvailable: boolean
  onClick: () => void
}) {
  return (
    <Button
      priority="secondary"
      onClick={() => {
        if (isAvailable) onClick()
      }}
      nativeButtonProps={{
        "aria-disabled": !isAvailable,
        "aria-label": isAvailable ? `${label}, page ${targetPage} sur ${pageCount}` : undefined,
      }}
      style={
        isAvailable
          ? undefined
          : ({
              color: "var(--text-disabled-grey)",
              boxShadow: "inset 0 0 0 1px var(--border-disabled-grey)",
              backgroundColor: "transparent",
              cursor: "not-allowed",
              "--hover": "inherit",
              "--active": "inherit",
            } as CSSProperties)
      }
    >
      {label}
    </Button>
  )
}
