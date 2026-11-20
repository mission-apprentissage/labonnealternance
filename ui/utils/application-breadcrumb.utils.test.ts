import { ApplicationIntention } from "shared/constants/application"
import { describe, expect, it } from "vitest"
import { getApplicationPages, getApplicationReplyBreadcrumb } from "./application-breadcrumb.utils"

describe("getApplicationPages", () => {
  it("donne les pages de candidatures du recruteur", () => {
    const pages = getApplicationPages({ job_id: "job1" })
    expect(pages.applications.getPath()).toBe("/espace-pro/entreprise/offre/job1/candidatures")
    expect(pages.detail("app1").getPath()).toBe("/espace-pro/entreprise/offre/job1/candidature/app1")
    expect(pages.reply("app1", ApplicationIntention.REFUS).getPath()).toBe("/espace-pro/entreprise/offre/job1/candidature/app1/repondre/refus")
  })

  it("donne les pages de candidatures du CFA pour l'entreprise qu'il gère", () => {
    const pages = getApplicationPages({ job_id: "job1", cfaEstablishmentId: "est1", establishmentName: "Entreprise A" })
    expect(pages.parents.map((page) => page.title)).toEqual(["Accueil CFA", "Entreprise A"])
    expect(pages.applications.getPath()).toBe("/espace-pro/cfa/entreprise/est1/offre/job1/candidatures")
    expect(pages.detail("app1").getPath()).toBe("/espace-pro/cfa/entreprise/est1/offre/job1/candidature/app1")
    expect(pages.reply("app1", ApplicationIntention.ENTRETIEN).getPath()).toBe("/espace-pro/cfa/entreprise/est1/offre/job1/candidature/app1/repondre/entretien")
  })
})

describe("getApplicationReplyBreadcrumb", () => {
  it("mène de l'accueil au formulaire en passant par la candidature", () => {
    const pages = getApplicationReplyBreadcrumb({ job_id: "job1", application_id: "app1", intention: ApplicationIntention.REFUS, applicantName: "Prénom NOM" })
    expect(pages.map((page) => page.title)).toEqual(["Entreprise", "Candidatures", "Prénom NOM", "Répondre au candidat"])
  })
})
