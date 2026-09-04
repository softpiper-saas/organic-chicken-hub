import { nutritionProfiles } from "@/data/nutrition-profiles";

export const defaultProductCategories = Array.from(
  new Map(
    nutritionProfiles.map((profile) => [
      profile.category,
      {
        id: profile.category,
        name: profile.category.charAt(0).toUpperCase() + profile.category.slice(1),
        slug: profile.category,
        description: `${profile.category} protein products`,
      },
    ])
  ).values()
);
