/**
 * One time job due to route securizetion to resend delegation email with access token
 */

import { IJob, IRecruiter } from "shared"
import dayjs from "shared/helpers/dayjs"

import { UnsubscribeOF } from "../../../../common/model"
import { db } from "../../../../common/mongodb"
import { getStaticFilePath } from "../../../../common/utils/getStaticFilePath"
import config from "../../../../config"
import { createCfaUnsubscribeToken, createViewDelegationLink } from "../../../../services/appLinks.service"
import mailer from "../../../../services/mailer.service"

/**
 * @description Sends the mail informing the CFA that a company wants the CFA to handle the offer.
 */
export async function sendDelegationMailToCFAERRATUM(email: string, offre: IJob, recruiter: IRecruiter, siret_code: string) {
  const unsubscribeOF = await UnsubscribeOF.findOne({ establishment_siret: siret_code })
  if (unsubscribeOF) return
  const unsubscribeToken = createCfaUnsubscribeToken(email, siret_code)
  await mailer.sendEmail({
    to: email,
    subject: `Une entreprise recrute dans votre domaine`,
    template: getStaticFilePath("./templates/mail-cfa-delegation-erratum.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      enterpriseName: recruiter.establishment_raison_sociale,
      jobName: offre.rome_appellation_label,
      contractType: (offre.job_type ?? []).join(", "),
      trainingLevel: offre.job_level_label,
      startDate: dayjs(offre.job_start_date).format("DD/MM/YYYY"),
      duration: offre.job_duration,
      rhythm: offre.job_rythm,
      offerButton: createViewDelegationLink(email, recruiter.establishment_id, offre._id.toString(), siret_code),
      createAccountButton: `${config.publicUrl}/espace-pro/creation/cfa`,
      unsubscribeUrl: `${config.publicUrl}/espace-pro/proposition/formulaire/${recruiter.establishment_id}/offre/${offre._id}/siret/${siret_code}/unsubscribe?token=${unsubscribeToken}`,
    },
  })
}

export const resendDelegationEmailWithAccessToken = async () => {
  const startDate = dayjs("2023-11-01").toDate()
  const endDate = dayjs("2023-11-30").toDate()
  const recruiters: AsyncIterable<IRecruiter> = await db
    .collection("recruiters")
    .find({ createdAt: { $gte: startDate, $lt: endDate }, $nor: [{ jobs: { $exists: false } }, { jobs: { $size: 0 } }] })
    .toArray()
  for await (const recruiter of recruiters) {
    const { jobs }: { jobs: IJob[] } = recruiter
    for await (const job of jobs) {
      if (!job.delegations?.length) {
        break
      }
      for await (const delegation of job.delegations) {
        const { email, siret_code } = delegation
        await sendDelegationMailToCFAERRATUM(email, job, recruiter, siret_code)
      }
    }
  }
}
