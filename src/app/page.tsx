import { CostCalculator } from "@/components/cost-calculator";
import { ProductList } from "@/components/product-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Organic Chicken Aggregator',
    url: 'https://organic-chicken-aggregator.vercel.app',
    description: 'Compare prices and find the best organic chicken in Bangladesh.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://organic-chicken-aggregator.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-green-900">
            Eat Healthy, Live Healthy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the best organic chicken providers in Bangladesh. Compare prices, check reviews, and make the switch from antibiotic-laden broiler chicken today.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
              Browse Organic Chicken
            </Button>
            <Button variant="outline" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Cost Calculator Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">The True Cost of Broiler Chicken</h2>
            <p className="text-muted-foreground">
              Think broiler chicken is cheap? Think again. Calculate the real cost of solid meat and see how affordable organic can be.
            </p>
          </div>
          <CostCalculator />
        </div>
      </section>

      {/* Product List Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Top Organic Chicken Providers</h2>
            <p className="text-muted-foreground">
              Curated list of verified organic chicken sellers in Bangladesh.
            </p>
          </div>
          <ProductList />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Organic Chicken Aggregator</h3>
            <p className="text-gray-400">
              Helping you find safe, antibiotic-free chicken for your family.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="#" className="hover:text-white">About Us</Link></li>
              <li><Link href="#" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Get monthly price updates and health tips.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-gray-800 border-none rounded px-4 py-2 w-full"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; 2024 Organic Chicken Aggregator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
