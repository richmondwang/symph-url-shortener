export interface ShortURL {
  url: string;
  slug: string;
  createdAt: Date;
  createdBy?: string;
  expireAt?: Date;
  utms?: Record<string, any>;
  trackClicks?: boolean;
  redirectCount?: number;
}
