import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { TouristPlaces } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Search, MapPin, DollarSign, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TouristPlacesPage() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<TouristPlaces[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<TouristPlaces[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const { items } = await BaseCrudService.getAll<TouristPlaces>('touristplaces');
        setPlaces(items);
        setFilteredPlaces(items);
      } catch (error) {
        console.error('Error fetching tourist places:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  useEffect(() => {
    let filtered = places;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(place =>
        place.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }

    // Filter by price range
    if (priceRange !== 'all') {
      filtered = filtered.filter(place => {
        const price = place.entryTicketPrice || 0;
        switch (priceRange) {
          case 'free':
            return price === 0;
          case 'low':
            return price > 0 && price <= 20;
          case 'medium':
            return price > 20 && price <= 50;
          case 'high':
            return price > 50;
          default:
            return true;
        }
      });
    }

    setFilteredPlaces(filtered);
  }, [places, searchTerm, selectedCategory, priceRange]);

  const categories = [...new Set(places.map(place => place.category).filter(Boolean))];

  const addToExpenses = (place: TouristPlaces) => {
    // Navigate to add expense page with pre-filled data
    navigate(`/add-expense?category=tourist-places&amount=${place.entryTicketPrice}&description=Entry ticket for ${place.name}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-paragraph text-secondary/70">Loading tourist places...</p>
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
            TOURIST PLACES
          </h1>
          <p className="font-paragraph text-xl text-secondary/80">
            Discover amazing destinations and plan your budget
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
                <Input
                  placeholder="Search places..."
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
                  <SelectItem value="low">$1 - $20</SelectItem>
                  <SelectItem value="medium">$21 - $50</SelectItem>
                  <SelectItem value="high">$50+</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="font-paragraph text-sm text-secondary/70">
                  {filteredPlaces.length} places found
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Places Grid */}
        {filteredPlaces.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-secondary/30 mx-auto mb-4" />
              <h3 className="font-heading text-xl uppercase text-secondary mb-2">
                No Places Found
              </h3>
              <p className="font-paragraph text-secondary/70">
                Try adjusting your filters to see more results
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaces.map((place) => (
              <Card key={place._id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {place.image && (
                  <div className="h-48 overflow-hidden">
                    <Image 
                      src={place.image} 
                      alt={place.name || 'Tourist place'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={400}
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-heading text-xl uppercase text-secondary mb-2">
                        {place.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-secondary/50" />
                        <span className="font-paragraph text-sm text-secondary/70">
                          {place.location}
                        </span>
                      </div>
                      {place.category && (
                        <Badge variant="secondary" className="text-xs">
                          {place.category}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-paragraph text-xs text-secondary/50 mb-1">Entry Fee</div>
                      <div className="font-heading text-2xl text-primary">
                        {place.entryTicketPrice === 0 ? 'Free' : `₹${place.entryTicketPrice} INR`}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="font-paragraph text-secondary/80 text-sm mb-6 line-clamp-3">
                    {place.description}
                  </p>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => addToExpenses(place)}
                      className="flex-1"
                      disabled={!place.entryTicketPrice}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Add to Expenses
                    </Button>
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {filteredPlaces.length > 0 && (
          <Card className="mt-12 bg-primary/5">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="font-heading text-3xl text-primary mb-2">
                    {filteredPlaces.length}
                  </div>
                  <div className="font-paragraph text-sm text-secondary/70">
                    Total Places
                  </div>
                </div>
                <div>
                  <div className="font-heading text-3xl text-secondary mb-2">
                    {filteredPlaces.filter(p => (p.entryTicketPrice || 0) === 0).length}
                  </div>
                  <div className="font-paragraph text-sm text-secondary/70">
                    Free Entry
                  </div>
                </div>
                <div>
                  <div className="font-heading text-3xl text-highlightyellow mb-2">
                    ₹{Math.min(...filteredPlaces.map(p => p.entryTicketPrice || 0).filter(p => p > 0)) || 0} INR
                  </div>
                  <div className="font-paragraph text-sm text-secondary/70">
                    Lowest Price
                  </div>
                </div>
                <div>
                  <div className="font-heading text-3xl text-primary mb-2">
                    ₹{Math.max(...filteredPlaces.map(p => p.entryTicketPrice || 0)) || 0} INR
                  </div>
                  <div className="font-paragraph text-sm text-secondary/70">
                    Highest Price
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
