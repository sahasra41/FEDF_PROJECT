import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Currencies } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  category: string;
  subcategory: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  location?: string;
}

const expenseCategories = {
  food: {
    name: 'Food & Dining',
    subcategories: ['Restaurant', 'Street Food', 'Groceries', 'Snacks', 'Beverages', 'Fine Dining']
  },
  travel: {
    name: 'Transportation',
    subcategories: ['Flight', 'Train', 'Bus', 'Car Rental', 'Taxi/Uber', 'Bike', 'Walking', 'Other']
  },
  accommodation: {
    name: 'Accommodation',
    subcategories: ['Hotel', 'Hostel', 'Airbnb', 'Resort', 'Guesthouse', 'Camping']
  },
  activities: {
    name: 'Activities',
    subcategories: ['Swimming', 'Hiking', 'Boating', 'Trekking', 'Campfire', 'Tours', 'Museums', 'Entertainment']
  },
  shopping: {
    name: 'Shopping',
    subcategories: ['Souvenirs', 'Clothing', 'Electronics', 'Local Crafts', 'Gifts', 'Personal Items']
  },
  guide: {
    name: 'Guide Services',
    subcategories: ['Tour Guide', 'Local Guide', 'Audio Guide', 'Group Tour', 'Private Tour']
  },
  'tourist-places': {
    name: 'Tourist Places',
    subcategories: ['Beaches', 'Mountains', 'Waterfalls', 'Museums', 'Monuments', 'Parks', 'Temples']
  },
  'local-vehicles': {
    name: 'Local Vehicles',
    subcategories: ['Rickshaw', 'Scooter', 'Bicycle', 'Local Bus', 'Metro', 'Ferry']
  }
};

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY'];

