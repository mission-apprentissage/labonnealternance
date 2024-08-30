import fs from "fs"
import * as stream from "stream"

import { internal } from "@hapi/boom"
import AWS from "aws-sdk"
import { assertUnreachable } from "shared/utils"

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

type Bucket = "applications"

function getBucketName(bucket: Bucket) {
  switch (bucket) {
    case "applications":
      return config.s3.applicationsBucket
    default:
      assertUnreachable(bucket)
  }
}

export function s3ReadStream(bucket: Bucket, fileKey: string) {
  return repository.getObject({ Bucket: getBucketName(bucket), Key: fileKey }).createReadStream()
}

export async function s3ReadAsString(bucket: Bucket, fileKey: string): Promise<string | undefined> {
  const response = await repository.getObject({ Bucket: getBucketName(bucket), Key: fileKey }).promise()
  const errorOpt = response.$response.error
  if (errorOpt) {
    const newError = internal(`error while getting s3 file`, { key: fileKey, bucket: getBucketName(bucket) })
    newError.cause = errorOpt
    throw newError
  }
  return response.Body?.toString()
}

export async function s3Write(bucket: Bucket, fileKey: string, options: Omit<AWS.S3.PutObjectRequest, "Key" | "Bucket">) {
  const bucketName = getBucketName(bucket)
  logger.info("writing s3 file:", { bucket: bucketName, key: fileKey })
  await repository.upload({ ...options, Key: fileKey, Bucket: bucketName }).promise()
}

export async function s3Delete(bucket: Bucket, fileKey: string) {
  const bucketName = getBucketName(bucket)
  logger.info("deleting s3 file:", { bucket: bucketName, key: fileKey })
  const result = await repository.deleteObject({ Bucket: bucketName, Key: fileKey }).promise()
  const errorOpt = result.$response.error
  if (errorOpt) {
    const newError = internal(`error while deleting s3 file`, { key: fileKey, bucket: bucketName })
    newError.cause = errorOpt
    throw newError
  }
}

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
