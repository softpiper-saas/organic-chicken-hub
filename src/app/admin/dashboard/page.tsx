import Link from "next/link";
import { Database, FolderTree, History, PackageSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    href: "/admin/sources",
    title: "Scraping Sources",
    description: "Manage vendor URLs, source types, category mapping, and manual scrape runs.",
    icon: Database,
  },
  {
    href: "/admin/categories",
    title: "Product Categories",
    description: "Create and maintain protein categories used by products, scraping, and the planner.",
    icon: FolderTree,
  },
  {
    href: "/admin/products",
    title: "Products",
    description: "Add, edit, categorize, verify, and delete products from all protein vendors.",
    icon: PackageSearch,
  },
  {
    href: "/admin/price-history",
    title: "Price History",
    description: "Review and correct recorded prices for any product over time.",
    icon: History,
  },
];

export default function Dashboard() {
  return (
    <main className="container mx-auto space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the area you want to operate. Each admin responsibility now has its own page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
