import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Currencies } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Edit, AlertTriangle, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

interface Budget {
  total: number;
  categories: Record<string, number>;
}

const expenseCategories = {
  food: { name: 'Food & Dining', color: '#D12318' },
  travel: { name: 'Transportation', color: '#3E1F0D' },
  accommodation: { name: 'Accommodation', color: '#B9B04A' },
  activities: { name: 'Activities', color: '#6366f1' },
  shopping: { name: 'Shopping', color: '#8B5CF6' },
  guide: { name: 'Guide Services', color: '#10B981' },
  'tourist-places': { name: 'Tourist Places', color: '#F59E0B' },
  'local-vehicles': { name: 'Local Vehicles', color: '#EF4444' }
};

const COLORS = ['#D12318', '#3E1F0D', '#B9B04A', '#6366f1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function BudgetPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currencies[]>([]);
  const [budget, setBudget] = useState<Budget>({ total: 5000, categories: {} });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState<Budget>({ total: 5000, categories: {} });

  useEffect(() => {
    // Load expenses from localStorage
    const savedExpenses = localStorage.getItem('travelExpenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpenses(parsed.map((exp: any) => ({ ...exp, date: new Date(exp.date) })));
    }

    // Load budget from localStorage
    const savedBudget = localStorage.getItem('travelBudget');
    if (savedBudget) {
      const parsed = JSON.parse(savedBudget);
      setBudget(parsed);
      setTempBudget(parsed);
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

  const saveBudget = (newBudget: Budget) => {
    localStorage.setItem('travelBudget', JSON.stringify(newBudget));
    setBudget(newBudget);
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
  const totalExpenses = expenses.reduce((sum, exp) => {
    const amountInINR = convertToINR(exp.amount, exp.currency);
    return sum + amountInINR;
  }, 0);
  const budgetUsed = (totalExpenses / budget.total) * 100;
  const remainingBudget = budget.total - totalExpenses;

  // Prepare data for charts
  const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: expenseCategories[category as keyof typeof expenseCategories]?.name || category,
    value: amount,
    category
  }));

  const barData = Object.entries(expenseCategories).map(([key, category]) => ({
    category: category.name,
    spent: categoryTotals[key] || 0,
    budget: budget.categories[key] || 0,
    remaining: Math.max(0, (budget.categories[key] || 0) - (categoryTotals[key] || 0))
  }));

  const handleBudgetSave = () => {
    saveBudget(tempBudget);
    setIsEditingBudget(false);
  };

  const updateCategoryBudget = (category: string, amount: number) => {
    setTempBudget(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: amount
      }
    }));
  };

  const getBudgetStatus = () => {
    if (budgetUsed > 100) return { status: 'over', color: 'text-red-600', bg: 'bg-red-50' };
    if (budgetUsed > 90) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (budgetUsed > 70) return { status: 'caution', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const budgetStatus = getBudgetStatus();

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl uppercase text-secondary mb-4">
                BUDGET MANAGEMENT
              </h1>
              <p className="font-paragraph text-xl text-secondary/80">
                Track your spending and manage your travel budget
              </p>
            </div>
            <Dialog open={isEditingBudget} onOpenChange={setIsEditingBudget}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl uppercase text-secondary">
                    Edit Budget
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="totalBudget" className="font-paragraph text-secondary">Total Budget</Label>
                    <Input
                      id="totalBudget"
                      type="number"
                      value={tempBudget.total}
                      onChange={(e) => setTempBudget(prev => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
                      className="text-lg"
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-heading text-lg uppercase text-secondary mb-4">Category Budgets</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(expenseCategories).map(([key, category]) => (
                        <div key={key}>
                          <Label className="font-paragraph text-secondary text-sm">{category.name}</Label>
                          <Input
                            type="number"
                            value={tempBudget.categories[key] || ''}
                            onChange={(e) => updateCategoryBudget(key, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={handleBudgetSave} className="flex-1">
                      Save Budget
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingBudget(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card className={`${budgetStatus.bg} border-2`}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className={`h-8 w-8 ${budgetStatus.color}`} />
                {budgetStatus.status === 'over' && <AlertTriangle className="h-6 w-6 text-red-500" />}
              </div>
              <div className="space-y-2">
                <p className="font-paragraph text-sm text-secondary/70">Total Budget</p>
                <p className="font-heading text-3xl text-secondary">₹{budget.total.toLocaleString()} INR</p>
                <p className="font-paragraph text-sm text-secondary/60">
                  {budgetUsed.toFixed(1)}% used
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-paragraph text-sm text-secondary/70">Total Spent</p>
                <p className="font-heading text-3xl text-primary">₹{totalExpenses.toLocaleString()} INR</p>
                <p className="font-paragraph text-sm text-secondary/60">
                  {expenses.length} transactions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <TrendingDown className={`h-8 w-8 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="space-y-2">
                <p className="font-paragraph text-sm text-secondary/70">Remaining</p>
                <p className={`font-heading text-3xl ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{Math.abs(remainingBudget).toLocaleString()} INR
                </p>
                <p className="font-paragraph text-sm text-secondary/60">
                  {remainingBudget >= 0 ? 'Under budget' : 'Over budget'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-2xl uppercase text-secondary">
              Budget Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-paragraph text-secondary">Overall Progress</span>
                  <span className="font-paragraph text-sm text-secondary/70">
                    ₹{totalExpenses.toLocaleString()} INR / ₹{budget.total.toLocaleString()} INR
                  </span>
                </div>
                <Progress 
                  value={Math.min(budgetUsed, 100)} 
                  className="h-3"
                />
                {budgetUsed > 100 && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-paragraph text-sm">
                      You've exceeded your budget by ₹{(totalExpenses - budget.total).toLocaleString()} INR
                    </span>
                  </div>
                )}
              </div>

              {/* Category Progress */}
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(expenseCategories).map(([key, category]) => {
                  const spent = categoryTotals[key] || 0;
                  const budgeted = budget.categories[key] || 0;
                  const progress = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-paragraph text-sm text-secondary">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-paragraph text-xs text-secondary/70">
                            ₹{spent.toFixed(0)} INR / ₹{budgeted.toFixed(0)} INR
                          </span>
                          {progress > 100 && (
                            <Badge variant="destructive" className="text-xs">
                              Over
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl uppercase text-secondary flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Expense Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value} INR`, 'Amount']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-secondary/50">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-paragraph">No expenses to display</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl uppercase text-secondary flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Budget vs Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value} INR`, '']} />
                  <Legend />
                  <Bar dataKey="budget" fill="#B9B04A" name="Budget" />
                  <Bar dataKey="spent" fill="#D12318" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
