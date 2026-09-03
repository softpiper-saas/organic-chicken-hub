# Protein Budget Planner BD - Executable Product Plan

## Current Implementation Status

Last updated: 2026-09-03

Completed in the first execution pass:
- Phase 0 lint cleanup.
- Admin/scrape route protection with `src/proxy.ts`.
- `next.config.ts` image config migrated to `remotePatterns`.
- Scraper typing cleanup using Firecrawl's typed `scrapeUrl` path.
- Price history writes on product insert and price change.
- Static nutrition profiles.
- Protein target, calorie, budget, candidate-ranking, and plan-generation logic.
- `/protein-budget-planner` route.
- Planner form UI.
- Result panel with removable food items and recalculation.
- Homepage and navbar entry points.

Verified:
- `npm run lint` passes with no warnings.
- Dev server smoke test returned `200` for `/` and `/protein-budget-planner`.
- Unauthenticated `/admin/dashboard` returned `401`.

Not completed yet:
- Phase 2 database expansion for multi-food product metadata.
- Collection-page scraping for fish and nuts vendors.
- Admin nutrition mapping workflow.
- Saved plans, sharing, and analytics.
- Full production `next build` verification was attempted, but the command session became stale after the TypeScript phase while no live build process remained.

## 1. Product Decision

Build this as a new feature inside the existing Organic Foods Hub BD app, not as a separate app yet.

Reason:
- The current app already has the right foundation: Next.js, Drizzle, PostgreSQL, product scraping, admin URL management, product listing, and price comparison.
- The brand has already expanded from "Organic Chicken Hub" toward "Organic Foods Hub BD".
- The feature is adjacent to the current mission: helping Bangladesh consumers choose healthy food based on price, quality, and availability.
- A separate app should only be considered after validating user demand for budget-based diet planning.

Working feature name:

Protein Budget Planner BD

Core promise:

Given a user's body profile, goal, food preferences, and budget, recommend an affordable protein plan using real Bangladesh online food prices.

## 2. MVP Scope

The MVP should answer one question:

"How can I hit my daily protein target within my budget using foods I can buy online in Bangladesh?"

MVP includes:
- Body input form.
- Protein target calculation.
- Budget input.
- Food preference selection.
- Static nutrition database for common protein foods.
- Scraped product prices from existing and new vendor URLs.
- Daily diet plan suggestion.
- Remove or exclude a suggested food item.
- Recalculate plan after exclusions.
- Basic shopping list with vendor links.

MVP does not include:
- Medical advice.
- Disease-specific meal planning.
- Full calorie or micronutrient optimization.
- User accounts.
- Saved plans.
- Payment or ordering.
- AI-generated health claims.

## 3. Target Users

Primary:
- Bangladesh users who want enough protein but have a limited food budget.
- Fitness beginners who do not know how much protein they need.
- Families comparing chicken, fish, eggs, dal, nuts, and dairy prices.

Secondary:
- Organic food buyers who want premium options.
- Gym-goers who want cost per gram of protein.
- Content/SEO visitors searching for protein calculators in Bangladesh.

## 4. User Flow

### 4.1 Calculator Flow

1. User opens `/protein-budget-planner`.
2. User enters:
   - Age.
   - Gender.
   - Weight.
   - Height.
   - Activity level.
   - Goal.
   - Daily or monthly budget.
   - Preferred food categories.
   - Excluded foods.
3. System calculates:
   - BMR.
   - Estimated daily calories.
   - Daily protein target.
4. System fetches available products from `/api/products`.
5. System maps products to known nutrition profiles.
6. System ranks foods by cost per gram of protein and practicality.
7. System generates a daily protein plan.
8. User can remove a food item.
9. System recalculates using remaining allowed foods.
10. User sees:
    - Protein target.
    - Suggested foods.
    - Quantity per day.
    - Protein contribution.
    - Estimated daily cost.
    - Estimated monthly cost.
    - Vendor/product links.

