import fs from "fs"
import * as stream from "stream"

import AWS from "aws-sdk"
import Boom from "boom"

import config from "../../config"
import { logger } from "../logger"

const { endpoint, region, bucket, accessKeyId, secretAccessKey } = config.s3

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
})

const repository: AWS.S3 = new AWS.S3({ endpoint, region })

export const s3Bucket = (bucketName: string) => ({
  file(fileKey: string) {
    return {
      readStream() {
        return repository.getObject({ Bucket: bucketName, Key: fileKey }).createReadStream()
      },
      async readAsString() {
        const response = await repository.getObject({ Bucket: bucketName, Key: fileKey }).promise()
        const errorOpt = response.$response.error
        if (errorOpt) {
          const newError = Boom.internal(`error while getting s3 file`, { key: fileKey, bucket: bucketName })
          newError.cause = errorOpt
          throw newError
        }
        return response.Body?.toString()
      },
      async write(options: Omit<AWS.S3.PutObjectRequest, "Key" | "Bucket">) {
        logger.info("writing s3 file:", { bucket: bucketName, key: fileKey })
        await repository.upload({ ...options, Key: fileKey, Bucket: bucketName }).promise()
      },
      async delete() {
        logger.info("deleting s3 file:", { bucket: bucketName, key: fileKey })
        const result = await repository.deleteObject({ Bucket: bucketName, Key: fileKey }).promise()
        const errorOpt = result.$response.error
        if (errorOpt) {
          const newError = Boom.internal(`error while deleting s3 file`, { key: fileKey, bucket: bucketName })
          newError.cause = errorOpt
          throw newError
        }
      },
    }
  },
})

export const getFileFromS3Bucket = ({ key }: { key: string }): stream.Readable => {
  return repository.getObject({ Bucket: bucket, Key: key }).createReadStream()
}

export const getFileSignedURL = async ({ key, expireInSeconds = 120 }: { key: string; expireInSeconds?: number }): Promise<string> => {
  return await repository.getSignedUrl("getObject", { Bucket: bucket, Key: key, Expires: expireInSeconds })
}

interface IUploadParams {
  Key: string
  Body: Buffer
  Bucket: string
  [key: string]: any
}

export const uploadFileToS3 = async ({ key, filePath, noCache = false }: { key: string; filePath: string; noCache?: boolean }) => {
  const blob = fs.readFileSync(filePath)

  const params: IUploadParams = {
    Key: key,
    Body: blob,
    Bucket: bucket,
  }

  if (noCache) {
    params.CacheControl = "no-cache, no-store, must-revalidate"
  }

  await repository.upload(params).promise()
}

export const getS3FileLastUpdate = async ({ key }: { key: string }): Promise<Date> => {
  const headResponse = await repository
    .headObject({
      Key: key,
      Bucket: bucket,
    })
    .promise()

  if (headResponse.LastModified) {
    return new Date(headResponse.LastModified)
  } else {
    throw new Error(`getS3FileLastUpdate failed to fetch`)
  }
}
