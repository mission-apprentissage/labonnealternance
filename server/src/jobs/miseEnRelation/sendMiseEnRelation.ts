import dayjs from "dayjs"
import { ObjectId } from "mongodb"
import { JOB_STATUS } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { getNearEtablissementsFromRomes } from "@/services/catalogue.service"
import mailer from "@/services/mailer.service"

export const sendMiseEnRelation = async () => {
  const fromDate = new Date(new Date().setDate(new Date().getDate() - 45))
  const toDate = new Date(new Date().setDate(new Date().getDate() - 5))

  const jobsWihoutEnoughApplications = (await getDbCollection("jobs")
    .aggregate([
      {
        $match: {
          job_creation_date: {
            $gte: fromDate,
            $lte: toDate,
          },
          job_status: JOB_STATUS.ACTIVE,
          $or: [
            {
              job_mer_sent: null,
            },
            {
              job_mer_sent: {
                $exists: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "jobId",
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
          $and: [
            {
              application_count: {
                $lt: 15,
              },
            },
          ],
        },
      },
      {
        $project: {
          jobId: 1,
          application_count: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          geo_coordinates: 1,
          job_creation_date: 1,
          offer_title_custom: 1,
          job_type: 1,
          job_level_label: 1,
          job_start_date: 1,
          rome_appellation_label: 1,
          rome_label: 1,
          rome_code: 1,
        },
      },
    ])
    .toArray()) as {
    jobId: string
    application_count: number
    first_name: string
    last_name: string
    email: string
    job_creation_date: Date
    geo_coordinates: string
    offer_title_custom: string
    rome_appellation_label: string
    job_type: string[]
    job_level_label: string
    job_start_date: Date
    rome_label: string
    rome_code: string[]
  }[]

  await asyncForEach(
    jobsWihoutEnoughApplications,
    async (job: {
      jobId: string
      application_count: number
      first_name: string
      last_name: string
      email: string
      job_creation_date: Date
      geo_coordinates: string
      offer_title_custom: string
      rome_appellation_label: string
      job_type: string[]
      job_level_label: string
      job_start_date: Date
      rome_label: string
      rome_code: string[]
    }) => {
      console.log(job)

      const etablissements = await getNearEtablissementsFromRomes({
        rome: job.rome_code,
        origin: {
          latitude: parseFloat(job.geo_coordinates.split(",")[0]),
          longitude: parseFloat(job.geo_coordinates.split(",")[1]),
        },
        limit: 1,
      })

      console.log("etablissements", etablissements.length)

      if (etablissements.some((etablissement) => etablissement.distance_en_km < 100)) {
        console.log("envoi mail")
        // TODO : envoyer le mail

        const jobTitle = job.offer_title_custom || job.rome_appellation_label || job.rome_label
        const jobUrl = new URL(`${config.publicUrl}/emploi/${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}/${job.jobId}/${encodeURIComponent(jobTitle)}`)
        await mailer.sendEmail({
          to: job.email,
          subject: "Partagez votre offre aux CFA proches de votre établissement",
          template: getStaticFilePath("./templates/mail-mer-invitation.mjml.ejs"),
          data: {
            first_name: job.first_name,
            last_name: job.last_name,
            job_creation_date: dayjs(job.job_creation_date).format("DD/MM/YYYY"),
            job_title: jobTitle,
            job_type: job.job_type.join(", "),
            job_level_label: job.job_level_label,
            job_start_date: dayjs(job.job_start_date).format("DD/MM/YYYY"),
            job_url: jobUrl.toString(),
            // ...(await getMailData(candidate, appointment, eligibleTrainingsForAppointment, referrerObj)),
            // link: createRdvaAppointmentIdPageLink(appointment.cfa_recipient_email, etablissement.formateur_siret, etablissement._id.toString(), appointment._id.toString()),
            images: {
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
              logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            },
          },
        })
      }

      const jobId = new ObjectId(job.jobId)
      await getDbCollection("recruiters").updateOne(
        { "jobs._id": jobId },
        {
          $set: {
            "jobs.$[elem].mer_sent": new Date(),
          },
        },
        { arrayFilters: [{ "elem._id": jobId }] }
      )
    }
  )
}