### 4.2 Example Output

```txt
Target Protein: 105g/day
Budget: 300 Tk/day

Suggested Plan

Eggs, 3 pcs
Protein: 18g
Cost: 45 Tk

Chicken, 150g
Protein: 40g
Cost: 62 Tk

Katla Fish, 180g
Protein: 34g
Cost: 148 Tk

Dal, 1 serving
Protein: 13g
Cost: 25 Tk

Total Protein: 105g
Estimated Cost: 280 Tk/day
Estimated Monthly Cost: 8,400 Tk
```

## 5. Inputs

### 5.1 Required Inputs

- `age`: number.
- `gender`: `male` or `female`.
- `weightKg`: number.
- `heightCm`: number.
- `activityLevel`: one of:
  - `sedentary`
  - `light`
  - `moderate`
  - `active`
- `goal`: one of:
  - `basic_health`
  - `fat_loss`
  - `maintain`
  - `muscle_gain`
- `budgetAmount`: number.
- `budgetPeriod`: `daily`, `weekly`, or `monthly`.

### 5.2 Optional Inputs

- `preferredCategories`: array of categories.
- `excludedCategories`: array of categories.
- `excludedFoodTypes`: array of food types.
- `organicOnly`: boolean.
- `mealCount`: 2, 3, or 4.
- `city`: default `Dhaka`.

### 5.3 Food Categories

Initial categories:
- `chicken`
- `egg`
- `fish`
- `lentil`
- `nuts`
- `seeds`
- `dairy`
- `beef`

## 6. Calculation Rules

### 6.1 BMR

Use Mifflin-St Jeor.

```ts
maleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
femaleBmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
```

### 6.2 Activity Multiplier

```ts
const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};
```

### 6.3 Goal Calorie Adjustment

```ts
const goalCalorieMultipliers = {
  fat_loss: 0.85,
  basic_health: 1,
  maintain: 1,
  muscle_gain: 1.1,
};
```

### 6.4 Protein Target

Use a goal-based multiplier.

```ts
const proteinMultipliers = {
  basic_health: 1.0,
  fat_loss: 1.6,
  maintain: 1.2,
  muscle_gain: 1.8,
};

proteinTargetGrams = Math.round(weightKg * proteinMultipliers[goal]);
```

Guardrails:
- Minimum adult target: `Math.max(calculatedTarget, 50)` for men and `Math.max(calculatedTarget, 45)` for women.
- Do not support users under 18 in MVP. Show a message asking them to consult a guardian/doctor.
- Pregnancy/lactation should be out of scope in MVP.

## 7. Nutrition Data Strategy

Scraped product pages should provide:
- Product name.
- Vendor.
- Price.
- Package size.
- Unit.
- Product URL.
- Image URL.
- Availability.

Scraped product pages should not be trusted for nutrition values unless explicitly present and verified.

Use a curated local nutrition table for MVP.

### 7.1 Static Nutrition Profiles

Create:

`src/data/nutrition-profiles.ts`

Initial profiles:

```ts
export const nutritionProfiles = [
  {
    foodType: "chicken",
    displayName: "Chicken",
    category: "chicken",
    proteinPer100g: 27,
    caloriesPer100g: 165,
    fatPer100g: 4,
    carbsPer100g: 0,
    maxDailyGrams: 250,
  },
  {
    foodType: "egg",
    displayName: "Egg",
    category: "egg",
    proteinPerUnit: 6,
    caloriesPerUnit: 70,
    maxDailyUnits: 4,
  },
  {
    foodType: "fish_generic",
    displayName: "Fish",
    category: "fish",
    proteinPer100g: 22,
    caloriesPer100g: 130,
    fatPer100g: 5,
    carbsPer100g: 0,
    maxDailyGrams: 250,
  },
  {
    foodType: "dal",
    displayName: "Dal",
    category: "lentil",
    proteinPerServing: 12,
    caloriesPerServing: 180,
    maxDailyServings: 2,
  },
  {
    foodType: "almond",
    displayName: "Almond",
    category: "nuts",
    proteinPer100g: 21,
    caloriesPer100g: 579,
    fatPer100g: 50,
    carbsPer100g: 22,
    maxDailyGrams: 30,
  },
];
```

