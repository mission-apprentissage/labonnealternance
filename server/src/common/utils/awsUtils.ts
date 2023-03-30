// @ts-nocheck
import AWS from "aws-sdk"
import fs from "fs"
import config from "../../config.js"

const { endpoint, region, bucket, accessKeyId, secretAccessKey } = config.s3

AWS.config.update({
  accessKeyId,
  secretAccessKey,
})

const repository = new AWS.S3({ endpoint, region })

export const getFileFromS3Bucket = ({ key }) => {
  return repository.getObject({ Bucket: bucket, Key: key }).createReadStream()
}

export const uploadFileToS3 = async ({ key, filePath }) => {
  const blob = fs.readFileSync(filePath)

  await repository
    .upload({
      Key: key,
      Body: blob,
      Bucket: bucket,
    })
    .promise()
}
