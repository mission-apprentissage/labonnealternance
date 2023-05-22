import * as stream from "stream"
import AWS from "aws-sdk"
import fs from "fs"
import config from "../../config.js"

const { endpoint, region, bucket, accessKeyId, secretAccessKey }: { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string } = config.s3

AWS.config.update({
  accessKeyId,
  secretAccessKey,
})

const repository: AWS.S3 = new AWS.S3({ endpoint, region })

export const getFileFromS3Bucket = ({ key }: { key: string }): stream.Readable => {
  return repository.getObject({ Bucket: bucket, Key: key }).createReadStream()
}

export const uploadFileToS3 = async ({ key, filePath }: { key: string; filePath: string }) => {
  const blob = fs.readFileSync(filePath)

  await repository
    .upload({
      Key: key,
      Body: blob,
      Bucket: bucket,
    })
    .promise()
}

export const getS3FileLastUpdate = async ({ key }: { key: string }): Promise<Date> => {
  const headResponse = await repository
    .headObject({
      Key: key,
      Bucket: bucket,
    })
    .promise()

  return new Date(headResponse.LastModified)
}
