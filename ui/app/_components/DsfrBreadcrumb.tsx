"use client"

// useId() en Server Component repart de zéro à chaque requête RSC : l'id du collapse se répète d'une page à l'autre et le bouton visible pilote la copie masquée par <Activity> (cf. zone-ids.ts, #6082).
export { Breadcrumb as DsfrBreadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb"
