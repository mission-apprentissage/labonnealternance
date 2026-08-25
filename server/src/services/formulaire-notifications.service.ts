import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { RECRUITER_USER_ORIGIN } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import type { IUserWithAccount } from "shared/models/user-with-account.model"
import { getStaticFilePath } from "@/common/utils/get-static-file-path"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sanitizeTextField } from "@/common/utils/string-utils"
import config from "@/config"
import { createViewDelegationLink } from "./app-links.service"
import { buildEstablishmentId } from "./etablissement.service"
import { buildLbaUrl } from "./jobs/job-opportunity/job-opportunity.service"
import mailer from "./mailer.service"

const getJobOrigin = async (userId: ObjectId) => {
  const userWithAccount = await getDbCollection("userswithaccounts").findOne({ _id: userId })
  return (userWithAccount && userWithAccount.origin && RECRUITER_USER_ORIGIN[userWithAccount.origin]) ?? "La bonne alternance"
}

/**
 * @description Sends the mail informing the CFA that a company wants the CFA to handle the offer.
 */
export async function sendDelegationMailToCFA(email: string, offre: IJobsPartnersOfferPrivate, siret: string) {
  const unsubscribeOF = await getDbCollection("unsubscribedofs").findOne({ establishment_siret: siret })
  if (unsubscribeOF) return

  const { managed_by, workplace_siret } = offre
  if (!managed_by) {
    throw new Error(`inattendu: managed_by vide pour l'offre avec id=${offre._id}`)
  }
  if (!workplace_siret) {
    throw new Error(`inattendu: workplace_siret vide pour l'offre avec id=${offre._id}`)
  }

  const jobOrigin = await getJobOrigin(managed_by)
  const establishment_id = buildEstablishmentId(managed_by, workplace_siret)

  await mailer.sendEmail({
    to: email,
    subject: `Une entreprise recrute dans votre domaine`,
    template: getStaticFilePath("./templates/mail-cfa-delegation.mjml.ejs"),
    data: {
      images: { logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`, logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true` },
      enterpriseName: offre.workplace_brand || offre.workplace_name || offre.workplace_legal_name,
      jobName: offre.offer_title,
      contractType: (offre.contract_type ?? []).join(", "),
      trainingLevel: offre.offer_target_diploma?.label ?? "Indifférent",
      startDate: dayjs(offre.contract_start).format("DD/MM/YYYY"),
      duration: offre.contract_duration,
      jobOrigin,
      offerButton:
        createViewDelegationLink(email, establishment_id, offre._id.toString(), siret) +
        "&utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_consulter-coord-entreprise",
      qrUrl: `${config.publicUrl}/espace-pro/offre/impression/${offre._id}?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_impression-offreutm_source=lba-phygital&utm_medium=phygital&utm_campaign=offre-phygital-sur-affiche`,
      createAccountButton: `${config.publicUrl}/organisme-de-formation?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_creer-compte`,
      policyUrl: `${config.publicUrl}/politique-de-confidentialite?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_politique-confidentialite`,
      publicEmail: config.publicEmail,
    },
  })
}

export async function sendMailNouvelleOffre(user: IUserWithAccount, job: IJobsPartnersOfferPrivate) {
  const isRecruteurAwaiting = job.offer_status === JOB_STATUS_ENGLISH.EN_ATTENTE
  if (isRecruteurAwaiting) {
    return
  }
  const { email, last_name, first_name } = user
  const { is_delegated, workplace_name, workplace_siret, cfa_siret, cfa_legal_name, workplace_legal_name, workplace_brand } = job
  const raisonSocialeEntreprise = workplace_name || workplace_legal_name || workplace_brand
  const establishmentTitle = workplace_name ?? workplace_siret
  // Send mail with action links to manage offers
  await mailer.sendEmail({
    to: email,
    subject: raisonSocialeEntreprise ? `Votre offre d'alternance pour ${raisonSocialeEntreprise} publiée` : "Votre offre d'alternance est publiée",
    template: getStaticFilePath("./templates/mail-nouvelle-offre.mjml.ejs"),
    data: {
      images: { logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`, logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true` },
      nom: sanitizeTextField(last_name),
      prenom: sanitizeTextField(first_name),
      raison_sociale: establishmentTitle,
      mandataire: is_delegated,
      offre: {
        rome_appellation_label: job.offer_rome_appellation,
        job_type: job.contract_type.join(", "),
        job_level_label: job.offer_target_diploma?.label ?? "Indifférent",
        job_start_date: dayjs(job.contract_start).format("DD/MM/YY"),
        job_title: job.offer_title,
      },
      cfa: {
        cfa_siret,
        cfa_legal_name,
      },
      entreprise: {
        raisonSocialeEntreprise,
        workplace_siret,
      },
      lba_url: buildLbaUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id, workplace_siret, job.offer_title),
      publicEmail: config.publicEmail,
    },
  })
}
