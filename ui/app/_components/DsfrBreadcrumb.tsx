"use client"

// En Server Component, le useId() du collapse repart de zéro à chaque rendu RSC : la page gardée montée par <Activity> porte alors le même id et capte le clic du bouton (#6082).
export { Breadcrumb as DsfrBreadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb"
