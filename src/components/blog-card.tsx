import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '@/lib/blogs';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block h-full transition-transform hover:-translate-y-1">
      <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/50 hover:bg-card/80 hover:shadow-lg transition-all duration-300">
        <div className="aspect-video w-full bg-muted/50 flex items-center justify-center relative overflow-hidden group">
            <Image
              src={post.image} 
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
        </div>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-full font-normal">
              Blog
            </Badge>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTime}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-xl font-bold group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {post.excerpt}
          </p>
        </CardContent>
        <CardFooter className="mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center text-sm font-medium text-primary">
            Read Article <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
