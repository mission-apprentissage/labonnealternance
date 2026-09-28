import { SegmentedControl } from "lba-ds"

export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <SegmentedControl
      legend="Vue des résultats de recherche"
      segments={[
        { label: "Liste", nativeInputProps: { defaultChecked: true } },
        { label: "Carte", nativeInputProps: {} },
      ]}
    />
  </div>
)

export const WithIcons = () => (
  <div style={{ maxWidth: 480 }}>
    <SegmentedControl
      legend="Type de résultat affiché"
      segments={[
        { label: "Offres", iconId: "fr-icon-briefcase-line", nativeInputProps: { defaultChecked: true } },
        { label: "Formations", iconId: "fr-icon-book-2-line", nativeInputProps: {} },
        { label: "Entreprises", iconId: "fr-icon-hotel-line", nativeInputProps: {} },
      ]}
    />
  </div>
)

export const Small = () => (
  <div style={{ maxWidth: 480 }}>
    <SegmentedControl
      legend="Statut des candidatures"
      small
      segments={[
        { label: "En attente", nativeInputProps: { defaultChecked: true } },
        { label: "Acceptées", nativeInputProps: {} },
        { label: "Refusées", nativeInputProps: {} },
      ]}
    />
  </div>
)

export const InlineLegend = () => (
  <div style={{ maxWidth: 480 }}>
    <SegmentedControl
      legend="Rythme"
      inlineLegend
      segments={[
        { label: "Temps plein", nativeInputProps: { defaultChecked: true } },
        { label: "Partiel", nativeInputProps: {} },
      ]}
    />
  </div>
)
