import { getBlogPost, getBlogPosts } from '@/lib/blogs';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Clock, Share2 } from 'lucide-react';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Organic Chicken Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: ['Softpiper Team'],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.image,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'Softpiper Team',
    },
    description: post.excerpt,
  };

  return (
    <article className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
          </Button>
        </Link>
      </div>

      <div className="space-y-6 mb-12">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            Blog Post
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readTime}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          {post.title}
        </h1>

        <div className="aspect-video w-full rounded-xl overflow-hidden relative shadow-lg">
          <img 
            src={post.image} 
            alt={post.title}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex items-center justify-between border-y border-border/50 py-4">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                ✍️
              </div>
              <div>
                <p className="text-sm font-medium">Written by</p>
                <p className="text-sm text-muted-foreground">Softpiper Team</p>
              </div>
           </div>
           <Button variant="outline" size="sm">
             <Share2 className="mr-2 h-4 w-4" /> Share
           </Button>
        </div>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl prose-strong:text-foreground">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      
      <div className="mt-16 pt-8 border-t border-border">
        <h3 className="text-2xl font-bold mb-6">Related Posts</h3>
        {/* In a real app, we would filter for related posts. For now, just link back to blog */}
        <div className="bg-muted/30 rounded-xl p-8 text-center">
            <p className="text-lg text-muted-foreground mb-4">Enjoyed this article? Check out more on our blog.</p>
            <Link href="/blog">
                <Button size="lg">View All Posts</Button>
            </Link>
        </div>
      </div>
    </article>
  );
}
