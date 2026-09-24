"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useEffect, useId, useRef, useState } from "react"
import { FeedbackWidget } from "./FeedbackWidget"
import { takeAnnouncement } from "./feedbackTrigger.utils"
import { useFeedbackTrigger } from "./useFeedbackTrigger"

/**
 * Bouton flottant « Donner mon avis », en bas à droite, qui ouvre le questionnaire dans un panneau
 * non modal. Monté une fois pour tout le site : `useFeedbackTrigger` décide s'il apparaît.
 *
 * Accessibilité :
 * - l'apparition du bouton, sans action de l'usager, est annoncée une fois par session dans une
 *   zone `role="status"` présente dès le montage (RGAA 7.5) ; le focus ne bouge pas ;
 * - à l'ouverture, le focus va sur la question ; Échap ou la croix referment et le rendent au bouton ;
 * - le panneau fermé reste monté (masqué) : rouvert, il reprend où l'usager s'était arrêté.
 */
export function FeedbackLauncher() {
  const { form, ready, dismiss, complete } = useFeedbackTrigger()
  const [open, setOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // une fois ouvert, le panneau reste affiché jusqu'à sa fermeture, même si la réponse vient de
  // retirer le formulaire (remerciement) — mais pas si l'usager change de page de déclenchement
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const visible = form !== null && (ready || openSlug === form.slug)

  useEffect(() => {
    if (ready && form && takeAnnouncement(form.slug)) {
      setAnnouncement("Vous pouvez donner votre avis sur cette page : bouton « Donner mon avis » en bas de page.")
    }
  }, [ready, form])

  useEffect(() => {
    if (!visible) {
      setOpen(false)
      setOpenSlug(null)
    }
  }, [visible])

  const openPanel = () => {
    if (!form) return
    setOpen(true)
    setOpenSlug(form.slug)
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("[data-feedback-heading]")?.focus())
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
            bottom: { xs: fr.spacing("4v"), md: fr.spacing("6v") },
            zIndex: 1300,
            maxWidth: `calc(100vw - 2 * ${fr.spacing("4v")})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: fr.spacing("3v"),
          }}
        >
          <Box
            id={panelId}
            ref={panelRef}
            hidden={!open}
            onKeyDown={(event) => {
              if (event.key === "Escape") closePanel()
            }}
            sx={{ maxWidth: "100%" }}
          >
            <FeedbackWidget
              key={form.slug}
              variant="floating"
              questions={form.questions}
              onClose={closePanel}
              onProgress={({ status }) => {
                if (status === "completed") complete()
              }}
            />
          </Box>
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
                onClick={() => (open ? closePanel() : openPanel())}
                style={{ boxShadow: "0 4px 16px rgba(0, 0, 18, 0.16)" }}
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
