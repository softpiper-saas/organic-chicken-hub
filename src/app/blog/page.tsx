import { getBlogPosts } from '@/lib/blogs';
import { BlogCard } from '@/components/blog-card';

export const metadata = {
  title: 'Organic Chicken Blog | Health & Tips',
  description: 'Read the latest insights on organic chicken, health benefits, and farming practices in Bangladesh.',
  openGraph: {
    title: 'Organic Chicken Blog | Health & Tips',
    description: 'Read the latest insights on organic chicken, health benefits, and farming practices in Bangladesh.',
    url: 'https://organic-chicken-aggregator.vercel.app/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organic Chicken Blog | Health & Tips',
    description: 'Read the latest insights on organic chicken, health benefits, and farming practices in Bangladesh.',
  },
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Our Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-[700px]">
          Discover the benefits of organic chicken, healthy recipes, and insights into sustainable farming in Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
