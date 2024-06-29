import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  const stats = await db.collection("userrecruteurs").updateMany(
    {
      first_name: null,
      last_name: null,
    },
    [
      {
        $set: {
          first_name: {
            $arrayElemAt: [
              {
                $split: [
                  {
                    $arrayElemAt: [{ $split: ["$email", "@"] }, 0],
                  },
                  ".",
                ],
              },
              0,
            ],
          },
          last_name: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $split: [
                      {
                        $arrayElemAt: [{ $split: ["$email", "@"] }, 0],
                      },
                      ".",
                    ],
                  },
                  1,
                ],
              },
              "",
            ],
          },
        },
      },
    ],
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20231018202702-user-recruiter-first-last-name", stats)
}
