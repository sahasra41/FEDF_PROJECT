import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { TouristPlaces, AdventureActivities, TravelModes } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { PlusCircle, TrendingUp, MapPin, Activity, DollarSign, AlertTriangle, Users } from 'lucide-react';

export default function HomePage() {
  const [touristPlaces, setTouristPlaces] = useState<TouristPlaces[]>([]);
  const [activities, setActivities] = useState<AdventureActivities[]>([]);
  const [travelModes, setTravelModes] = useState<TravelModes[]>([]);
  const [totalBudget] = useState(5000); // Default budget
  const [totalExpenses] = useState(3250); // Mock current expenses
  const budgetUsed = (totalExpenses / totalBudget) * 100;
  const isOverBudget = totalExpenses > totalBudget;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placesData, activitiesData, modesData] = await Promise.all([
          BaseCrudService.getAll<TouristPlaces>('touristplaces'),
          BaseCrudService.getAll<AdventureActivities>('adventureactivities'),
          BaseCrudService.getAll<TravelModes>('travelmodes')
        ]);
        
        setTouristPlaces(placesData.items.slice(0, 3));
        setActivities(activitiesData.items.slice(0, 3));
        setTravelModes(modesData.items.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Full Bleed */}
      <section className="w-full max-w-[120rem] mx-auto relative overflow-hidden">
        <div className="bg-primary text-primary-foreground px-8 py-24 lg:py-32">
          <div className="max-w-[100rem] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h1 className="font-heading text-6xl lg:text-8xl uppercase tracking-tight mb-8">
                  TRAVEL
                  <br />
                  EXPENSE
                  <br />
                  TRACKER
                </h1>
                <p className="font-paragraph text-xl lg:text-2xl mb-12 opacity-90">
                  Master your travel budget with intelligent expense tracking, 
                  real-time analytics, and comprehensive trip management tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/add-expense">
                    <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add Expense
                    </Button>
                  </Link>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/groups">
                      <Button size="lg" variant="outline" className="text-lg px-6 py-4 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                        <Users className="mr-2 h-5 w-5" />
                        Create Trip
                      </Button>
                    </Link>
                    <Link to="/groups?action=join">
                      <Button size="lg" variant="outline" className="text-lg px-6 py-4 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                        <Users className="mr-2 h-5 w-5" />
                        Join Trip
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Budget Overview Card */}
              <div className="bg-background text-foreground rounded-lg p-8 shadow-2xl">
                <h3 className="font-heading text-2xl uppercase mb-6 text-secondary">Current Trip Budget</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-paragraph text-lg">Total Budget</span>
                    <span className="font-heading text-2xl text-secondary">₹{totalBudget.toLocaleString()} INR</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-paragraph text-lg">Spent</span>
                    <span className="font-heading text-2xl text-primary">₹{totalExpenses.toLocaleString()} INR</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-paragraph">{budgetUsed.toFixed(1)}% used</span>
                    <span className="font-paragraph">₹{(totalBudget - totalExpenses).toLocaleString()} INR remaining</span>
                  </div>
                  {budgetUsed > 90 && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-paragraph text-sm">Budget Alert: You're approaching your limit!</span>
                    </div>
                  )}
                  {isOverBudget && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-paragraph text-sm font-medium">Budget Exceeded: You've gone over your budget by ₹{(totalExpenses - totalBudget).toLocaleString()} INR!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative curved bottom */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-highlightyellow opacity-20 rounded-t-[100px]" />
      </section>

      {/* Quick Actions Section */}
      <section className="max-w-[100rem] mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl lg:text-5xl uppercase text-secondary mb-6">
            EXPENSE CATEGORIES
          </h2>
          <p className="font-paragraph text-xl text-secondary/80 max-w-3xl mx-auto">
            Track every aspect of your journey with our comprehensive expense categories
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link to="/add-expense?category=food" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <DollarSign className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl uppercase text-secondary mb-3">Food & Dining</h3>
                <p className="font-paragraph text-secondary/70">Restaurants, street food, groceries</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/add-expense?category=travel" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl uppercase text-secondary mb-3">Transportation</h3>
                <p className="font-paragraph text-secondary/70">Flights, trains, local transport</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/add-expense?category=activities" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-highlightyellow/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-highlightyellow group-hover:text-secondary transition-colors">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl uppercase text-secondary mb-3">Activities</h3>
                <p className="font-paragraph text-secondary/70">Adventures, tours, experiences</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/groups" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl uppercase text-secondary mb-3">Group Trips</h3>
                <p className="font-paragraph text-secondary/70">Split bills with friends</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Featured Tourist Places */}
      <section className="bg-secondary text-secondary-foreground py-20">
        <div className="max-w-[100rem] mx-auto px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="font-heading text-4xl lg:text-5xl uppercase mb-6">
                POPULAR DESTINATIONS
              </h2>
              <p className="font-paragraph text-xl opacity-90 max-w-2xl">
                Discover amazing places and plan your budget with our curated destination guide
              </p>
            </div>
            <Link to="/tourist-places">
              <Button variant="outline" size="lg" className="border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary">
                View All Places
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {touristPlaces.map((place) => (
              <Card key={place._id} className="bg-background text-foreground overflow-hidden hover:shadow-xl transition-all duration-300">
                {place.image && (
                  <div className="h-48 overflow-hidden">
                    <Image 
                      src={place.image} 
                      alt={place.name || 'Tourist place'} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      width={400}
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-heading text-xl uppercase text-secondary">
                    {place.name}
                  </CardTitle>
                  <p className="font-paragraph text-secondary/70">{place.location}</p>
                </CardHeader>
                <CardContent>
                  <p className="font-paragraph text-secondary/80 mb-4 line-clamp-2">
                    {place.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-paragraph text-sm text-secondary/60">Entry Fee</span>
                    <span className="font-heading text-lg text-primary">
                      ₹{place.entryTicketPrice || 0} INR
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Adventure Activities Preview */}
      <section className="max-w-[100rem] mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl lg:text-5xl uppercase text-secondary mb-6">
            ADVENTURE ACTIVITIES
          </h2>
          <p className="font-paragraph text-xl text-secondary/80 max-w-3xl mx-auto">
            Plan your adventures and budget for unforgettable experiences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {activities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-highlightyellow">
              {activity.activityImage && (
                <div className="h-40 overflow-hidden">
                  <Image 
                    src={activity.activityImage} 
                    alt={activity.activityName || 'Adventure activity'} 
                    className="w-full h-full object-cover"
                    width={300}
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-heading text-lg uppercase text-secondary">
                  {activity.activityName}
                </CardTitle>
                <p className="font-paragraph text-sm text-highlightyellow font-medium">
                  {activity.category}
                </p>
              </CardHeader>
              <CardContent>
                <p className="font-paragraph text-secondary/80 text-sm mb-4 line-clamp-2">
                  {activity.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-paragraph text-xs text-secondary/60">
                    {activity.requiresBooking ? 'Booking Required' : 'Walk-in Available'}
                  </span>
                  <span className="font-heading text-primary">
                    ₹{activity.estimatedCost || 0} INR
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/activities">
            <Button size="lg" className="bg-highlightyellow text-secondary hover:bg-highlightyellow/90">
              Explore All Activities
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
