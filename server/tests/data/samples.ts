import { referrers } from "../../src/common/model/constants/referrers.js"

const sampleAppointment = {
  id_rco_formation: "21_114876|21_114876|106291",
  candidat_id: "91a370e6-3eb1-4e09-80f0-b7cc6be84fac",
  etablissement_id: "2828558M",
  formation_id: "68769673",
  motivations: "TEST MOTIVATION",
  referrer: referrers.LBA.name,
}

const sampleUpdateAppointment = {
  candidat_id: "77a370e6-3eb1-4e09-80f0-b7cc6be84fac",
  etablissement_id: "9998558M",
  formation_id: "68769999",
  motivations: "TEST MOTIVATION UPDATE",
  referrer: referrers.PARCOURSUP.name,
}

const sampleParameter = {
  code_postal: "75000",
  etablissement_siret: "32922456200234",
  etablissement_raison_sociale: "TEST RAISON SOCIALE",
  formation_intitule: "Test Formation",
  formation_cfd: "26033206",
  email_rdv: "testContact@prdv.fr",
  id_rco_formation: "14_AF_0000091719|14_SE_0000494236|18894",
  cle_ministere_educatif: "064256P01111968000310005219680003100052-68287#L01",
  id_parcoursup: "12345",
  referrers: [referrers.LBA.code, referrers.PARCOURSUP.code],
}

const sampleUpdateParameter = {
  code_postal: "75000",
  etablissement_siret: "32922456299999",
  etablissement_raison_sociale: "UPDATE RAISON SOCIALE",
  formation_intitule: "Update Formation",
  formation_cfd: "260999999",
  email_rdv: "updateMail@prdv.fr",
  id_rco_formation: "15_554095|15_1117617|106339",
  cle_ministere_educatif: "064256P01111968000310005219680001100052-68287#L01",
  referrers: [referrers.PARCOURSUP.code],
}

const sampleParameters = [
  {
    etablissement_siret: "32922456200234",
    etablissement_raison_sociale: "TEST RAISON SOCIALE",
    formation_intitule: "Test Formation",
    formation_cfd: "26033206",
    email_rdv: "testContact@prdv.fr",
    id_rco_formation: "15_554095|15_1117617|106339",
    cle_ministere_educatif: "064256P01211968000110005219680001100052-68287#L01",
    referrers: [referrers.LBA.code],
  },
  {
    etablissement_siret: "32922456200235",
    etablissement_raison_sociale: "TEST RAISON SOCIALE 2",
    formation_intitule: "Test Formation 2",
    formation_cfd: "26033205",
    email_rdv: "testContact2@prdv.fr",
    id_rco_formation: "15_554095|15_1117617|12345",
    cle_ministere_educatif: "06434P01211968000110005219680001100052-68287#L01",
    referrers: [referrers.PARCOURSUP.code],
  },
]

export { sampleParameter, sampleUpdateParameter, sampleParameters, sampleAppointment, sampleUpdateAppointment }