Later, replace or enrich this with an imported verified food database.

## 8. Vendor Data Strategy

Use the existing scraping system, then expand it.

Initial vendor categories:

Chicken:
- Existing organic chicken sources already supported by the current app.

Fish:
- `https://fishvally.com/collections/river-fish`
- `https://riverfish.com.bd/`

Nuts and seeds:
- `https://ghorerbazar.com/collections/nuts-seeds`

Future:
- Eggs.
- Dal/lentils.
- Milk/yogurt.
- Beef.
- Local grocery marketplaces.

## 9. Database Changes

Current `products` table is enough for the existing chicken MVP but not enough for a multi-food protein planner.

### 9.1 Add Vendors Table

```ts
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category"),
  deliveryArea: text("delivery_area"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 9.2 Expand Products Table

Add fields:

```ts
category: text("category"),
foodType: text("food_type"),
packageSize: integer("package_size"),
packageUnit: text("package_unit"),
normalizedPricePerKg: integer("normalized_price_per_kg"),
normalizedPricePerUnit: integer("normalized_price_per_unit"),
inStock: boolean("in_stock").default(true),
nutritionVerified: boolean("nutrition_verified").default(false),
```

Notes:
- Keep the current `vendor` text column during migration to avoid breaking existing code.
- Add `vendorId` later after existing product data is migrated.

### 9.3 Add Price History Writes

The existing `price_history` table should be used whenever a scraper inserts or updates a product price.

Rule:
- Insert a price history row when:
  - New product is inserted.
  - Existing product price changes.

## 10. New Files

Create:

```txt
src/app/protein-budget-planner/page.tsx
src/components/protein-budget-planner.tsx
src/components/protein-plan-result.tsx
src/components/protein-food-selector.tsx
src/lib/nutrition.ts
src/lib/protein-planner.ts
src/data/nutrition-profiles.ts
src/types/protein-planner.ts
```

Update:

```txt
src/components/navbar.tsx
src/app/page.tsx
src/db/schema.ts
src/lib/scraper.ts
src/app/api/products/route.ts
src/app/api/admin/config/route.ts
```

## 11. API Plan

### 11.1 Existing API

Keep:

```txt
GET /api/products
POST /api/scrape
GET /api/admin/config
POST /api/admin/config
DELETE /api/admin/config
```

### 11.2 New API

For MVP, calculation can run client-side. Add an API only if server-side persistence or more complex optimization is needed.

Recommended MVP route:

```txt
POST /api/protein-plan
```

Request:

```ts
type ProteinPlanRequest = {
  age: number;
  gender: "male" | "female";
  weightKg: number;
  heightCm: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active";
  goal: "basic_health" | "fat_loss" | "maintain" | "muscle_gain";
  budgetAmount: number;
  budgetPeriod: "daily" | "weekly" | "monthly";
  preferredCategories: string[];
  excludedCategories: string[];
  excludedFoodTypes: string[];
  organicOnly: boolean;
  mealCount: 2 | 3 | 4;
};
```

Response:

```ts
type ProteinPlanResponse = {
  targetProteinGrams: number;
  targetCalories: number;
  budgetPerDay: number;
  selectedItems: ProteinPlanItem[];
  totalProteinGrams: number;
  totalCostPerDay: number;
  totalCostPerMonth: number;
  warnings: string[];
};
```

## 12. Planner Algorithm

Start with a deterministic greedy planner.

### 12.1 Normalize Budget

```ts
function toDailyBudget(amount: number, period: BudgetPeriod) {
  if (period === "daily") return amount;
  if (period === "weekly") return amount / 7;
  return amount / 30;
}
```

### 12.2 Calculate Cost Per Gram Protein

For gram-based products:

```ts
proteinPerKg = profile.proteinPer100g * 10;
costPerGramProtein = product.normalizedPricePerKg / proteinPerKg;
```

For unit-based products, such as eggs:

```ts
costPerGramProtein = product.normalizedPricePerUnit / profile.proteinPerUnit;
```

### 12.3 Rank Foods

Score should consider:
- Cost per gram protein.
- User preference.
- Category diversity.
- Practical daily maximum.
- Organic-only filter.
- Availability.

Simple score:

```ts
score =
  costPerGramProtein
  - preferenceBonus
  + repeatedCategoryPenalty
  + expensivePenalty;
