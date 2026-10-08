"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Dialog, useMediaQuery, useTheme } from "@mui/material"
import { useEffect, useId, useRef, useState } from "react"
import { FeedbackWidget } from "./FeedbackWidget"
import { takeAnnouncement } from "./feedbackTrigger.utils"
import { useFeedbackSession } from "./useFeedbackSession"
import { useFeedbackTrigger } from "./useFeedbackTrigger"

/**
 * Bouton flottant « Donner mon avis », en bas à droite, qui ouvre le questionnaire dans un panneau
 * non modal. Monté une fois pour tout le site : `useFeedbackTrigger` décide s'il apparaît.
 *
 * Accessibilité :
 * - l'apparition du bouton, sans action de l'usager, est annoncée une fois par session dans une
 *   zone `role="status"` présente dès le montage (RGAA 7.5) ; le focus ne bouge pas, y compris quand
 *   le formulaire demande l'ouverture immédiate (`trigger.autoOpen`) ;
 * - à l'ouverture, le focus va sur la question ; Échap ou la croix referment et le rendent au bouton ;
 * - le panneau fermé reste monté (masqué) : rouvert, il reprend où l'usager s'était arrêté ;
 * - en plein écran (`trigger.fullScreen`), le panneau devient une modale centrée qui garde le focus ;
 *   sous md, c'est toujours une modale, qui occupe tout l'écran : un panneau non modal couvrant la
 *   page laisserait la tabulation parcourir des éléments cachés derrière lui (WCAG 2.4.11).
 */
export function FeedbackLauncher() {
  const { form, ready, dismiss, complete } = useFeedbackTrigger()
  const session = useFeedbackSession(form, ready)
  const [open, setOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const panelId = useId()
  const dialogTitleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // une fois ouvert, le panneau reste affiché jusqu'à sa fermeture, même si la réponse vient de
  // retirer le formulaire (remerciement) — mais pas si l'usager change de page de déclenchement
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const visible = form !== null && (ready || openSlug === form.slug)
  const isSmallScreen = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true })
  const asDialog = isSmallScreen || form?.trigger.fullScreen === true

  useEffect(() => {
    if (!visible) {
      setOpen(false)
      setOpenSlug(null)
    }
  }, [visible])

  const openPanel = ({ moveFocus }: { moveFocus: boolean }) => {
    if (!form) return
    setOpen(true)
    setOpenSlug(form.slug)
    session.start()
    // ouverture sans action de l'usager : le focus reste où il est, l'annonce suffit
    if (moveFocus) requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[data-feedback-heading]")?.focus())
  }

  const closePanel = () => {
    setOpen(false)
    if (!ready) {
      // questionnaire terminé : le bouton disparaît avec le panneau
      setOpenSlug(null)
      return
    }
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  // première apparition de la session : annoncée, et ouverte d'emblée si le formulaire le demande
  useEffect(() => {
    if (!ready || !form || !takeAnnouncement(form.slug)) return
    if (form.trigger.autoOpen) {
      setAnnouncement(`Un questionnaire « Donner mon avis » s'est ouvert${asDialog ? "" : " en bas de page"}. Le bouton « Réduire » le referme.`)
      // une modale garde le focus en elle : il doit y entrer, sans quoi rien ne reste atteignable
      openPanel({ moveFocus: asDialog })
    } else {
      setAnnouncement("Vous pouvez donner votre avis sur cette page : bouton « Donner mon avis » en bas de page.")
    }
  }, [ready, form])

  const widget = form && (
    <FeedbackWidget
      key={form.slug}
      variant={asDialog ? "modal" : "floating"}
      questions={form.questions}
      onClose={closePanel}
      onProgress={(progress) => {
        session.save(progress)
        if (progress.status === "completed") complete()
      }}
    />
  )

  return (
    <Box data-feedback-launcher>
      <p role="status" className={fr.cx("fr-sr-only")}>
        {announcement}
      </p>
      {visible && form && (
        <Box
          sx={{
            position: "fixed",
            right: { xs: fr.spacing("4v"), md: fr.spacing("6v") },
            // sous lg, au-dessus des barres d'action fixées en bas des fiches offre et formation (~73 px)
            bottom: { xs: fr.spacing("24v"), lg: fr.spacing("6v") },
            zIndex: 1300,
            maxWidth: `calc(100vw - 2 * ${fr.spacing("4v")})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: fr.spacing("3v"),
          }}
        >
          {asDialog ? (
            // modale MUI : piège à focus, page rendue inerte (aria-hidden) et grisée, Échap et clic sur le fond referment
            <Dialog
              open={open}
              keepMounted
              onClose={closePanel}
              fullScreen={isSmallScreen}
              maxWidth="sm"
              fullWidth
              aria-labelledby={dialogTitleId}
              slotProps={{ paper: { sx: { borderRadius: 0 } } }}
            >
              <span id={dialogTitleId} className={fr.cx("fr-sr-only")}>
                Donner mon avis
              </span>
              <Box id={panelId} ref={panelRef}>
                {widget}
              </Box>
            </Dialog>
          ) : (
            <Box
              id={panelId}
              ref={panelRef}
              hidden={!open}
              onKeyDown={(event) => {
                if (event.key === "Escape") closePanel()
              }}
              sx={{ maxWidth: "100%" }}
            >
              {widget}
            </Box>
          )}
          {!(open && !ready) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v") }}>
              {!open && (
                <Button
                  type="button"
                  priority="tertiary"
                  size="small"
                  iconId="fr-icon-close-line"
                  title="Ne plus proposer de donner mon avis"
                  onClick={dismiss}
                  style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}
                />
              )}
              <Button
                ref={buttonRef}
                type="button"
                iconId="fr-icon-feedback-line"
                iconPosition="left"
                nativeButtonProps={{ "aria-expanded": open, "aria-controls": panelId }}
                onClick={() => (open ? closePanel() : openPanel({ moveFocus: true }))}
                style={{ borderRadius: 9999, boxShadow: "0 4px 16px rgba(0, 0, 18, 0.16)" }}
              >
                Donner mon avis
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
