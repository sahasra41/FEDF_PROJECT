import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, PlusCircle, TrendingUp, MapPin, Activity, DollarSign, Calculator, Users } from 'lucide-react';

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Add Expense', href: '/add-expense', icon: PlusCircle },
    { name: 'Budget', href: '/budget', icon: TrendingUp },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Tourist Places', href: '/tourist-places', icon: MapPin },
    { name: 'Activities', href: '/activities', icon: Activity },
    { name: 'Currency Converter', href: '/currency-converter', icon: Calculator },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-secondary/10 sticky top-0 z-50">
        <div className="max-w-[100rem] mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="font-heading text-2xl uppercase text-secondary">
                TravelTracker
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 font-paragraph text-sm transition-colors hover:text-primary ${
                      isActive(item.href)
                        ? 'text-primary font-medium'
                        : 'text-secondary/70'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <span className="font-heading text-xl uppercase text-secondary">
                      TravelTracker
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <nav className="space-y-4">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-secondary/70 hover:bg-secondary/5 hover:text-secondary'
                        }`}
                      >
                        {Icon && <Icon className="h-5 w-5" />}
                        <span className="font-paragraph">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Quick Actions in Mobile Menu */}
                <div className="mt-8 pt-8 border-t border-secondary/10">
                  <h3 className="font-heading text-sm uppercase text-secondary mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link
                      to="/add-expense"
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <Button className="w-full justify-start" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Expense
                      </Button>
                    </Link>
                    <Link
                      to="/budget"
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full justify-start" size="sm">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Budget
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground mt-20">
        <div className="max-w-[100rem] mx-auto px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <DollarSign className="h-8 w-8 text-primary" />
                <span className="font-heading text-2xl uppercase">
                  TravelTracker
                </span>
              </div>
              <p className="font-paragraph text-secondary-foreground/80 max-w-md">
                Master your travel budget with intelligent expense tracking, 
                real-time analytics, and comprehensive trip management tools.
              </p>
            </div>
            
            <div>
              <h3 className="font-heading text-lg uppercase mb-4">Features</h3>
              <ul className="space-y-2 font-paragraph text-sm text-secondary-foreground/80">
                <li>Expense Tracking</li>
                <li>Budget Management</li>
                <li>Currency Conversion</li>
                <li>Analytics & Reports</li>
                <li>Group Trip Sharing</li>
                <li>Bill Splitting</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading text-lg uppercase mb-4">Categories</h3>
              <ul className="space-y-2 font-paragraph text-sm text-secondary-foreground/80">
                <li>Food & Dining</li>
                <li>Transportation</li>
                <li>Accommodation</li>
                <li>Activities</li>
                <li>Shopping</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-secondary-foreground/20 mt-12 pt-8 text-center">
            <p className="font-paragraph text-sm text-secondary-foreground/60">
              © 2024 TravelTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