```

Lower score is better.

### 12.4 Build Plan

Pseudo-code:

```ts
function generateProteinPlan(input, products, nutritionProfiles) {
  const target = calculateProteinTarget(input);
  const dailyBudget = toDailyBudget(input.budgetAmount, input.budgetPeriod);

  const candidates = buildCandidates(products, nutritionProfiles, input)
    .filter(candidate => candidate.inStock)
    .filter(candidate => !input.excludedCategories.includes(candidate.category))
    .filter(candidate => !input.excludedFoodTypes.includes(candidate.foodType))
    .sort(byPlannerScore);

  const plan = [];
  let remainingProtein = target;
  let remainingBudget = dailyBudget;

  for (const candidate of candidates) {
    if (remainingProtein <= 0) break;
    if (remainingBudget <= 0) break;

    const item = allocateCandidate(candidate, remainingProtein, remainingBudget);
    if (!item) continue;

    plan.push(item);
    remainingProtein -= item.proteinGrams;
    remainingBudget -= item.cost;
  }

  return summarizePlan(plan, target, dailyBudget);
}
```

### 12.5 Recalculate After Removing Item

When user removes a food item:

```ts
excludedFoodTypes.push(removedItem.foodType);
generateProteinPlan(updatedInput, products, nutritionProfiles);
```

## 13. UI Plan

### 13.1 Route

Create:

`/protein-budget-planner`

### 13.2 Page Layout

Desktop:
- Left: input form.
- Right: sticky result panel.

Mobile:
- Form first.
- Result below.

### 13.3 Form Sections

Section 1: Body
- Age input.
- Gender segmented control.
- Weight input.
- Height input.

Section 2: Goal
- Activity level select.
- Goal segmented control.

Section 3: Budget
- Budget amount input.
- Budget period select.

Section 4: Food preferences
- Checkbox/toggle chips:
  - Chicken.
  - Eggs.
  - Fish.
  - Dal.
  - Nuts.
  - Seeds.
  - Dairy.
  - Beef.
- Organic-only toggle.

### 13.4 Result Panel

Show:
- Protein target.
- Calories estimate.
- Daily budget.
- Daily plan.
- Total protein.
- Total cost.
- Monthly cost.
- Remaining budget.
- Warnings.

Result row design can be inspired by macro calculators but should match Organic Foods Hub BD.

Example:

```txt
Your Protein Plan

