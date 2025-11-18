/**
 * Storage Provider Interface
 *
 * Allows plugging in different storage backends (S3, R2, local filesystem).
 * Useful for file uploads, attachments, etc.
 */

export interface UploadOptions {
  key: string;
  data: Buffer | Blob;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface IStorageProvider {
  /**
   * Upload a file
   */
  upload(options: UploadOptions): Promise<{ url: string; key: string }>;

  /**
   * Delete a file
   */
  delete(key: string): Promise<void>;

  /**
   * Get a signed URL for temporary access
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Check if provider is healthy/available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Local filesystem storage provider (for development)
 */
export class LocalStorageProvider implements IStorageProvider {
  constructor(private basePath: string = "./uploads") {}

  async upload(options: UploadOptions): Promise<{ url: string; key: string }> {
    // TODO: Implement actual file write
    console.log(`[LocalStorage] Would upload file: ${options.key}`);
    return {
      url: `/uploads/${options.key}`,
      key: options.key,
    };
  }

  async delete(key: string): Promise<void> {
    console.log(`[LocalStorage] Would delete file: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return `/uploads/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

/**
 * S3-compatible storage provider
 */
export class S3StorageProvider implements IStorageProvider {
  constructor(
    private config: {
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
    }
  ) {}

  async upload(options: UploadOptions): Promise<{ url: string; key: string }> {
    // TODO: Implement actual S3 upload using AWS SDK
    console.log(`[S3Storage] Would upload to bucket ${this.config.bucket}: ${options.key}`);
    return {
      url: `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${options.key}`,
      key: options.key,
    };
  }

  async delete(key: string): Promise<void> {
    console.log(`[S3Storage] Would delete from bucket ${this.config.bucket}: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    // TODO: Generate actual signed URL
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}?X-Amz-Expires=${expiresIn}`;
  }

  async healthCheck(): Promise<boolean> {
    // TODO: Ping S3 bucket
    return true;
  }
}

/**
 * Storage provider registry
 */
class StorageProviderRegistry {
  private provider: IStorageProvider = new LocalStorageProvider();

  setProvider(provider: IStorageProvider): void {
    this.provider = provider;
  }

  getProvider(): IStorageProvider {
    return this.provider;
  }
}

export const storageRegistry = new StorageProviderRegistry();
