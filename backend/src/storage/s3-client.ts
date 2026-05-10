import { S3Client } from "@aws-sdk/client-s3";

import type { AppConfig } from "../config.js";

let cachedClient: S3Client | null = null;
let cachedKey = "";

function configKey(config: AppConfig): string {
  return [
    config.s3Endpoint ?? "",
    config.s3Region,
    config.s3AccessKeyId ?? "",
    config.s3SecretAccessKey ?? "",
    config.s3ForcePathStyle ? "1" : "0",
  ].join("|");
}

export function getS3Client(config: AppConfig): S3Client {
  const key = configKey(config);
  if (cachedClient && cachedKey === key) {
    return cachedClient;
  }

  const credentials =
    config.s3AccessKeyId && config.s3SecretAccessKey
      ? {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3SecretAccessKey,
        }
      : undefined;

  cachedClient = new S3Client({
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    forcePathStyle: config.s3ForcePathStyle,
    credentials,
  });
  cachedKey = key;
  return cachedClient;
}

export function resetS3Client(): void {
  cachedClient = null;
  cachedKey = "";
}
