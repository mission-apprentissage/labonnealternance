"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, ListItemText, MenuItem, MenuList, Popover } from "@mui/material"
import { useId, useState } from "react"
import type { IReferrerName } from "shared/models/elligible-training.model"

import type { IDiffusionState } from "./formations-table.utils"

export type IDiffusionMode = "auto" | "on" | "off"

const INELIGIBLE_REASON: Partial<Record<IReferrerName, string>> = {
  PARCOURSUP: "Formation non visible sur Parcoursup",
  AFFELNET: "Formation non visible sur Affelnet",
  ONISEP: "Formation absente du référentiel ONISEP",
}

const describeState = ({ active, forced, eligible }: IDiffusionState, referrer: IReferrerName) => {
  if (!eligible) return INELIGIBLE_REASON[referrer] ?? "Non éligible"
  return `${active ? "Activée" : "Désactivée"}${forced ? ", forcée à la main" : ", automatique"}`
}

const PinIcon = () => (
  <Box component="span" className={fr.cx("ri-pushpin-2-fill", "fr-icon--xs")} aria-hidden="true" sx={{ "&::before": { width: "0.75rem", height: "0.75rem" } }} />
)

export const DiffusionPillView = ({ state, short }: { state: Pick<IDiffusionState, "active" | "forced" | "eligible">; short: string }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: "2px",
      px: fr.spacing("2v"),
      borderRadius: "999px",
      border: "1px solid",
      fontSize: "0.75rem",
      fontWeight: 700,
      lineHeight: "1.25rem",
      whiteSpace: "nowrap",
      ...(state.active
        ? {
            backgroundColor: fr.colors.decisions.background.actionHigh.blueFrance.default,
            borderColor: fr.colors.decisions.background.actionHigh.blueFrance.default,
            color: "#fff",
          }
        : {
            borderColor: state.forced ? fr.colors.decisions.text.default.grey.default : fr.colors.decisions.border.plain.grey.default,
            color: state.forced ? fr.colors.decisions.text.default.grey.default : fr.colors.decisions.text.mention.grey.default,
          }),
      ...(!state.eligible && { borderStyle: "dotted", opacity: 0.55 }),
    }}
  >
    <Box component="span" sx={{ textDecoration: state.forced && !state.active ? "line-through" : undefined }}>
      {short}
    </Box>
    {state.forced && <PinIcon />}
  </Box>
)

export const DiffusionPill = ({
  referrer,
  label,
  short,
  state,
  formationTitle,
  onChange,
}: {
  referrer: IReferrerName
  label: string
  short: string
  state: IDiffusionState
  formationTitle: string
  onChange: (mode: IDiffusionMode) => Promise<void>
}) => {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const menuId = useId()
  const description = `${label} : ${describeState(state, referrer)}`
  const current: IDiffusionMode = state.forced ? (state.active ? "on" : "off") : "auto"

  const choose = async (mode: IDiffusionMode) => {
    setAnchor(null)
    if (mode !== current) await onChange(mode)
  }

  const options: { mode: IDiffusionMode; label: string; hint: string }[] = [
    { mode: "auto", label: `Automatique : ${state.auto ? "activée" : "désactivée"}`, hint: "Suit l'opt-out et le premium de l'établissement" },
    { mode: "on", label: "Forcer l'activation", hint: "Conservé par la synchronisation" },
    { mode: "off", label: "Forcer la désactivation", hint: "Conservé par la synchronisation" },
  ]

  return (
    <>
      <Box
        component="button"
        type="button"
        disabled={!state.eligible}
        title={description}
        aria-label={`${description}. Modifier pour ${formationTitle}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? menuId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ p: 0, border: 0, background: "none", cursor: state.eligible ? "pointer" : "not-allowed", borderRadius: "999px" }}
      >
        <DiffusionPillView state={state} short={short} />
      </Box>
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
        <Box sx={{ px: fr.spacing("3v"), pt: fr.spacing("2v"), maxWidth: 320 }}>
          <Box sx={{ fontWeight: 700 }}>{label}</Box>
          <Box className={fr.cx("fr-hint-text")} sx={{ mt: 0 }}>
            {formationTitle}
          </Box>
        </Box>
        <MenuList id={menuId} autoFocusItem aria-label={`Diffusion sur ${label}`}>
          {options.map((option) => (
            <MenuItem key={option.mode} role="menuitemradio" aria-checked={current === option.mode} selected={current === option.mode} onClick={() => choose(option.mode)}>
              <ListItemText primary={option.label} secondary={option.hint} />
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  )
}
