"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import Select from "@codegouvfr/react-dsfr/Select"
import Tag from "@codegouvfr/react-dsfr/Tag"
import { Box, Checkbox, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import type { IReferrerName } from "shared/models/elligible-training.model"
import type { IETFABulkOperation } from "shared/routes/eligible-trainings-for-appointment.routes"

import { useToast } from "@/app/hooks/useToast"
import { dayjs } from "@/common/dayjs"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { patchEligibleTrainingForAppointmentEmail, patchEligibleTrainingsForAppointments } from "@/utils/api"
import { pluralize } from "@/utils/strutils"
import { BulkDiffusionModal, BulkEmailModal, ResetEmailModal } from "./BulkActionModals"
import type { IDiffusionMode } from "./DiffusionPill"
import { DiffusionPill, DiffusionPillView } from "./DiffusionPill"
import { EmailCell } from "./EmailCell"
import type { IDiffusionFilter, IEmailFilter, IFormation, IFormationFilters } from "./formations-table.utils"
import { DEFAULT_FILTERS, filterFormations, getDiffusionState, groupByEmail, MISSING_EMAIL_GROUP, PLATFORMS } from "./formations-table.utils"

type IModal = "email" | "diffusion" | "reset" | null

// Sans ripple, MUI n'indique plus le focus clavier : contour DSFR à la place.
// Le fond des lignes sélectionnées double la classe (&&) pour passer devant `.fr-table__content table tbody td`.
const CHECKBOX_SX = { "&.Mui-focusVisible": { outline: "2px solid #0a76f6", outlineOffset: "2px" } }

const formations = (count: number) => pluralize(count, "formation")

const Legend = () => (
  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: `${fr.spacing("1v")} ${fr.spacing("4v")}`, fontSize: "0.75rem" }}>
    <span>Diffusion :</span>
    {[
      { state: { active: true, forced: false, eligible: true }, label: "activée automatiquement" },
      { state: { active: false, forced: false, eligible: true }, label: "désactivée automatiquement" },
      { state: { active: true, forced: true, eligible: true }, label: "activée de force" },
      { state: { active: false, forced: true, eligible: true }, label: "désactivée de force" },
      { state: { active: false, forced: false, eligible: false }, label: "non éligible" },
    ].map(({ state, label }) => (
      <Box key={label} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: fr.spacing("1v") }}>
        <DiffusionPillView state={state} short="LBA" />
        {label}
      </Box>
    ))}
  </Box>
)

