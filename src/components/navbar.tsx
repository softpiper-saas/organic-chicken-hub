import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Organic Foods Hub BD" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-green-700">Organic Foods Hub BD</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/blog" className="text-sm font-medium transition-colors hover:text-primary">
              Blog
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/blog">
             <Button variant="ghost" size="sm" className="md:hidden">Blog</Button>
          </Link>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">Get Started</Button>
        </div>
      </div>
    </nav>
  );
}
