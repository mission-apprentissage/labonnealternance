import { Download } from "lba-ds"

export const ContratType = () => (
  <div style={{ maxWidth: 480 }}>
    <Download label="Modèle de contrat d'apprentissage (Cerfa)" details="PDF – 245 Ko" linkProps={{ href: "/documents/cerfa-contrat-apprentissage.pdf" }} />
  </div>
)

export const GuideRecruteur = () => (
  <div style={{ maxWidth: 480 }}>
    <Download label="Guide de l'employeur — recruter en alternance" details="PDF – 1,2 Mo" linkProps={{ href: "/documents/guide-employeur-alternance.pdf" }} />
  </div>
)

export const ExportCandidatures = () => (
  <div style={{ maxWidth: 480 }}>
    <Download label="Export des candidatures reçues" details="CSV – 32 Ko" linkProps={{ href: "/espace-recruteur/candidatures/export.csv" }} />
  </div>
)
