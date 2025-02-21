import { Readable } from "node:stream"

import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, PutObjectRequest, S3Client, S3ClientConfig } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { RequestPresigningArguments } from "@aws-sdk/types"
import { internal } from "@hapi/boom"
import { StreamingBlobPayloadInputTypes } from "@smithy/types"
import { assertUnreachable } from "shared/utils"

import config from "../../config"
import { logger } from "../logger"

const { endpoint, region, accessKeyId, secretAccessKey, bucket: s3Buckets } = config.s3
const configuration: S3ClientConfig = { credentials: { accessKeyId, secretAccessKey }, endpoint, region, forcePathStyle: true }
const s3Client = new S3Client(configuration)

type Bucket = "applications" | "storage"
function getBucketName(bucket: Bucket) {
  switch (bucket) {
    case "applications":
      return s3Buckets.application
    case "storage":
      return s3Buckets.storage
    default:
      assertUnreachable(bucket)
  }
}

export async function s3ReadAsStream(bucket: Bucket, key: string) {
  try {
    const object = await s3Client.send(new GetObjectCommand({ Bucket: getBucketName(bucket), Key: key }))
    const webStream = object.Body?.transformToWebStream()
    return Readable.fromWeb(webStream as any)
  } catch (error: any) {
    const newError = internal(`Error reading S3 file stream`, { key: key, bucket: getBucketName(bucket) })
    newError.cause = error.message
    throw newError
  }
}

export async function s3ReadAsString(bucket: Bucket, fileKey: string): Promise<string | undefined> {
  try {
    const object = await s3Client.send(new GetObjectCommand({ Bucket: getBucketName(bucket), Key: fileKey }))
    return object.Body?.transformToString()
  } catch (error: any) {
    const newError = internal(`Error reading S3 file string`, { key: fileKey, bucket: getBucketName(bucket) })
    newError.cause = error.message
    throw newError
  }
}

export async function s3WriteStream(bucket: Bucket, fileKey: string, options: Omit<Upload["params"], "Bucket" | "Key">) {
  const bucketName = getBucketName(bucket)
  try {
    logger.info("writing s3 file:", { bucket: bucketName, key: fileKey })
    const uploadResponse = new Upload({ client: s3Client, params: { Bucket: bucketName, Key: fileKey, ...options } })
    uploadResponse.on("httpUploadProgress", (progress) => logger.info(`File upload ${fileKey} to S3 in progress: ${JSON.stringify(progress)}`))
    await uploadResponse.done()
  } catch (error: any) {
    const newError = internal(`Error writing S3 file`, { key: fileKey, bucket: getBucketName(bucket) })
    newError.cause = error.message
    throw newError
  }
}

export async function s3WriteString(bucket: Bucket, fileKey: string, options: Omit<PutObjectRequest, "Body" | "Bucket" | "Key"> & { Body: StreamingBlobPayloadInputTypes }) {
  const bucketName = getBucketName(bucket)
  try {
    logger.info("writing s3 file:", { bucket: bucketName, key: fileKey })
    await s3Client.send(new PutObjectCommand({ Bucket: bucketName, Key: fileKey, ...options }))
  } catch (error: any) {
    const newError = internal(`Error writing S3 file`, { key: fileKey, bucket: getBucketName(bucket) })
    newError.cause = error.message
    throw newError
  }
}

export async function s3Delete(bucket: Bucket, fileKey: string) {
  const bucketName = getBucketName(bucket)
  try {
    logger.info("deleting s3 file:", { bucket: bucketName, key: fileKey })
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }))
  } catch (error: any) {
    const newError = internal(`error while deleting s3 file`, { key: fileKey, bucket: bucketName })
    newError.cause = error.message
    throw newError
  }
}

export const s3SignedUrl = async (bucket: Bucket, key: string, options: RequestPresigningArguments = {}) => {
  try {
    const url = getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), options)
    return url
  } catch (error: any) {
    const newError = internal(`error getting s3 file url`, { key, bucket })
    newError.cause = error.message
    throw newError
  }
}

export const getS3FileLastUpdate = async (bucket: Bucket, key: string): Promise<Date | null> => {
  const bucketName = getBucketName(bucket)
  try {
    const headResponse = await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
    return headResponse.LastModified ? new Date(headResponse.LastModified) : null
  } catch (error: any) {
    const newError = internal(`error getting s3 head object`, { key, bucketName })
    newError.cause = error.message
    throw newError
  }
}
