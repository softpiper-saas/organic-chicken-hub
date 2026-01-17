import "dotenv/config";
import { scrapeProducts } from "../lib/scraper";

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log("Seeding database...");
  try {
    const results = await scrapeProducts();
    console.log("Seeding complete!", results);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
  process.exit(0);
}

main();