Protein Target       105g
Plan Protein         108g
Daily Cost           285 Tk
Monthly Cost         8,550 Tk
Budget Fit           Under budget
```

### 13.5 Plan Items

Each item card/row:
- Food name.
- Quantity.
- Protein.
- Cost.
- Vendor.
- Buy link.
- Remove button.

## 14. Scraper Expansion

### 14.1 Scraping Config Changes

Add fields to scraping configs:

```ts
sourceType: "product_page" | "collection_page";
category: string;
vendorName: string;
```

For collection pages, scraper should extract multiple products.

### 14.2 Extraction Schema

```ts
const productCollectionExtractSchema = {
  type: "object",
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "integer" },
          vendor: { type: "string" },
          url: { type: "string" },
          imageUrl: { type: "string" },
          packageSize: { type: "number" },
          packageUnit: { type: "string" },
          category: { type: "string" },
          inStock: { type: "boolean" }
        },
        required: ["name", "price", "vendor"]
      }
    }
  },
  required: ["products"]
};
```

### 14.3 Normalization Rules

Normalize units:
- `kg` to grams.
- `gm`, `g`, `gram` to grams.
- `piece`, `pcs`, `egg` to unit.
- `pack` requires manual review unless package size is detected.

Store:
- Original package info.
- Normalized price per kg or unit.

## 15. Admin Workflow

Extend admin dashboard with:

1. Scraping target list.
2. Category per scraping target.
3. Vendor name per scraping target.
4. Source type: product page or collection page.
5. Product review table.
6. Nutrition mapping editor.

Admin review table columns:
- Product.
- Vendor.
- Price.
- Unit.
- Category.
- Suggested food type.
- Confidence.
- Verified toggle.

Do not allow unverified nutrition mappings to silently power recommendations in production. In MVP, allow them but show a warning internally.

## 16. Safety and Trust

This feature should avoid medical positioning.

Use wording:
- "Estimated protein target."
- "General nutrition planning."
- "Not medical advice."
- "Consult a qualified professional for medical conditions, pregnancy, kidney disease, or special diets."

Do not claim:
- Disease treatment.
- Guaranteed fat loss.
- Guaranteed muscle gain.
- Personalized medical nutrition therapy.

## 17. SEO Plan

Initial pages:
- `/protein-budget-planner`
- `/blog/protein-calculator-bangladesh`
- `/blog/cheap-protein-sources-bangladesh`
- `/blog/chicken-vs-fish-protein-cost-bangladesh`
- `/blog/high-protein-foods-in-bangladesh`

Primary keywords:
- protein calculator Bangladesh
- protein budget planner Bangladesh
- cheap protein foods Bangladesh
- protein rich food BD
- chicken protein cost Bangladesh
- fish protein Bangladesh

## 18. Implementation Phases

### Phase 0 - Cleanup Before Feature Work

Goal: Make the current repo clean enough for safe feature development.

Tasks:
- [ ] Fix current lint errors.
- [ ] Replace `images.domains` with `images.remotePatterns`.
- [ ] Remove unused imports.
- [ ] Replace scraper `any` and `@ts-ignore` with typed wrappers.
- [ ] Add price history writes to scraper.
- [ ] Add minimal auth protection to admin and scrape routes.

Acceptance criteria:
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Admin routes are not publicly writable.
- [ ] Scrape route cannot be triggered by anonymous users.

### Phase 1 - Static Protein Planner MVP

Goal: Build the planner with static nutrition data and existing product prices.

Tasks:
- [ ] Create `src/types/protein-planner.ts`.
- [ ] Create `src/data/nutrition-profiles.ts`.
- [ ] Create `src/lib/nutrition.ts`.
- [ ] Create `src/lib/protein-planner.ts`.
- [ ] Create `/protein-budget-planner` route.
- [ ] Create `ProteinBudgetPlanner` component.
- [ ] Create form for body, goal, budget, and food preferences.
- [ ] Fetch products from `/api/products`.
- [ ] Match products to static nutrition profiles using `foodType`.
- [ ] Generate a daily plan.
- [ ] Add remove/recalculate behavior.
- [ ] Add result summary.
- [ ] Add shopping list.
- [ ] Add nav link.

Acceptance criteria:
- [ ] User can enter body details and budget.
- [ ] User receives a protein target.
- [ ] User receives a food plan under budget when possible.
- [ ] User can remove a suggested food.
- [ ] Plan recalculates after removal.
- [ ] UI works on mobile and desktop.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

### Phase 2 - Multi-Food Product Data

Goal: Expand beyond chicken into fish, nuts, eggs, dal, and dairy.

Tasks:
- [ ] Add product fields for category, food type, package size, package unit, normalized price.
- [ ] Add migration.
- [ ] Update scraper extraction schema.
- [ ] Support collection-page scraping.
- [ ] Add scraping configs for Fish Vally.
- [ ] Add scraping configs for RiverFish.
- [ ] Add scraping configs for Ghorer Bazar nuts/seeds.
- [ ] Add admin product nutrition mapping screen.
- [ ] Add manual verified toggle.

Acceptance criteria:
- [ ] Products from fish vendors can be scraped.
- [ ] Products from nuts/seeds vendor can be scraped.
- [ ] Prices are normalized.
- [ ] Products are mapped to nutrition profiles.
- [ ] Planner can recommend fish and nuts based on live price data.

### Phase 3 - Better Recommendation Engine

Goal: Make plans more realistic and useful.

Tasks:
- [ ] Add category diversity rules.
- [ ] Add max daily quantity per food.
- [ ] Add preferred food weighting.
- [ ] Add budget shortfall warnings.
- [ ] Add "cheapest plan" mode.
- [ ] Add "balanced plan" mode.
- [ ] Add "organic/premium plan" mode.

Acceptance criteria:
- [ ] Planner does not recommend unrealistic amounts of one food.
- [ ] Planner explains when budget is too low.
- [ ] Planner can show multiple plan options.

### Phase 4 - Retention Features

Goal: Turn calculator into a repeatable product.

Tasks:
- [ ] Add saved plans.
- [ ] Add shareable plan URL.
- [ ] Add email capture.
- [ ] Add weekly shopping list.
- [ ] Add price alert when a preferred protein source gets cheaper.
- [ ] Add family budget mode.

Acceptance criteria:
- [ ] Users can save or share a plan.
- [ ] Users can return weekly.
- [ ] App creates a reason to revisit when prices change.

## 19. Suggested First Pull Request

Title:

Add protein budget planner MVP with static nutrition profiles

Files:

```txt
src/app/protein-budget-planner/page.tsx
src/components/protein-budget-planner.tsx
src/components/protein-plan-result.tsx
src/data/nutrition-profiles.ts
src/lib/nutrition.ts
src/lib/protein-planner.ts
src/types/protein-planner.ts
src/components/navbar.tsx
```

Keep out of first PR:
- Schema changes.
- New scraper formats.
- Vendor expansion.
- Saved plans.

Reason:
- The planner can be validated with existing data and static nutrition profiles first.
- Scraper expansion and database migration can happen after the UX and calculation model feel useful.

## 20. Open Product Questions

- Should the default goal be basic health or muscle gain?
- Should the app ask for cooked weight or raw weight assumptions?
- Should price planning be daily, weekly, or monthly by default?
- Should nuts be treated as protein source or mostly healthy fat with some protein?
- Should fish be grouped generically first, then split into species later?
- Should users see calorie estimates in MVP, or only protein and budget?
- Should organic-only mode include fish and nuts or only verified organic products?

## 21. Validation Metrics

Track manually at first:
- Number of calculator visits.
- Number of completed plans.
- Most selected budget range.
- Most excluded food types.
- Most clicked vendor products.
- Percentage of users who remove at least one suggested food.

Useful success signal:
- Users click vendor links from generated plans.
- Users adjust the plan instead of leaving immediately.
- Users search for cheaper protein sources by budget.

## 22. References

Vendor examples:
- Fish Vally river fish collection: https://fishvally.com/collections/river-fish
- RiverFish Bangladesh: https://riverfish.com.bd/
- Ghorer Bazar nuts and seeds: https://ghorerbazar.com/collections/nuts-seeds

Nutrition baseline references:
- NIH Office of Dietary Supplements mentions USDA FoodData Central as a nutrient database: https://ods.od.nih.gov/healthinformation/nutrientrecommendations.aspx
- NCBI Dietary Reference Intakes summary notes adult protein RDA around 0.8 g/kg body weight: https://ncbi.nlm.nih.gov/sites/books/NBK234929/
