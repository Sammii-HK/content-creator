import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sparkles, 
  BarChart3, 
  Target, 
  ArrowRight, 
  Play,
  Users,
  Zap,
  Shield
} from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-background-secondary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI-Powered Content Creation
              </div>
            </div>
            
            <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Create stunning content with{' '}
              <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                AI precision
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-foreground-secondary">
              Transform your content strategy with our intelligent platform that learns from your audience 
              to create engaging videos, optimize performance, and scale your creative output.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Trusted by creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Enterprise ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Lightning fast</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Everything you need to create amazing content
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Powerful tools and AI-driven insights to streamline your content creation workflow.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">AI-Powered Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Create engaging scripts and captions using advanced language models trained on viral content patterns and audience preferences.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success transition-colors group-hover:bg-success group-hover:text-success-foreground">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track engagement metrics and let the system learn from your best-performing content to optimize future creations automatically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning transition-colors group-hover:bg-warning group-hover:text-warning-foreground">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Smart Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Automatically refine templates and content strategies based on real performance data and audience engagement patterns.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background-secondary py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ready to transform your content?
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Join thousands of creators who are already using AI to scale their content production.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
