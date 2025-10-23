import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Currencies } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, PieChart, BarChart3, Share2, Download, AlertTriangle } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

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

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currencies[]>([]);
  const [timeRange, setTimeRange] = useState('all');
  const [budget] = useState(5000); // Default budget

  useEffect(() => {
    // Load expenses from localStorage
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

  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      default:
        return expenses;
    }

    return expenses.filter(expense => expense.date >= startDate);
  };

  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, exp) => {
    const amountInINR = convertToINR(exp.amount, exp.currency);
    return sum + amountInINR;
  }, 0);
  const averageDaily = filteredExpenses.length > 0 ? totalExpenses / Math.max(1, Math.ceil((Date.now() - Math.min(...filteredExpenses.map(e => e.date.getTime()))) / (1000 * 60 * 60 * 24))) : 0;

  // Category breakdown
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    const amountInINR = convertToINR(expense.amount, expense.currency);
    acc[expense.category] = (acc[expense.category] || 0) + amountInINR;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: expenseCategories[category as keyof typeof expenseCategories]?.name || category,
    value: amount,
    category,
    percentage: ((amount / totalExpenses) * 100).toFixed(1)
  }));

  // Daily spending trend
  const dailySpending = filteredExpenses.reduce((acc, expense) => {
    const dateKey = format(expense.date, 'yyyy-MM-dd');
    const amountInINR = convertToINR(expense.amount, expense.currency);
    acc[dateKey] = (acc[dateKey] || 0) + amountInINR;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.entries(dailySpending)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: format(new Date(date), 'MMM dd'),
      amount,
      cumulative: 0
    }));

  // Calculate cumulative spending
  let cumulative = 0;
  trendData.forEach(item => {
    cumulative += item.amount;
    item.cumulative = cumulative;
  });

  // Top spending categories
  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({
      category: expenseCategories[category as keyof typeof expenseCategories]?.name || category,
      amount,
      percentage: ((amount / totalExpenses) * 100).toFixed(1)
    }));

  // Budget analysis
  const budgetUsed = (totalExpenses / budget) * 100;
  const remainingBudget = budget - totalExpenses;
  const isOverBudget = totalExpenses > budget;

  // Spending insights
  const getSpendingInsights = () => {
    const insights = [];
    
    if (isOverBudget) {
      insights.push({
        type: 'warning',
        title: 'Budget Exceeded',
        description: `You've exceeded your budget by ₹${(totalExpenses - budget).toFixed(2)} INR`,
        icon: AlertTriangle
      });
    }

    const topCategory = topCategories[0];
    if (topCategory && parseFloat(topCategory.percentage) > 40) {
      insights.push({
        type: 'info',
        title: 'High Category Spending',
        description: `${topCategory.category} accounts for ${topCategory.percentage}% of your expenses`,
        icon: PieChart
      });
    }

    if (averageDaily > 0) {
      insights.push({
        type: 'info',
        title: 'Daily Average',
        description: `You're spending an average of $${averageDaily.toFixed(2)} per day`,
        icon: TrendingUp
      });
    }

    return insights;
  };

  const insights = getSpendingInsights();

  const shareAnalytics = () => {
    const shareData = {
      totalExpenses: totalExpenses.toFixed(2),
      topCategory: topCategories[0]?.category || 'N/A',
      budgetStatus: isOverBudget ? 'Over Budget' : 'Within Budget',
      timeRange
    };
    
    if (navigator.share) {
      navigator.share({
        title: 'Travel Expense Analytics',
        text: `I've spent ₹${shareData.totalExpenses} INR on my trip. Top category: ${shareData.topCategory}. ${shareData.budgetStatus}.`,
      });
    } else {
      // Fallback: copy to clipboard
      const text = `Travel Expense Analytics\nTotal: ₹${shareData.totalExpenses} INR\nTop Category: ${shareData.topCategory}\nStatus: ${shareData.budgetStatus}`;
      navigator.clipboard.writeText(text);
    }
  };

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
                EXPENSE ANALYTICS
              </h1>
              <p className="font-paragraph text-xl text-secondary/80">
                Detailed insights into your travel spending patterns
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={shareAnalytics}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className={isOverBudget ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <DollarSign className={`h-8 w-8 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`} />
                {isOverBudget && <AlertTriangle className="h-5 w-5 text-red-500" />}
              </div>
              <div className="mt-4">
                <div className="font-heading text-2xl text-secondary">
                  ₹{totalExpenses.toFixed(2)} INR
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Total Spent ({filteredExpenses.length} transactions)
                </div>
                <div className={`font-paragraph text-xs mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetUsed.toFixed(1)}% of budget used
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-primary mb-4" />
              <div className="font-heading text-2xl text-secondary">
                ₹{averageDaily.toFixed(2)} INR
              </div>
              <div className="font-paragraph text-sm text-secondary/70">
                Average Daily Spending
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <PieChart className="h-8 w-8 text-highlightyellow mb-4" />
              <div className="font-heading text-2xl text-secondary">
                {topCategories[0]?.category || 'N/A'}
              </div>
              <div className="font-paragraph text-sm text-secondary/70">
                Top Spending Category
              </div>
              <div className="font-paragraph text-xs text-primary mt-1">
                {topCategories[0]?.percentage || '0'}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <TrendingDown className={`h-8 w-8 mb-4 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className={`font-heading text-2xl ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(remainingBudget).toFixed(2)} INR
              </div>
              <div className="font-paragraph text-sm text-secondary/70">
                {remainingBudget >= 0 ? 'Remaining Budget' : 'Over Budget'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Spending by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl uppercase text-secondary flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending by Category
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
                      label={({ name, percentage }) => `${name} ${percentage}%`}
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

          {/* Spending Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl uppercase text-secondary flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Spending Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value} INR`, '']} />
                    <Area type="monotone" dataKey="amount" stroke="#D12318" fill="#D12318" fillOpacity={0.3} name="Daily" />
                    <Area type="monotone" dataKey="cumulative" stroke="#3E1F0D" fill="#3E1F0D" fillOpacity={0.1} name="Cumulative" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-secondary/50">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-paragraph">No trend data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights and Top Categories */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl uppercase text-secondary">
                Spending Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${
                        insight.type === 'warning' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${
                            insight.type === 'warning' ? 'text-red-600' : 'text-blue-600'
                          }`} />
                          <div>
                            <h3 className="font-heading text-sm uppercase text-secondary mb-1">
                              {insight.title}
                            </h3>
                            <p className="font-paragraph text-sm text-secondary/80">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-secondary/30 mx-auto mb-4" />
                  <p className="font-paragraph text-secondary/70">
                    Add more expenses to see insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl uppercase text-secondary">
                Top Spending Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCategories.length > 0 ? (
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <div>
                          <div className="font-paragraph text-sm font-medium text-secondary">
                            {category.category}
                          </div>
                          <div className="font-paragraph text-xs text-secondary/70">
                            {category.percentage}% of total
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-lg text-primary">
                          ₹{category.amount.toFixed(2)} INR
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-secondary/30 mx-auto mb-4" />
                  <p className="font-paragraph text-secondary/70">
                    No category data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
