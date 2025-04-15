// client-agent/client/src/components/layout.tsx
import { Link } from "wouter";
import { NavigationTracker } from "./navigation-tracker";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary">
      {/* Add the navigation tracker */}
      <NavigationTracker />
      
      <header className="sticky top-0 z-50 w-full border-b bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/60">
        <nav className="container flex h-14 items-center gap-4 md:gap-8">
          <Link href="/" className="font-medium text-primary-foreground">
            Home
          </Link>
          <Link href="/messages" className="font-medium text-primary-foreground">
            Messages
          </Link>
        </nav>
      </header>
      <main className="container py-6 text-primary-foreground">{children}</main>
    </div>
  );
}