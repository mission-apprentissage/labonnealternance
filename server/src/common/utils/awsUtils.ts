// @ts-nocheck
import AWS from "aws-sdk"
import fs from "fs"
import config from "../../config.js"

const endPoint = config.s3.endpoint
const region = config.s3.region
const defaultBucket = config.s3.bucket
const accessKeyId = config.s3.accessKeyId
const secretAccessKey = config.s3.secretAccessKey

AWS.config.update({
  accessKeyId,
  secretAccessKey,
})

const defaultRepository = new AWS.S3({ endpoint: endPoint, region: region })

export const getFileFromS3Bucket = ({ repository = defaultRepository, bucket = defaultBucket, key }) => {
  return repository.getObject({ Bucket: bucket, Key: key }).createReadStream()
}

export const uploadFileToS3 = async ({ repository = defaultRepository, bucket = defaultBucket, key, filePath }) => {
  const blob = fs.readFileSync(filePath)

  await repository
    .upload({
      Key: key,
      Body: blob,
      Bucket: bucket,
    })
    .promise()
}
