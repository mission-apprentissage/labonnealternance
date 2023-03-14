// @ts-nocheck
import AWS from "aws-sdk"
import fs from "fs"
import config from "../../config.js"
import { logger } from "../logger.js"

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  region: "eu-west-3",
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
})

export const getFileFromS3 = (key) => {
  return s3.getObject({ Bucket: "mna-bucket", Key: key }).createReadStream()
}

export const getFileFromS3Bucket = ({ s3Repository, bucket, key }) => {
  return s3Repository.getObject({ Bucket: bucket, Key: key }).createReadStream()
}

export const downloadAndSaveFileFromS3 = (from, to) => {
  logger.info(`Downloading and save file from S3 Bucket...`)

  return new Promise((r) => {
    getFileFromS3(from)
      .pipe(fs.createWriteStream(to))
      .on("close", () => {
        r()
      })
  })
}

export const uploadFileToS3 = async ({ s3Repository, bucket, key, filePath }) => {
  const blob = fs.readFileSync(filePath)

  await s3Repository
    .upload({
      Key: key,
      Body: blob,
      Bucket: bucket,
    })
    .promise()
}
