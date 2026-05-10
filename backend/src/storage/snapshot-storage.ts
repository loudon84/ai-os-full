import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import type { AppConfig } from "../config.js";
import { getS3Client } from "./s3-client.js";

export interface SnapshotPutResult {
  bucket: string;
  key: string;
}

export class SnapshotStorage {
  private readonly client: S3Client;
  private readonly ensuredBuckets = new Set<string>();

  constructor(private readonly config: AppConfig, client?: S3Client) {
    this.client = client ?? getS3Client(config);
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (this.ensuredBuckets.has(bucket)) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err) {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      } catch (createErr) {
        if (createErr instanceof S3ServiceException) {
          const name = createErr.name;
          if (
            name === "BucketAlreadyOwnedByYou" ||
            name === "BucketAlreadyExists"
          ) {
            this.ensuredBuckets.add(bucket);
            return;
          }
        }
        void err;
        throw createErr;
      }
    }
    this.ensuredBuckets.add(bucket);
  }

  async putSnapshot(params: {
    bucket: string;
    key: string;
    payload: Buffer | Uint8Array;
    contentType?: string;
  }): Promise<SnapshotPutResult> {
    const { bucket, key, payload, contentType = "application/json" } = params;
    await this.ensureBucket(bucket);
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: payload,
        ContentType: contentType,
      }),
    );
    return { bucket, key };
  }

  async getSnapshot(params: {
    bucket: string;
    key: string;
  }): Promise<Buffer> {
    const { bucket, key } = params;
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    if (!response.Body) {
      throw new Error("Empty snapshot body from S3");
    }
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async deleteSnapshot(params: {
    bucket: string;
    key: string;
  }): Promise<void> {
    const { bucket, key } = params;
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  async objectExists(params: {
    bucket: string;
    key: string;
  }): Promise<boolean> {
    const { bucket, key } = params;
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return true;
    } catch (err) {
      if (err instanceof S3ServiceException) {
        const status = err.$metadata?.httpStatusCode;
        if (err.name === "NotFound" || status === 404) return false;
      }
      throw err;
    }
  }
}
