export type Config = {
  id: string;
  url: string;
  vendorName: string | null;
  category: string | null;
  sourceType: string | null;
  isActive: boolean;
  lastScrapedAt: string | null;
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  vendor: string;
  sourceConfigId: string | null;
  url: string;
  category: string | null;
  foodType: string | null;
  packageSize: number | null;
  packageUnit: string | null;
  normalizedPricePerKg: number | null;
  normalizedPricePerUnit: number | null;
  imageUrl: string | null;
  isOrganic: boolean | null;
  inStock: boolean | null;
  nutritionVerified: boolean | null;
};

export type ProductDraft = {
  name: string;
  description: string;
  price: string;
  vendor: string;
  url: string;
  category: string;
  foodType: string;
  packageSize: string;
  packageUnit: string;
  normalizedPricePerKg: string;
  normalizedPricePerUnit: string;
  imageUrl: string;
  isOrganic: boolean;
  inStock: boolean;
  nutritionVerified: boolean;
};

export type CategoryDraft = {
  name: string;
  slug: string;
  description: string;
};

export type PriceHistoryRow = {
  id: string;
  productId: string;
  price: number;
  recordedAt: string | null;
};

export type PriceHistoryDraft = {
  price: string;
  recordedAt: string;
};

export const emptyProductDraft: ProductDraft = {
  name: "",
  description: "",
  price: "",
  vendor: "",
  url: "",
  category: "chicken",
  foodType: "chicken",
  packageSize: "",
  packageUnit: "",
  normalizedPricePerKg: "",
  normalizedPricePerUnit: "",
  imageUrl: "",
  isOrganic: true,
  inStock: true,
  nutritionVerified: false,
};

export const emptyCategoryDraft: CategoryDraft = {
  name: "",
  slug: "",
  description: "",
};

export function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description || "",
    price: product.price.toString(),
    vendor: product.vendor,
    url: product.url,
    category: product.category || "chicken",
    foodType: product.foodType || "",
    packageSize: product.packageSize?.toString() || "",
    packageUnit: product.packageUnit || "",
    normalizedPricePerKg: product.normalizedPricePerKg?.toString() || "",
    normalizedPricePerUnit: product.normalizedPricePerUnit?.toString() || "",
    imageUrl: product.imageUrl || "",
    isOrganic: Boolean(product.isOrganic),
    inStock: product.inStock ?? true,
    nutritionVerified: Boolean(product.nutritionVerified),
  };
}

export function productPayload(draft: ProductDraft) {
  return {
    name: draft.name,
    description: draft.description,
    price: draft.price ? Number(draft.price) : null,
    vendor: draft.vendor,
    url: draft.url,
    category: draft.category,
    foodType: draft.foodType,
    packageSize: draft.packageSize ? Number(draft.packageSize) : null,
    packageUnit: draft.packageUnit,
    normalizedPricePerKg: draft.normalizedPricePerKg ? Number(draft.normalizedPricePerKg) : null,
    normalizedPricePerUnit: draft.normalizedPricePerUnit ? Number(draft.normalizedPricePerUnit) : null,
    imageUrl: draft.imageUrl,
    isOrganic: draft.isOrganic,
    inStock: draft.inStock,
    nutritionVerified: draft.nutritionVerified,
  };
}

export function dateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}