export const FormationsTable = ({ formations: all }: { formations: IFormation[] }) => {
  const router = useRouter()
  const toast = useToast()
  const [filters, setFilters] = useState<IFormationFilters>(DEFAULT_FILTERS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<IModal>(null)
  const lastClickedId = useRef<string | null>(null)

  const visible = useMemo(() => filterFormations(all, filters), [all, filters])
  const emailGroups = useMemo(() => groupByEmail(all), [all])
  // Dérivée des props : une formation disparue après rafraîchissement sort de la sélection.
  const selection = useMemo(() => all.filter((formation) => selectedIds.has(formation._id)), [all, selectedIds])
  const visibleSelected = visible.filter((formation) => selectedIds.has(formation._id)).length
  const hiddenSelected = selection.length - visibleSelected

  const updateFilters = (patch: Partial<IFormationFilters>) => setFilters((previous) => ({ ...previous, ...patch }))

  const toggle = (id: string, checked: boolean, withRange: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      const ids = visible.map((formation) => formation._id)
      const anchor = lastClickedId.current ? ids.indexOf(lastClickedId.current) : -1
      const range = withRange && anchor !== -1 ? ids.slice(Math.min(anchor, ids.indexOf(id)), Math.max(anchor, ids.indexOf(id)) + 1) : [id]
      for (const rangeId of range) {
        if (checked) next.add(rangeId)
        else next.delete(rangeId)
      }
      return next
    })
    lastClickedId.current = id
  }

  const toggleAllVisible = (checked: boolean) =>
    setSelectedIds((previous) => {
      const next = new Set(previous)
      for (const formation of visible) {
        if (checked) next.add(formation._id)
        else next.delete(formation._id)
      }
      return next
    })

  const runBulk = async (ids: string[], operation: IETFABulkOperation, describe: (result: { updated: number; skipped: number }) => string) => {
    try {
      const { updated = 0, skipped = 0 } = await patchEligibleTrainingsForAppointments({ ids, operation })
      toast({ title: describe({ updated, skipped }) })
      router.refresh()
      return true
    } catch (_error) {
      toast({ title: "La modification n'a pas pu être enregistrée. Réessayez.", variant: "error" })
      return false
    }
  }

  const closeAfter = async (run: Promise<boolean>) => {
    if (await run) setModal(null)
  }

  const saveEmail = async (formation: IFormation, email: string) => {
    try {
      await patchEligibleTrainingForAppointmentEmail(formation._id, {
        lieu_formation_email: email,
        cle_ministere_educatif: formation.cle_ministere_educatif,
        is_lieu_formation_email_customized: true,
      })
      toast({ title: `E-mail de contact mis à jour pour ${formation.training_intitule_long}.` })
      router.refresh()
    } catch (_error) {
      toast({ title: "L'e-mail n'a pas pu être enregistré. Réessayez.", variant: "error" })
      throw _error
    }
  }

  const changeDiffusion = async (formation: IFormation, referrer: IReferrerName, mode: IDiffusionMode) => {
    const label = PLATFORMS.find((platform) => platform.name === referrer)?.label
    await runBulk([formation._id], { type: "set_referrers", changes: [{ referrer, mode }] }, () =>
      mode === "auto"
        ? `${label} repasse en automatique pour ${formation.training_intitule_long}.`
        : `${label} ${mode === "on" ? "activée" : "désactivée"} de force pour ${formation.training_intitule_long}.`
    )
  }

  const selectionIds = selection.map((formation) => formation._id)

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: fr.spacing("4v") }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: fr.spacing("2v") }}>
        <Typography variant="h3" component="h2" sx={{ mb: 0 }}>
          Formations
        </Typography>
        <Typography role="status" sx={{ mb: 0, color: fr.colors.decisions.text.mention.grey.default, fontVariantNumeric: "tabular-nums" }}>
          {visible.length === all.length ? formations(all.length) : `${visible.length} sur ${formations(all.length)}`}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("3v"), alignItems: "flex-end" }}>
        <Input
          label="Rechercher"
          style={{ flex: "1 1 260px", marginBottom: 0 }}
          nativeInputProps={{
            type: "search",
            value: filters.query,
            placeholder: "Intitulé, clé ministère éducatif, code postal, e-mail…",
            autoComplete: "off",
            onChange: (event) => updateFilters({ query: event.target.value }),
          }}
        />
        <Select
          label="E-mail"
          style={{ marginBottom: 0 }}
          nativeSelectProps={{ value: filters.email, onChange: (event) => updateFilters({ email: event.target.value as IEmailFilter }) }}
        >
          <option value="all">Tous</option>
          <option value="custom">Personnalisé</option>
          <option value="catalogue">Issu du catalogue</option>
          <option value="missing">Manquant</option>
        </Select>
        <Select
          label="Diffusion"
          style={{ marginBottom: 0 }}
          nativeSelectProps={{ value: filters.diffusion, onChange: (event) => updateFilters({ diffusion: event.target.value as IDiffusionFilter }) }}
        >
          <option value="all">Toutes</option>
          <option value="forced">Avec un forçage manuel</option>
          <option value="none">Aucune plateforme</option>
          {PLATFORMS.flatMap(({ name, label }) => [
            <option key={`on:${name}`} value={`on:${name}`}>
              Diffusée sur {label}
            </option>,
            <option key={`off:${name}`} value={`off:${name}`}>
              Non diffusée sur {label}
            </option>,
          ])}
        </Select>
        <Button priority="tertiary no outline" size="small" onClick={() => setFilters(DEFAULT_FILTERS)}>
          Réinitialiser les filtres
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: fr.spacing("2v") }}>
        <Typography component="span" sx={{ mb: 0, fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default }}>
          E-mails utilisés
        </Typography>
        <Box component="ul" className={fr.cx("fr-tags-group")} sx={{ m: 0 }}>
          {emailGroups.map(({ email, count }) => (
            <li key={email}>
              <Tag small pressed={filters.emailGroup === email} nativeButtonProps={{ onClick: () => updateFilters({ emailGroup: filters.emailGroup === email ? null : email }) }}>
                {`${email === MISSING_EMAIL_GROUP ? "Sans e-mail" : email} · ${count}`}
              </Tag>
            </li>
          ))}
        </Box>
        {filters.emailGroup !== null && visibleSelected < visible.length && (
          <Button priority="tertiary no outline" size="small" onClick={() => toggleAllVisible(true)}>
            {`Sélectionner ces ${formations(visible.length)}`}
          </Button>
        )}
      </Box>

      <Legend />

      <Box className={fr.cx("fr-table", "fr-table--no-caption", "fr-mb-0")}>
        <Box className="fr-table__wrapper">
          {/* Défilement vertical dans le conteneur qui défile aussi à l'horizontale : sa barre horizontale reste à l'écran sur desktop */}
          <Box className="fr-table__container" sx={{ maxHeight: { md: "70vh" }, "& thead th": { position: { md: "sticky" }, top: 0, zIndex: 1 } }}>
            <Box className="fr-table__content">
              <table>
                <caption>Formations de l'établissement</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <Checkbox
                        size="small"
                        disableRipple
                        sx={CHECKBOX_SX}
                        checked={visible.length > 0 && visibleSelected === visible.length}
                        indeterminate={visibleSelected > 0 && visibleSelected < visible.length}
                        onChange={(event) => toggleAllVisible(event.target.checked)}
                        slotProps={{ input: { "aria-label": "Sélectionner toutes les formations affichées" } }}
                      />
                    </th>
                    <th scope="col">Formation</th>
                    <th scope="col">Lieu de formation</th>
                    <th scope="col">E-mail de contact</th>
                    <th scope="col">Diffusion</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        Aucune formation ne correspond à ces filtres.{" "}
                        <Button priority="tertiary no outline" size="small" onClick={() => setFilters(DEFAULT_FILTERS)}>
                          Réinitialiser les filtres
                        </Button>
                      </td>
                    </tr>
                  )}
                  {visible.map((formation) => {
                    const selected = selectedIds.has(formation._id)
                    return (
                      <Box
                        component="tr"
                        key={formation._id}
                        sx={{ verticalAlign: "top", ...(selected && { "&& > td": { backgroundColor: fr.colors.decisions.background.alt.blueFrance.default } }) }}
                      >
                        <td>
                          <Checkbox
                            size="small"
                            disableRipple
                            sx={CHECKBOX_SX}
                            checked={selected}
                            onChange={(event) => toggle(formation._id, event.target.checked, (event.nativeEvent as MouseEvent).shiftKey)}
                            slotProps={{ input: { "aria-label": `Sélectionner ${formation.training_intitule_long}` } }}
                          />
                        </td>
                        <Box component="td" className={fr.cx("fr-cell--multiline")} sx={{ minWidth: 320 }}>
                          <Box sx={{ fontWeight: 700 }}>{formation.training_intitule_long}</Box>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: `0 ${fr.spacing("3v")}`, fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
                            <span>
                              Clé ME{" "}
                              <Box component="span" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                                {formation.cle_ministere_educatif}
                              </Box>
                            </span>
                            {formation.parcoursup_id && (
                              <span>
                                <span lang="en">Id</span> Parcoursup {formation.parcoursup_id}
                              </span>
                            )}
                            <DsfrLink
                              size="sm"
                              href={`https://catalogue-apprentissage.intercariforef.org/recherche/formations?SEARCH=%22${encodeURIComponent(formation.cle_ministere_educatif)}%22`}
                            >
                              Catalogue
                              <span className="fr-sr-only">{` - ${formation.training_intitule_long}`}</span>
                            </DsfrLink>
                          </Box>
                          {formation.last_catalogue_sync_date && (
                            <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
                              Synchronisée avec le catalogue le {dayjs(formation.last_catalogue_sync_date).format("DD/MM/YYYY")}
                            </Box>
                          )}
                        </Box>
                        <Box component="td" sx={{ whiteSpace: "nowrap" }}>
                          {formation.lieu_formation_zip_code}
                          <Box sx={{ color: fr.colors.decisions.text.mention.grey.default }}>{formation.lieu_formation_city}</Box>
                        </Box>
                        <td>
                          <EmailCell formation={formation} onSave={(email) => saveEmail(formation, email)} />
                        </td>
                        <td>
                          <Box
                            role="group"
                            aria-label={`Diffusion de ${formation.training_intitule_long}`}
                            sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v"), width: 220 }}
                          >
                            {PLATFORMS.map((platform) => (
                              <DiffusionPill
                                key={platform.name}
                                referrer={platform.name}
                                label={platform.label}
                                short={platform.short}
                                state={getDiffusionState(formation, platform.name)}
                                formationTitle={formation.training_intitule_long}
                                onChange={(mode) => changeDiffusion(formation, platform.name, mode)}
                              />
                            ))}
                          </Box>
                        </td>
                      </Box>
                    )
                  })}
                </tbody>
              </table>
            </Box>
          </Box>
        </Box>
      </Box>

      {selection.length > 0 && (
        <Box
          role="region"
          aria-label="Actions sur la sélection"
          sx={{
            position: "sticky",
            bottom: 0,
            zIndex: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: `${fr.spacing("2v")} ${fr.spacing("3v")}`,
            px: fr.spacing("4v"),
            py: fr.spacing("3v"),
            backgroundColor: fr.colors.decisions.background.contrast.blueFrance.default,
            borderTop: `2px solid ${fr.colors.decisions.border.plain.blueFrance.default}`,
          }}
        >
          <Box sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {pluralize(selection.length, "formation sélectionnée", "formations sélectionnées")}
            {hiddenSelected > 0 && <Box sx={{ fontWeight: 400, fontSize: "0.75rem" }}>{`dont ${pluralize(hiddenSelected, "masquée", "masquées")} par les filtres`}</Box>}
          </Box>
          <Button size="small" onClick={() => setModal("email")}>
            Modifier l'e-mail
          </Button>
          <Button size="small" onClick={() => setModal("diffusion")}>
            Modifier la diffusion
          </Button>
          <Button size="small" priority="secondary" disabled={!selection.some((formation) => formation.is_lieu_formation_email_customized)} onClick={() => setModal("reset")}>
            Rétablir l'e-mail catalogue
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button size="small" priority="tertiary no outline" onClick={() => setSelectedIds(new Set())}>
            Tout désélectionner
          </Button>
        </Box>
      )}

      <BulkEmailModal
        isOpen={modal === "email"}
        selection={selection}
        onClose={() => setModal(null)}
        onSubmit={(email) => closeAfter(runBulk(selectionIds, { type: "set_email", email }, ({ updated }) => `E-mail de contact mis à jour sur ${formations(updated)}.`))}
      />
      <BulkDiffusionModal
        isOpen={modal === "diffusion"}
        selection={selection}
        onClose={() => setModal(null)}
        onSubmit={(changes) =>
          closeAfter(
            runBulk(
              selectionIds,
              { type: "set_referrers", changes },
              ({ updated, skipped }) =>
                `Diffusion mise à jour sur ${formations(updated)}${skipped ? `, ${pluralize(skipped, "forçage ignoré", "forçages ignorés")} (plateforme non éligible)` : ""}.`
            )
          )
        }
      />
      <ResetEmailModal
        isOpen={modal === "reset"}
        selection={selection}
        onClose={() => setModal(null)}
        onSubmit={() =>
          closeAfter(runBulk(selectionIds, { type: "reset_email" }, ({ updated }) => `E-mail du catalogue rétabli sur ${formations(updated)} à la prochaine synchronisation.`))
        }
      />
    </Box>
  )
}
