import { CostCalculator } from "@/components/cost-calculator";
import { ProductList } from "@/components/product-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Organic Foods Hub BD',
    url: 'https://organicfoodshubbd.com',
    description: 'Your trusted source for organic chicken, honey, ghee, nuts, and more in Bangladesh.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://organicfoodshubbd.com/search?q={search_term_string}',
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
      <section className="bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-green-900">
              Pure Nature, Delivered.
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover the best organic foods in Bangladesh. From safe chicken to pure honey and ghee, we bring nature's best to your doorstep.
            </p>
            <div className="flex justify-center lg:justify-start gap-4">
              <Button className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
                Browse Organic Chicken
              </Button>
              <Button variant="outline" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="w-full">
            <CostCalculator />
          </div>
        </div>
      </section>

      {/* Product List Section */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Top Organic Chicken Providers</h2>
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
            <h3 className="text-xl font-bold mb-4">Organic Foods Hub BD</h3>
            <p className="text-gray-400">
              Helping you find safe, organic food for your family.
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
          <p>&copy; 2024 Organic Foods Hub BD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
