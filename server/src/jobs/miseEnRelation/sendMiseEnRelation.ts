import type { IUserWithAccount } from "shared"
import { JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import dayjs from "shared/helpers/dayjs"

import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import { createMERInvitationLink } from "@/services/appLinks.service"
import { getNearEtablissementsFromRomes } from "@/services/catalogue.service"
import { buildEstablishmentId } from "@/services/etablissement.service"
import mailer from "@/services/mailer.service"

type JobForMER = Pick<
  IJobsPartnersOfferPrivate,
  | "_id"
  | "workplace_geopoint"
  | "workplace_siret"
  | "created_at"
  | "offer_title"
  | "contract_type"
  | "offer_target_diploma"
  | "contract_start"
  | "offer_rome_appellation"
  | "offer_rome_codes"
  | "managed_by"
> & { user: IUserWithAccount }

export const sendMiseEnRelation = async () => {
  const fromDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
  const toDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)

  const counters: { errors: number; successSent: number; successNoCFA: number } = { errors: 0, successSent: 0, successNoCFA: 0 }

  const jobsWihoutEnoughApplications = (await getDbCollection("jobs_partners")
    .aggregate([
      {
        $match: {
          created_at: {
            $gte: fromDate,
            $lte: toDate,
          },
          is_delegated: false,
          offer_status: JOB_STATUS.ACTIVE,
          $or: [
            { mer_sent: null },
            {
              mer_sent: { $exists: false },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job_id",
          as: "applications",
        },
      },
      {
        $addFields: {
          application_count: {
            $size: "$applications",
          },
        },
      },
      {
        $match: {
          application_count: { $lt: 15 },
        },
      },
      {
        $lookup: {
          from: "userswithaccounts",
          localField: "managed_by",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          application_count: 1,
          workplace_geopoint: 1,
          workplace_siret: 1,
          created_at: 1,
          offer_title: 1,
          contract_type: 1,
          offer_target_diploma: 1,
          contract_start: 1,
          offer_rome_appellation: 1,
          offer_rome_codes: 1,
          managed_by: 1,
          user: 1,
        },
      },
    ])
    .toArray()) as JobForMER[]

  await asyncForEach(jobsWihoutEnoughApplications, async (job: JobForMER) => {
    try {
      const [longitude, latitude] = job.workplace_geopoint.coordinates
      const etablissements = await getNearEtablissementsFromRomes({
        rome: job.offer_rome_codes,
        origin: {
          latitude,
          longitude,
        },
        limit: 1,
      })

      if (etablissements.some((etablissement) => etablissement.distance_en_km < 100)) {
        const jobTitle = job.offer_title
        const jobUrl = new URL(`${config.publicUrl}/emploi/${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}/${job._id}/${encodeURIComponent(jobTitle)}`)
        const { user, workplace_siret } = job
        if (!user || !jobTitle || !workplace_siret) {
          throw new Error(`Data not found for send MER invitation. jobId=${job._id}`)
        }
        const establishmentId = buildEstablishmentId(user._id, workplace_siret)
        await mailer.sendEmail({
          to: user.email,
          subject: "Partagez votre offre aux CFA proches de votre établissement",
          template: getStaticFilePath("./templates/mail-mer-invitation.mjml.ejs"),
          data: {
            first_name: user.first_name,
            last_name: user.last_name,
            job_creation_date: dayjs(job.created_at).format("DD/MM/YYYY"),
            job_title: jobTitle,
            job_type: job.contract_type.join(", "),
            job_level_label: job.offer_target_diploma,
            job_start_date: dayjs(job.contract_start).format("DD/MM/YYYY"),
            job_url: jobUrl.toString(),
            link: createMERInvitationLink(user, job._id.toString(), establishmentId),
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
              logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            },
            publicEmail: config.publicEmail,
          },
        })
        counters.successSent++
      } else {
        counters.successNoCFA++
      }

      const jobId = job._id
      await getDbCollection("jobs_partners").updateOne(
        { _id: jobId },
        {
          $set: {
            mer_sent: new Date(),
          },
        }
      )
    } catch (error) {
      logger.error(new Error(`Error while sending MER invitation. jobId=${job._id} error=${error}`))
      counters.errors++
    }
  })

  await notifyToSlack({
    error: counters.errors > 0 ? true : false,
    subject: "Invitations Mise en relation envoyées",
    message: `Offres concernées : ${jobsWihoutEnoughApplications.length}\r\nErreurs : ${counters.errors}\r\nInvitations envoyées : ${counters.successSent}\r\nOffres sans CFA proches : ${counters.successNoCFA}`,
  })
}
