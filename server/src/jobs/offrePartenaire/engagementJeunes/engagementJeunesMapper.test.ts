import { beforeEach, describe, expect, it, vi } from "vitest"
import omit from "lodash-es/omit"
import type { IEngagementJeunesJob } from "./engagementJeunesMapper"
import { engagementJeunesJobToJobsPartners } from "./engagementJeunesMapper"

const now = new Date("2024-07-21T04:49:06.000+02:00")

describe("engagementJeunesJobToJobsPartners", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    return () => {
      vi.useRealTimers()
    }
  })

  const engagementJeunesJob: IEngagementJeunesJob = {
    id: 34161720,
    creation_date: new Date("2025-12-10"),
    title: "Agent de tri en alternance (F/H)",
    mission:
      "L'Activité Recyclage et Valorisation des Déchets de VEOLIA recherche un AGENT DE TRI EN ALTERNANCE pour son centre de tri automatisé de collectes sélectives des ménages (55 000 t/An) .\n\nSous la responsabilité du conducteur de ligne, l'agent de tri en alternance assure les missions suivantes :\n\n\t* il effectue les opérations de tri de la collecte sélective selon les consignes d'exploitation de la ligne de tri et les prescriptions techniques minimales, en veillant à la qualité du tri et à la productivité de la ligne\n\t* il assure le nettoyage de son poste de travail et des installations de tri\n\t* il fait part au conducteur de ligne de toutes les informations concernant l'exploitation, la sécurité et, de manière générale, tout événement particulier\n\t* il informe son supérieur hiérarchique de toute anomalie détectée sur site\n\t* il participe au nettoyage des machines\n\n",
    profil:
      "Vous préparez un CAP d'agent de propreté.\n\nVous êtes sérieux et rigoureux. Vous avez le sens des responsabilités et du travail en équipe.\n\nVous savez faire preuve d'adaptabilité et d'autonomie.\n",
    reference: "REF52802C",
    contrat: "Apprentissage",
    temps_partiel: false,
    niveau_diplome: "BEP-CAP-BPA",
    societe: "Veolia",
    description_societe:
      "Le groupe Veolia est la référence mondiale de la gestion optimisée des ressources. Présent sur les 5 continents avec 220 000 salariés, le Groupe conçoit et déploie des solutions utiles et concrètes pour la gestion de l'eau, des déchets et de l'énergie.  L'économie des   ressources est un enjeu majeur des prochaines années.  La gestion des déchets, aujourd’hui, c'est   46 millions d'habitants desservis, 61 millions de tonnes de déchets traités, 533 759 entreprises clientes, 823 unités de traitement exploitées. Notre expertise dans la  gestion des déchets nous permet de collecter, trier, traiter et valoriser chaque année des   millions   de tonnes de déchets ménagers et industriels. Nous développons des filières de valorisation qui permettent de réintroduire ces déchets dans de nouveaux cycles de consommation ou de production devenant ainsi de nouvelles ressources.\n",
    location_pays: "France",
    location_pays_code: "FR",
    location_departement: "GIRONDE",
    location_departement_code: "33",
    location_ville: "Bègles",
    location_cp: "33130",
    duree_contrat: 12,
    duree_contrat_unit: "months",
    application_url: "https://www.engagement-jeunes.com/fr/detail-offre/34161720/contrat-d-apprentissage-veolia-agent-de-tri-en-alternance-f-h.html",
  }

  it("should convert a job", () => {
    expect(omit(engagementJeunesJobToJobsPartners(engagementJeunesJob), ["_id"])).toMatchSnapshot()
  })
})
