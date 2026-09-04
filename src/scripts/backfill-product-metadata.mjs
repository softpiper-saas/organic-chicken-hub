import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const categories = [
  ["Chicken", "chicken", "Chicken and poultry products"],
  ["Egg", "egg", "Egg products"],
  ["Fish", "fish", "Fish and seafood products"],
  ["Lentil", "lentil", "Dal, lentils, and pulses"],
  ["Nuts", "nuts", "Nuts and nut products"],
  ["Seeds", "seeds", "Seeds and seed mixes"],
  ["Dairy", "dairy", "Milk, yogurt, and other dairy products"],
  ["Beef", "beef", "Beef products"],
];

function originFromUrl(value) {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

async function main() {
  for (const [name, slug, description] of categories) {
    await sql`
      INSERT INTO product_categories (name, slug, description)
      VALUES (${name}, ${slug}, ${description})
      ON CONFLICT (slug) DO NOTHING
    `;
  }

  const products = await sql`
    SELECT DISTINCT vendor, url
    FROM products
    WHERE vendor IS NOT NULL AND url IS NOT NULL
  `;

  for (const product of products) {
    await sql`
      INSERT INTO vendors (name, url, category, delivery_area)
      VALUES (${product.vendor}, ${originFromUrl(product.url)}, 'chicken', 'Bangladesh')
      ON CONFLICT (url) DO NOTHING
    `;
  }

  await sql`
    UPDATE products
    SET
      category = COALESCE(category, 'chicken'),
      food_type = COALESCE(food_type, 'chicken'),
      normalized_price_per_kg = COALESCE(normalized_price_per_kg, price),
      in_stock = COALESCE(in_stock, true),
      nutrition_verified = true
    WHERE category IS NULL
      OR food_type IS NULL
      OR normalized_price_per_kg IS NULL
      OR nutrition_verified = false
  `;

  await sql`
    UPDATE products
    SET category_id = product_categories.id
    FROM product_categories
    WHERE products.category_id IS NULL
      AND products.category = product_categories.slug
  `;

  await sql`
    UPDATE products
    SET vendor_id = vendors.id
    FROM vendors
    WHERE products.vendor_id IS NULL
      AND products.vendor = vendors.name
  `;

  await sql`
    INSERT INTO price_history (product_id, price, recorded_at)
    SELECT products.id, products.price, COALESCE(products.last_scraped_at, products.created_at, now())
    FROM products
    WHERE NOT EXISTS (
      SELECT 1
      FROM price_history
      WHERE price_history.product_id = products.id
    )
  `;

  const [{ count }] = await sql`SELECT count(*)::int FROM products`;
  console.log(`Backfilled product metadata for ${count} products.`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
