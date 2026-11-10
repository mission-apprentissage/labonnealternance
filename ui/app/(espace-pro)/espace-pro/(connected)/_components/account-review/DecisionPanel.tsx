import { fr } from "@codegouvfr/react-dsfr"
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup"
import { Box, Typography } from "@mui/material"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import type { ReviewSignal, SignalTone } from "./review-signals"

const TONES: Record<SignalTone, { icon: string; color: string }> = {
  warning: { icon: "fr-icon-warning-fill", color: "var(--text-default-warning)" },
  error: { icon: "fr-icon-close-circle-fill", color: "var(--text-default-error)" },
  success: { icon: "fr-icon-checkbox-circle-fill", color: "var(--text-default-success)" },
  info: { icon: "fr-icon-information-line", color: "var(--text-default-info)" },
  neutral: { icon: "fr-icon-subtract-line", color: "var(--text-mention-grey)" },
}

const DecisionSignal = ({ signal, onRetry }: { signal: ReviewSignal; onRetry?: () => void }) => {
  const tone = TONES[signal.tone]
  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        gap: fr.spacing("3v"),
        alignItems: "flex-start",
        py: fr.spacing("3v"),
        "&:not(:last-of-type)": { borderBottom: "1px solid var(--border-default-grey)" },
      }}
    >
      <Box component="span" className={tone.icon} aria-hidden="true" sx={{ color: tone.color, flexShrink: 0 }} />
      <Box>
        <Typography sx={{ m: 0, fontWeight: 700 }}>{signal.title}</Typography>
        <Typography sx={{ m: 0, fontSize: "14px" }}>
          {signal.description}
          {signal.link && (
            <>
              {" "}
              <a className="fr-link fr-link--sm" href={signal.link.href}>
                {signal.link.label}
              </a>
            </>
          )}
        </Typography>
        {signal.retry && onRetry && (
          <Button priority="tertiary no outline" size="small" iconId="fr-icon-refresh-line" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </Box>
    </Box>
  )
}

export const DecisionPanel = ({
  signals,
  onRetryOtherAccounts,
  actions,
  next,
}: {
  signals: ReviewSignal[]
  onRetryOtherAccounts: () => void
  actions: ButtonProps[]
  next: { href: string; label: string; hint?: string } | null
}) => {
  const [firstAction, ...otherActions] = actions
  return (
    <Box
      component="aside"
      aria-labelledby="decision-titre"
      sx={{
        flex: "1 1 320px",
        minWidth: 0,
        position: { md: "sticky" },
        top: { md: fr.spacing("4v") },
        alignSelf: "flex-start",
        border: "1px solid var(--border-default-grey)",
        backgroundColor: "var(--background-alt-grey)",
        p: fr.spacing("6v"),
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("2v"),
        // DepotSimplifieLayout (espace OPCO) espace les <li> de contenu : ni les signaux ni les boutons ne doivent l'hériter.
        '& ul:not([role="listbox"]) li': { mx: "0 !important", mb: "0 !important" },
      }}
    >
      <Typography id="decision-titre" component="h2" sx={{ m: 0, fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>
        Avant de décider
      </Typography>
      <Typography sx={{ m: 0, fontSize: "14px", color: "var(--text-mention-grey)" }}>Synthèse calculée à partir de la fiche.</Typography>
      <Box component="ul" aria-label="Points de vérification" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {signals.map((signal) => (
          <DecisionSignal key={signal.title} signal={signal} onRetry={onRetryOtherAccounts} />
        ))}
      </Box>
      {firstAction && <ButtonsGroup inlineLayoutWhen="never" buttonsIconPosition="left" buttons={[firstAction, ...otherActions]} />}
      {next && (
        <Box>
          <DsfrLink href={next.href} size="sm" arrow="right">
            {next.label}
          </DsfrLink>
          {next.hint && <Typography sx={{ m: 0, fontSize: "12px", color: "var(--text-mention-grey)" }}>{next.hint}</Typography>}
        </Box>
      )}
    </Box>
  )
}