export default function AddExpensePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currencies[]>([]);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({
    category: searchParams.get('category') || '',
    subcategory: '',
    amount: 0,
    currency: 'INR',
    description: '',
    date: new Date(),
    location: ''
  });
  const [isDateOpen, setIsDateOpen] = useState(false);

  useEffect(() => {
    // Load existing expenses from localStorage
    const savedExpenses = localStorage.getItem('travelExpenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpenses(parsed.map((exp: any) => ({ ...exp, date: new Date(exp.date) })));
    }

    // Load currencies from CMS
    const fetchCurrencies = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Currencies>('currencies');
        setCurrencies(items);
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    fetchCurrencies();
  }, []);

  const saveExpenses = (newExpenses: Expense[]) => {
    localStorage.setItem('travelExpenses', JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  const addExpense = () => {
    if (!currentExpense.category || !currentExpense.subcategory || !currentExpense.amount) {
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      category: currentExpense.category,
      subcategory: currentExpense.subcategory,
      amount: currentExpense.amount,
      currency: currentExpense.currency || 'INR',
      description: currentExpense.description || '',
      date: currentExpense.date || new Date(),
      location: currentExpense.location || ''
    };

    const updatedExpenses = [...expenses, newExpense];
    saveExpenses(updatedExpenses);

    // Reset form
    setCurrentExpense({
      category: currentExpense.category,
      subcategory: '',
      amount: 0,
      currency: 'INR',
      description: '',
      date: new Date(),
      location: ''
    });
  };

  const removeExpense = (id: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    saveExpenses(updatedExpenses);
  };

  const convertToINR = (amount: number, currency: string): number => {
    if (currency === 'INR') return amount;
    
    const currencyData = currencies.find(c => c.currencyCode === currency);
    if (!currencyData || !currencyData.exchangeRate) return amount;
    
    // Convert to base currency first, then to INR
    const inrData = currencies.find(c => c.currencyCode === 'INR');
    const inrRate = inrData?.exchangeRate || 1;
    
    const baseAmount = amount / currencyData.exchangeRate;
    return baseAmount * inrRate;
  };

  const getTotalByCategory = () => {
    const totals: Record<string, number> = {};
    expenses.forEach(expense => {
      if (!totals[expense.category]) {
        totals[expense.category] = 0;
      }
      // Convert to INR for consistent totals
      const amountInINR = convertToINR(expense.amount, expense.currency);
      totals[expense.category] += amountInINR;
    });
    return totals;
  };

  const categoryTotals = getTotalByCategory();
  const grandTotal = expenses.reduce((sum, exp) => {
    const amountInINR = convertToINR(exp.amount, exp.currency);
    return sum + amountInINR;
  }, 0);

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
            ADD EXPENSE
          </h1>
          <p className="font-paragraph text-xl text-secondary/80">
            Track your travel expenses across different categories
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Expense Form */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-heading text-2xl uppercase text-secondary">
                  New Expense
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="font-paragraph text-secondary">Category</Label>
                    <Select 
                      value={currentExpense.category} 
                      onValueChange={(value) => setCurrentExpense(prev => ({ ...prev, category: value, subcategory: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(expenseCategories).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subcategory" className="font-paragraph text-secondary">Subcategory</Label>
                    <Select 
                      value={currentExpense.subcategory} 
                      onValueChange={(value) => setCurrentExpense(prev => ({ ...prev, subcategory: value }))}
                      disabled={!currentExpense.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentExpense.category && expenseCategories[currentExpense.category as keyof typeof expenseCategories]?.subcategories.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="font-paragraph text-secondary">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={currentExpense.amount || ''}
                      onChange={(e) => setCurrentExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="font-paragraph text-secondary">Currency</Label>
                    <Select 
                      value={currentExpense.currency} 
                      onValueChange={(value) => setCurrentExpense(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.length > 0 ? (
                          currencies.map((currency) => (
                            <SelectItem key={currency._id} value={currency.currencyCode || ''}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{currency.currencyCode}</span>
                                <span className="text-sm text-secondary/70">
                                  {currency.currencySymbol}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY'].map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-paragraph text-secondary">Date</Label>
                    <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentExpense.date ? format(currentExpense.date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={currentExpense.date}
                          onSelect={(date) => {
                            setCurrentExpense(prev => ({ ...prev, date: date || new Date() }));
                            setIsDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="location" className="font-paragraph text-secondary">Location (Optional)</Label>
                    <Input
                      id="location"
                      value={currentExpense.location || ''}
                      onChange={(e) => setCurrentExpense(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Where did you spend this?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="font-paragraph text-secondary">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={currentExpense.description || ''}
                    onChange={(e) => setCurrentExpense(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add notes about this expense..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={addExpense}
                  className="w-full"
                  disabled={!currentExpense.category || !currentExpense.subcategory || !currentExpense.amount}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            {expenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-2xl uppercase text-secondary">
                    Recent Expenses ({expenses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenses.slice(-10).reverse().map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {expenseCategories[expense.category as keyof typeof expenseCategories]?.name}
                            </Badge>
                            <span className="font-paragraph text-sm text-secondary/70">
                              {expense.subcategory}
                            </span>
                          </div>
                          <div className="font-paragraph text-sm text-secondary/80">
                            {format(expense.date, 'MMM dd, yyyy')}
                            {expense.location && ` • ${expense.location}`}
                          </div>
                          {expense.description && (
                            <p className="font-paragraph text-sm text-secondary/60 mt-1">
                              {expense.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-heading text-lg text-primary">
                            ₹{expense.amount.toFixed(2)} {expense.currency}
                            {expense.currency !== 'INR' && (
                              <span className="text-sm text-secondary/60 block">
                                ≈ ₹{convertToINR(expense.amount, expense.currency).toFixed(2)} INR
                              </span>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExpense(expense.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase text-secondary">
                  Expense Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-primary/5 rounded-lg">
                  <div className="font-paragraph text-sm text-secondary/70 mb-2">Total Expenses</div>
                  <div className="font-heading text-3xl text-primary">
                    ₹{grandTotal.toFixed(2)} INR
                  </div>
                  <div className="font-paragraph text-xs text-secondary/60 mt-1">
                    {expenses.length} transactions
                  </div>
                </div>

                {Object.keys(categoryTotals).length > 0 && (
                  <div>
                    <h3 className="font-heading text-sm uppercase text-secondary mb-4">
                      By Category
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(categoryTotals).map(([category, total]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="font-paragraph text-sm text-secondary/80">
                            {expenseCategories[category as keyof typeof expenseCategories]?.name}
                          </span>
                          <span className="font-paragraph text-sm font-medium text-secondary">
                            ₹{total.toFixed(2)} INR
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/budget')}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    View Budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
