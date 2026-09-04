import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const sources = [
  {
    url: "https://fishvally.com/collections/river-fish",
    vendorName: "Fish Vally",
    category: "fish",
    sourceType: "collection_page",
  },
  {
    url: "https://riverfish.com.bd/",
    vendorName: "RiverFish",
    category: "fish",
    sourceType: "collection_page",
  },
  {
    url: "https://ghorerbazar.com/collections/nuts-seeds",
    vendorName: "Ghorer Bazar",
    category: "nuts",
    sourceType: "collection_page",
  },
];

async function main() {
  for (const source of sources) {
    await sql`
      INSERT INTO scraping_configs (url, vendor_name, category, source_type, is_active)
      VALUES (${source.url}, ${source.vendorName}, ${source.category}, ${source.sourceType}, true)
      ON CONFLICT (url) DO UPDATE SET
        vendor_name = EXCLUDED.vendor_name,
        category = EXCLUDED.category,
        source_type = EXCLUDED.source_type,
        is_active = EXCLUDED.is_active
    `;
  }

  console.log(`Seeded ${sources.length} protein scraping sources.`);
}

main()
  .catch((error) => {
    console.error("Protein source seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
