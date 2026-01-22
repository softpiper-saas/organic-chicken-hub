import fs from 'fs';
import path from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
}

const BLOG_FILE_PATH = path.join(process.cwd(), 'src/data/blogs/blogContents.md');

export function getBlogPosts(): BlogPost[] {
  const fileContent = fs.readFileSync(BLOG_FILE_PATH, 'utf-8');
  const posts = fileContent.split('### Blog Post').slice(1); // Skip the first empty split

  return posts.map((post, index) => {
    const lines = post.trim().split('\n');
    const titleLine = lines[0].trim();
    // Remove "1: ", "2: " etc if present in the title line from the split
    const title = titleLine.replace(/^\d+:\s*/, '').trim();
    
    const content = lines.slice(1).join('\n').trim();
    
    // Generate a simple slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Create an excerpt (first ~150 chars)
    const excerpt = content.replace(/[#*]/g, '').substring(0, 150).trim() + '...';

    // Mock date and read time for now since they aren't in the source
    const date = new Date().toISOString().split('T')[0]; // Current date
    const readTime = Math.ceil(content.split(/\s+/).length / 200) + ' min read';

    // Assign images based on index or content
    let image = '/images/blog/concept.png';
    if (index % 3 === 0) image = '/images/blog/concept.png';
    else if (index % 3 === 1) image = '/images/blog/farm.png';
    else image = '/images/blog/dish.png';

    return {
      slug,
      title,
      content,
      excerpt,
      date,
      readTime,
      image,
    };
  });
}

export function getBlogPost(slug: string): BlogPost | undefined {
  const posts = getBlogPosts();
  return posts.find((post) => post.slug === slug);
}
