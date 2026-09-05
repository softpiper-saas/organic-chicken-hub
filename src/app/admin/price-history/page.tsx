import { PriceHistoryManager } from "../_components/price-history-manager";

type PriceHistoryPageProps = {
  searchParams?: Promise<{
    productId?: string;
  }>;
};

export default async function PriceHistoryPage({ searchParams }: PriceHistoryPageProps) {
  const params = await searchParams;

  return <PriceHistoryManager initialProductId={params?.productId || ""} />;
}
