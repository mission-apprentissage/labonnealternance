import { z } from "zod"

export const ZPassJob = z
  .object({
    title: z.string().nullish(),
    link: z.string().nullish(),
    description: z.string().nullish(),
    author: z.string().nullish(),
    pubDate: z.string().nullish(),
    "dc:identifier": z.string(),
    "dc:description": z.string().nullish(),
    "dc:publisher": z.string().nullish(),
    "dc:contributor": z.string().nullish(),
    "dc:date": z.string().nullish(),
    "dc:type": z.string().nullish(),
    "dc:format": z.string().nullish(),
    "dc:coverage": z.string().nullish(),
  })
  .passthrough()

export type IPassJob = z.output<typeof ZPassJob>

// export const passJobToJobsPartners = (job: IPassJob): IComputedJobsPartners => {
// const {} = job

// const created_at = new Date()
// const partnerJob: IComputedJobsPartners = {}
// return partnerJob
// }

// const parseDate = (dateStr: string | null | undefined) => {
//   if (!dateStr) {
//     return null
//   }
//   return dayjs.tz(dateStr).toDate()
// }
