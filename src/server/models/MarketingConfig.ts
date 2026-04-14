import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMarketingConfig extends Document {
  key: string;
  heroImageUrls: string[];
}

const MarketingConfigSchema = new Schema<IMarketingConfig>(
  {
    key: { type: String, required: true, unique: true },
    heroImageUrls: { type: [String], default: [] },
  },
  {
    collection: "marketing_config",
    versionKey: false,
  },
);

export const MarketingConfig: Model<IMarketingConfig> =
  mongoose.models.MarketingConfig ??
  mongoose.model<IMarketingConfig>("MarketingConfig", MarketingConfigSchema);

export const MARKETING_CONFIG_KEY = "site";
