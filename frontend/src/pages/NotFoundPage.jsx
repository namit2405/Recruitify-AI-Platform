import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFoundPage() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Page Not Found');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl mb-2">404 - Page Not Found</CardTitle>
            <p className="text-muted-foreground">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate({ to: '/' })}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
