import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { AdventureActivities } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Search, Activity, DollarSign, Filter, Calendar, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<AdventureActivities[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<AdventureActivities[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { items } = await BaseCrudService.getAll<AdventureActivities>('adventureactivities');
        setActivities(items);
        setFilteredActivities(items);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  useEffect(() => {
    let filtered = activities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.activityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }

    // Filter by price range
    if (priceRange !== 'all') {
      filtered = filtered.filter(activity => {
        const price = activity.estimatedCost || 0;
        switch (priceRange) {
          case 'free':
            return price === 0;
          case 'low':
            return price > 0 && price <= 50;
          case 'medium':
            return price > 50 && price <= 150;
          case 'high':
            return price > 150;
          default:
            return true;
        }
      });
    }

    // Filter by booking requirement
    if (bookingFilter !== 'all') {
      filtered = filtered.filter(activity => {
        if (bookingFilter === 'required') return activity.requiresBooking;
        if (bookingFilter === 'not-required') return !activity.requiresBooking;
        return true;
      });
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, selectedCategory, priceRange, bookingFilter]);

  const categories = [...new Set(activities.map(activity => activity.category).filter(Boolean))];

  const addToExpenses = (activity: AdventureActivities) => {
    // Navigate to add expense page with pre-filled data
    navigate(`/add-expense?category=activities&amount=${activity.estimatedCost}&description=${activity.activityName}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-paragraph text-secondary/70">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-[100rem] mx-auto px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="font-heading text-4xl lg:text-5xl uppercase text-secondary mb-4">
            ADVENTURE ACTIVITIES
          </h1>
          <p className="font-paragraph text-xl text-secondary/80">
            Discover exciting adventures and plan your activity budget
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="low">$1 - $50</SelectItem>
                  <SelectItem value="medium">$51 - $150</SelectItem>
                  <SelectItem value="high">$150+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bookingFilter} onValueChange={setBookingFilter}>
                <SelectTrigger>
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="required">Booking Required</SelectItem>
                  <SelectItem value="not-required">Walk-in Available</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="font-paragraph text-sm text-secondary/70">
                  {filteredActivities.length} activities
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange('all');
                    setBookingFilter('all');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-secondary/30 mx-auto mb-4" />
              <h3 className="font-heading text-xl uppercase text-secondary mb-2">
                No Activities Found
              </h3>
              <p className="font-paragraph text-secondary/70">
                Try adjusting your filters to see more results
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredActivities.map((activity) => (
              <Card key={activity._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {activity.activityImage && (
                  <div className="h-48 overflow-hidden">
                    <Image 
                      src={activity.activityImage} 
                      alt={activity.activityName || 'Adventure activity'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={400}
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-heading text-xl uppercase text-secondary mb-2">
                        {activity.activityName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        {activity.category && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.category}
                          </Badge>
                        )}
                        <Badge 
                          variant={activity.requiresBooking ? "default" : "outline"} 
                          className="text-xs"
                        >
                          <Calendar className="mr-1 h-3 w-3" />
                          {activity.requiresBooking ? 'Booking Required' : 'Walk-in'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-paragraph text-xs text-secondary/50 mb-1">Est. Cost</div>
                      <div className="font-heading text-2xl text-primary">
                        {activity.estimatedCost === 0 ? 'Free' : `₹${activity.estimatedCost} INR`}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="font-paragraph text-secondary/80 text-sm mb-6 line-clamp-3">
                    {activity.description}
                  </p>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => addToExpenses(activity)}
                      className="flex-1"
                      disabled={!activity.estimatedCost}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Add to Expenses
                    </Button>
                    {activity.requiresBooking && (
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        {filteredActivities.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <Card className="bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-primary mb-2">
                  {filteredActivities.length}
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Total Activities
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/5">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-secondary mb-2">
                  {filteredActivities.filter(a => a.requiresBooking).length}
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Require Booking
                </div>
              </CardContent>
            </Card>

            <Card className="bg-highlightyellow/20">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-highlightyellow mb-2">
                  ₹{Math.min(...filteredActivities.map(a => a.estimatedCost || 0).filter(c => c > 0)) || 0} INR
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Lowest Cost
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-primary mb-2">
                  ₹{Math.max(...filteredActivities.map(a => a.estimatedCost || 0)) || 0} INR
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Highest Cost
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories Overview */}
        {categories.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="font-heading text-2xl uppercase text-secondary">
                Activity Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((category) => {
                  const categoryActivities = filteredActivities.filter(a => a.category === category);
                  const avgCost = categoryActivities.reduce((sum, a) => sum + (a.estimatedCost || 0), 0) / categoryActivities.length;
                  
                  return (
                    <div key={category} className="p-4 border rounded-lg hover:bg-secondary/5 transition-colors">
                      <h3 className="font-heading text-lg uppercase text-secondary mb-2">
                        {category}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="font-paragraph text-secondary/70">Activities:</span>
                          <span className="font-paragraph text-secondary">{categoryActivities.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-paragraph text-secondary/70">Avg Cost:</span>
                          <span className="font-paragraph text-secondary">
                            ₹{avgCost.toFixed(0)} INR
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-paragraph text-secondary/70">Booking:</span>
                          <span className="font-paragraph text-secondary">
                            {categoryActivities.filter(a => a.requiresBooking).length}/{categoryActivities.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
