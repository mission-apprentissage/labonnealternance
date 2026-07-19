"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, ButtonBase, ClickAwayListener, Grow, Paper, Popper } from "@mui/material"
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react"

/**
 * Chip pill de filtre (design « Nouvelle recherche »). Deux comportements :
 * - avec `popperContent` : dropdown (caret) ouvrant un panneau flottant — fermeture clic extérieur / Échap ;
 * - sans : toggle on/off via `onToggle`.
 *
 * La sélection est signalée par l'inversion du fond (pas de badge ✓) et le libellé
 * porte la valeur active (ex. « BTS, DEUST (Bac+2) », « Offres d'emploi en alternance, +1 »).
 */
interface SearchFilterChipProps {
  label: string
  /** Libellé affiché quand le filtre est actif (défaut : `label`). */
  activeLabel?: string
  active: boolean
  disabled?: boolean
  /** Contenu du panneau flottant — présence = variante dropdown. */
  popperContent?: ReactNode
  /** Variante toggle : bascule à chaque clic. */
  onToggle?: () => void
  /**
   * Variante déclencheur de modale (chips mobile « Filtres (n) » / « Tri ») : caret sans
   * popper, `onToggle` ouvre la modale — pas d'aria-pressed ni de pastille de sélection.
   */
  dialogTrigger?: boolean
}

const CHIP_COLORS = {
  default: {
    bg: fr.colors.decisions.background.contrast.blueFrance.default,
    bgHover: fr.colors.decisions.background.contrast.blueFrance.hover,
    text: fr.colors.decisions.text.actionHigh.blueFrance.default,
  },
  active: {
    bg: fr.colors.decisions.background.actionHigh.blueFrance.default,
    bgHover: fr.colors.decisions.background.actionHigh.blueFrance.hover,
    text: "#FFFFFF",
  },
  disabled: {
    bg: fr.colors.decisions.background.disabled.grey.default,
    text: fr.colors.decisions.text.disabled.grey.default,
  },
}

export function SearchFilterChip({ label, activeLabel, active, disabled = false, popperContent, onToggle, dialogTrigger = false }: SearchFilterChipProps) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popperId = useId()
  const isDropdown = popperContent !== undefined

  const close = () => setOpen(false)

  const handleClick = () => {
    if (isDropdown) setOpen((prev) => !prev)
    else onToggle?.()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation()
      close()
      anchorRef.current?.focus()
    }
  }

  const palette = active ? CHIP_COLORS.active : CHIP_COLORS.default

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <ButtonBase
        ref={anchorRef}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isDropdown ? open : undefined}
        aria-haspopup={isDropdown ? "true" : dialogTrigger ? "dialog" : undefined}
        aria-controls={isDropdown && open ? popperId : undefined}
        aria-pressed={!isDropdown && !dialogTrigger ? active : undefined}
        sx={{
          height: 32,
          borderRadius: "16px",
          px: "12px",
          py: "4px",
          gap: "4px",
          fontSize: "0.875rem",
          lineHeight: "24px",
          whiteSpace: "nowrap",
          backgroundColor: disabled ? CHIP_COLORS.disabled.bg : palette.bg,
          color: disabled ? CHIP_COLORS.disabled.text : palette.text,
          "&:hover": disabled ? undefined : { backgroundColor: palette.bgHover },
          "&:focus-visible": {
            outline: "2px solid #0a76f6",
            outlineOffset: 2,
            borderRadius: 0,
          },
        }}
      >
        {active ? (activeLabel ?? label) : label}
        {(isDropdown || dialogTrigger) && (
          <Box component="span" className={fr.cx(open ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line", "fr-icon--sm")} aria-hidden="true" />
        )}
      </ButtonBase>
      {/* Pastille de sélection des toggles (design Figma) : déborde du coin haut-droit.
          Décorative — l'état est déjà porté par aria-pressed. */}
      {!isDropdown && !dialogTrigger && active && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            top: "-6px",
            right: "-2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            color: fr.colors.decisions.text.actionHigh.blueFrance.default,
            pointerEvents: "none",
          }}
          className={fr.cx("fr-icon-checkbox-circle-line", "fr-icon--sm")}
        />
      )}
      {isDropdown && (
        <Popper id={popperId} open={open} anchorEl={anchorRef.current} placement="bottom-start" transition sx={{ zIndex: (theme) => theme.zIndex.modal }}>
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: "top left" }}>
              <Paper onKeyDown={handleKeyDown} elevation={0} sx={{ mt: "4px", borderRadius: "4px", py: "8px", minWidth: 240, boxShadow: "0 6px 18px rgba(0,0,18,0.16)" }}>
                <ClickAwayListener onClickAway={close}>
                  <Box>{popperContent}</Box>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}
    </Box>
  )
}

/**
 * Ligne d'option mono-choix pour le popper d'une chip (ex. Niveau d'études) :
 * pas de radio en desktop, l'option sélectionnée est signalée par le fond contrasté.
 */
export function SearchChipOptionRow({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        display: "flex",
        width: "100%",
        justifyContent: "flex-start",
        textAlign: "left",
        px: "16px",
        py: "8px",
        fontSize: "1rem",
        color: fr.colors.decisions.text.default.grey.default,
        backgroundColor: selected ? fr.colors.decisions.background.contrast.blueFrance.default : undefined,
        "&:hover": { backgroundColor: selected ? fr.colors.decisions.background.contrast.blueFrance.hover : fr.colors.decisions.background.default.grey.hover },
      }}
    >
      {label}
    </ButtonBase>
  )
}
