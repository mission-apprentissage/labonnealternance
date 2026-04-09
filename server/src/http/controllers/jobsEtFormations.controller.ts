import { internal } from "@hapi/boom"
import type { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"
import { parseEnumOrError, zRoutes } from "shared"
import { allLbaItemType, allLbaItemTypeOLD, LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, oldItemTypeToNewItemType } from "shared/constants/lbaitem"
import { INiveauDiplomeEuropeen, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { ILbaItemFtJob, ILbaItemPlace } from "shared/models/lbaItem.model"
import { partition } from "@/common/utils/array"
import { getDistanceInKm } from "@/common/utils/geolib"
import { trackApiCall } from "@/common/utils/sendTrackingEvent"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import type { Server } from "@/http/server"
import { getFormationsQuery } from "@/services/formation.service"
import { getJobsFromApiPrivate } from "@/services/jobs/jobOpportunity/jobOpportunity.service"
import { jobsEtFormationsQueryValidator } from "@/services/queryValidator.service"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/v1/jobsEtFormations",
    {
      schema: zRoutes.get["/v1/jobsEtFormations"],
      config,
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, rncp, caller, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl, options } = req.query

      const parameterControl = await jobsEtFormationsQueryValidator({
        romes,
        rncp,
        referer,
        caller,
        ...(latitude ? { latitude } : {}),
        ...(longitude ? { longitude } : {}),
        radius,
        insee,
        sources,
        diploma: INiveauDiplomeEuropeen.fromParam(diploma),
        opco,
        opcoUrl,
      })

      if ("error" in parameterControl) {
        if (parameterControl.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }

        return res.send(parameterControl)
      }

      const oldItemSources = sources ? sources.split(",").map((source) => parseEnumOrError(LBA_ITEM_TYPE_OLD, source)) : allLbaItemTypeOLD
      const itemSources = oldItemSources.map(oldItemTypeToNewItemType)
      const hasSomeApiTag = allLbaItemType.filter((x) => x !== LBA_ITEM_TYPE.FORMATION).some((apiTag) => itemSources.includes(apiTag))
      const hasFTJobs = oldItemSources.includes(LBA_ITEM_TYPE_OLD.PE) || oldItemSources.includes(LBA_ITEM_TYPE_OLD.PEJOB)

      const [formations, rawJobs] = await Promise.all([
        itemSources.includes(LBA_ITEM_TYPE.FORMATION)
          ? getFormationsQuery({
              romes: parameterControl.romes,
              ...(latitude ? { latitude: latitude } : {}),
              ...(longitude ? { longitude: longitude } : {}),
              radius,
              diploma: INiveauDiplomeEuropeen.fromParam(diploma),
              caller,
              options,
              referer,
              api: "jobEtFormationV1",
              isMinimalData: false,
            })
          : null,
        hasSomeApiTag
          ? getJobsFromApiPrivate({
              latitude,
              longitude,
              opco,
              radius: radius ?? 200,
              romes: parameterControl.romes,
              diploma: INiveauDiplomeEuropeen.fromParam(diploma),
              api: "/v1/jobsEtFormations",
              caller: caller ?? "unknown",
              isMinimalData: false,
            })
          : null,
      ])

      const isFilteredByDistance = Boolean(latitude && longitude)
      const radiusFilter = radius ?? 200

      const isValidJobPartner = (place: ILbaItemPlace): { valid: boolean; distance?: number } => {
        const { longitude: jobLongitude, latitude: jobLatitude } = place
        const distance =
          latitude && longitude && jobLongitude && jobLatitude
            ? getDistanceInKm({
                origin: { latitude, longitude },
                destination: { longitude: jobLongitude, latitude: jobLatitude },
              })
            : null
        if (distance === null || distance > radiusFilter) {
          return { valid: false }
        }
        return { valid: true, distance }
      }

      if ((hasSomeApiTag && !rawJobs) || (rawJobs && !("lbaJobs" in rawJobs))) {
        sentryCaptureException(rawJobs)
        throw internal(rawJobs?.error ?? "Unknown error")
      }

      const { lbaCompanies: lbaCompaniesRaw = null, lbaJobs: lbaJobsRaw = null, partnerJobs: partnerJobsRaw = null } = rawJobs ?? {}
      let lbaCompaniesArray: ILbaItemLbaCompany[] = lbaCompaniesRaw && "results" in lbaCompaniesRaw ? lbaCompaniesRaw.results : []
      let lbaJobsArray: ILbaItemLbaJob[] = (lbaJobsRaw && "results" in lbaJobsRaw ? lbaJobsRaw.results : []) as ILbaItemLbaJob[]
      let partnerJobsArray: ILbaItemPartnerJob[] = partnerJobsRaw && "results" in partnerJobsRaw ? partnerJobsRaw.results : []

      if (isFilteredByDistance) {
        const flatMapFct = <T extends ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemPartnerJob>(job: T): T[] => {
          const { place } = job
          if (!place) {
            return []
          }
          const { valid, distance } = isValidJobPartner(place)
          if (!valid) {
            return []
          }
          Object.assign(place, { distance })
          return [job]
        }
        lbaCompaniesArray = lbaCompaniesArray.flatMap(flatMapFct)
        lbaJobsArray = lbaJobsArray.flatMap(flatMapFct)
        partnerJobsArray = partnerJobsArray.flatMap(flatMapFct)
      }

      const { match: partnerJobsFT, notMatch: finalPartnerJobs } = partition(
        partnerJobsArray,
        (job) => job.job.partner_label === JOBPARTNERS_LABEL.FRANCE_TRAVAIL || job.job.partner_label === JOBPARTNERS_LABEL.FRANCE_TRAVAIL_CEGID
      )

      const ftJobs: ILbaItemFtJob[] = partnerJobsFT.map((partnerJob) => {
        const { id, title, contact, place, company, job, romes, nafs } = partnerJob

        const ftJob: ILbaItemFtJob = {
          id,
          title,
          contact,
          place,
          company,
          url: contact?.url,
          job,
          romes,
          nafs,
          ideaType: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES,
        }
        return ftJob
      })

      const jobs = {
        peJobs: hasFTJobs ? { results: ftJobs } : null,
        matchas: lbaJobsRaw ? { results: lbaJobsArray } : null,
        lbaCompanies: lbaCompaniesRaw ? { results: lbaCompaniesArray } : null,
        lbbCompanies: null,
        partnerJobs: partnerJobsRaw ? { results: finalPartnerJobs } : null,
      }

      if (caller) {
        let job_count = 0
        if (jobs && "lbaCompanies" in jobs && jobs.lbaCompanies && "results" in jobs.lbaCompanies) {
          job_count += jobs.lbaCompanies.results.length
        }

        if (jobs && "peJobs" in jobs && jobs.peJobs && "results" in jobs.peJobs) {
          job_count += jobs.peJobs.results.length
        }

        if (jobs && "matchas" in jobs && jobs.matchas && "results" in jobs.matchas) {
          job_count += jobs.matchas.results.length
        }

        if (jobs && "partnerJobs" in jobs && jobs.partnerJobs && "results" in jobs.partnerJobs) {
          job_count += jobs.partnerJobs.results.length
        }

        const training_count = formations && "results" in formations ? formations.results.length : 0

        // biome-ignore lint/nursery/noFloatingPromises: migration
        trackApiCall({
          caller,
          api_path: "jobEtFormationV1",
          training_count,
          job_count,
          result_count: job_count + training_count,
          response: "OK",
        })
      }

      return res.status(200).send({ formations, jobs })
    }
  )
}
