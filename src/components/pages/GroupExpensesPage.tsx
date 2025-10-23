
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, DollarSign, Users, Calculator, Share2, Receipt, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface GroupTrip {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  createdBy: string;
  createdAt: Date;
  shareCode: string;
  totalExpenses: number;
  currency: string;
}

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  joinedAt: Date;
  totalPaid: number;
  totalOwed: number;
}

interface GroupExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitAmong: string[];
  category: string;
  date: Date;
  receipt?: string;
}

const expenseCategories = {
  food: 'Food & Dining',
  travel: 'Transportation',
  accommodation: 'Accommodation',
  activities: 'Activities',
  shopping: 'Shopping',
  guide: 'Guide Services',
  'tourist-places': 'Tourist Places',
  'local-vehicles': 'Local Vehicles'
};

export default function GroupExpensesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const tripId = searchParams.get('tripId');
  
  const [trip, setTrip] = useState<GroupTrip | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'food',
    paidBy: '',
    splitAmong: [] as string[]
  });

  useEffect(() => {
    if (!tripId) {
      navigate('/groups');
      return;
    }

    // Load trip data
    const savedTrips = localStorage.getItem('groupTrips');
    if (savedTrips) {
      const trips = JSON.parse(savedTrips);
      const foundTrip = trips.find((t: any) => t.id === tripId);
      if (foundTrip) {
        setTrip({
          ...foundTrip,
          createdAt: new Date(foundTrip.createdAt),
          members: foundTrip.members.map((member: any) => ({
            ...member,
            joinedAt: new Date(member.joinedAt)
          }))
        });
        setNewExpense(prev => ({ ...prev, paidBy: foundTrip.members[0]?.id || '' }));
      } else {
        navigate('/groups');
        return;
      }
    }

    // Load expenses
    const savedExpenses = localStorage.getItem('groupExpenses');
    if (savedExpenses) {
      const allExpenses = JSON.parse(savedExpenses);
      const tripExpenses = allExpenses
        .filter((exp: any) => exp.tripId === tripId)
        .map((exp: any) => ({ ...exp, date: new Date(exp.date) }));
      setExpenses(tripExpenses);
    }
  }, [tripId, navigate]);

  const saveExpenses = (newExpenses: GroupExpense[]) => {
    // Save to localStorage
    const savedExpenses = localStorage.getItem('groupExpenses');
    const allExpenses = savedExpenses ? JSON.parse(savedExpenses) : [];
    
    // Remove old expenses for this trip and add new ones
    const otherExpenses = allExpenses.filter((exp: any) => exp.tripId !== tripId);
    const updatedExpenses = [...otherExpenses, ...newExpenses];
    
    localStorage.setItem('groupExpenses', JSON.stringify(updatedExpenses));
    setExpenses(newExpenses);

    // Update trip totals
    if (trip) {
      const totalExpenses = newExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const updatedTrip = { ...trip, totalExpenses };
      
      const savedTrips = localStorage.getItem('groupTrips');
      if (savedTrips) {
        const trips = JSON.parse(savedTrips);
        const updatedTrips = trips.map((t: any) => 
          t.id === tripId ? updatedTrip : t
        );
        localStorage.setItem('groupTrips', JSON.stringify(updatedTrips));
        setTrip(updatedTrip);
      }
    }
  };

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy || !trip) return;

    const expense: GroupExpense = {
      id: crypto.randomUUID(),
      tripId: trip.id,
      description: newExpense.description,
      amount: newExpense.amount,
      currency: trip.currency,
      paidBy: newExpense.paidBy,
      splitAmong: newExpense.splitAmong.length > 0 ? newExpense.splitAmong : trip.members.map(m => m.id),
      category: newExpense.category,
      date: new Date()
    };

    const updatedExpenses = [...expenses, expense];
    saveExpenses(updatedExpenses);

    // Reset form
    setNewExpense({
      description: '',
      amount: 0,
      category: 'food',
      paidBy: trip.members[0]?.id || '',
      splitAmong: []
    });
    setIsAddExpenseOpen(false);

    toast({
      title: "Expense Added!",
      description: `${expense.description} has been added to the trip.`,
    });
  };

  const deleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    saveExpenses(updatedExpenses);

    toast({
      title: "Expense Deleted",
      description: "The expense has been removed from the trip.",
    });
  };

  const calculateBalances = () => {
    if (!trip) return [];

    const balances = trip.members.map(member => ({
      ...member,
      totalPaid: 0,
      totalOwed: 0,
      balance: 0
    }));

    expenses.forEach(expense => {
      // Add to paid amount for the person who paid
      const payer = balances.find(b => b.id === expense.paidBy);
      if (payer) {
        payer.totalPaid += expense.amount;
      }

      // Calculate split amount
      const splitAmount = expense.amount / expense.splitAmong.length;
      
      // Add to owed amount for each person in the split
      expense.splitAmong.forEach(memberId => {
        const member = balances.find(b => b.id === memberId);
        if (member) {
          member.totalOwed += splitAmount;
        }
      });
    });

    // Calculate final balance (positive = owed money, negative = owes money)
    balances.forEach(balance => {
      balance.balance = balance.totalPaid - balance.totalOwed;
    });

    return balances;
  };

  const shareTrip = () => {
    if (!trip) return;

    const shareUrl = `${window.location.origin}/groups?join=${trip.shareCode}`;
    const balances = calculateBalances();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const shareText = `Trip: ${trip.name}
Total Expenses: ₹${totalExpenses.toFixed(2)} ${trip.currency}
Members: ${trip.members.length}
Join with code: ${trip.shareCode}

${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: `Trip Expenses: ${trip.name}`,
        text: shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Details Copied!",
        description: "Trip details and link copied to clipboard.",
      });
    }
  };

  const toggleSplitMember = (memberId: string) => {
    setNewExpense(prev => ({
      ...prev,
      splitAmong: prev.splitAmong.includes(memberId)
        ? prev.splitAmong.filter(id => id !== memberId)
        : [...prev.splitAmong, memberId]
    }));
  };

  const balances = calculateBalances();
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-paragraph text-secondary/70">Loading trip...</p>
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
            onClick={() => navigate('/groups')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl uppercase text-secondary mb-4">
                {trip.name}
              </h1>
              <p className="font-paragraph text-xl text-secondary/80">
                Manage expenses and split bills with your group
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={shareTrip}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Trip
              </Button>
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl uppercase text-secondary">
                      Add Group Expense
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="description" className="font-paragraph text-secondary">Description</Label>
                        <Input
                          id="description"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="What was this expense for?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount" className="font-paragraph text-secondary">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newExpense.amount || ''}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-paragraph text-secondary">Category</Label>
                        <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(expenseCategories).map(([key, name]) => (
                              <SelectItem key={key} value={key}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-paragraph text-secondary">Paid By</Label>
                        <Select value={newExpense.paidBy} onValueChange={(value) => setNewExpense(prev => ({ ...prev, paidBy: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Who paid?" />
                          </SelectTrigger>
                          <SelectContent>
                            {trip.members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="font-paragraph text-secondary mb-3 block">Split Among</Label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {trip.members.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`split-${member.id}`}
                              checked={newExpense.splitAmong.length === 0 || newExpense.splitAmong.includes(member.id)}
                              onCheckedChange={() => toggleSplitMember(member.id)}
                            />
                            <Label htmlFor={`split-${member.id}`} className="font-paragraph text-sm">
                              {member.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="font-paragraph text-xs text-secondary/60 mt-2">
                        {newExpense.splitAmong.length === 0 ? 'All members' : `${newExpense.splitAmong.length} members`} selected
                        {newExpense.amount > 0 && (
                          <span className="ml-2">
                            (₹{(newExpense.amount / (newExpense.splitAmong.length || trip.members.length)).toFixed(2)} each)
                          </span>
                        )}
                      </p>
                    </div>

                    <Button onClick={addExpense} className="w-full" disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Expenses List */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-heading text-2xl uppercase text-secondary">
                  Expenses ({expenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-secondary/30 mx-auto mb-4" />
                    <p className="font-paragraph text-secondary/70">No expenses added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {expenses.map((expense) => {
                      const payer = trip.members.find(m => m.id === expense.paidBy);
                      const splitCount = expense.splitAmong.length;
                      const amountPerPerson = expense.amount / splitCount;
                      
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-paragraph font-medium text-secondary">
                                {expense.description}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {expenseCategories[expense.category as keyof typeof expenseCategories]}
                              </Badge>
                            </div>
                            <div className="font-paragraph text-sm text-secondary/70">
                              Paid by {payer?.name} • Split among {splitCount} people
                            </div>
                            <div className="font-paragraph text-xs text-secondary/60">
                              {format(expense.date, 'MMM dd, yyyy')} • ₹{amountPerPerson.toFixed(2)} per person
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-heading text-lg text-primary">
                              ₹{expense.amount.toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExpense(expense.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Trip Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase text-secondary">
                  Trip Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="font-paragraph text-sm text-secondary/70 mb-1">Total Expenses</div>
                    <div className="font-heading text-2xl text-primary">
                      ₹{totalExpenses.toFixed(2)}
                    </div>
                    <div className="font-paragraph text-xs text-secondary/60">
                      {trip.currency} • {expenses.length} transactions
                    </div>
                  </div>

                  <div className="text-center p-4 bg-secondary/5 rounded-lg">
                    <div className="font-paragraph text-sm text-secondary/70 mb-1">Per Person</div>
                    <div className="font-heading text-xl text-secondary">
                      ₹{(totalExpenses / trip.members.length).toFixed(2)}
                    </div>
                    <div className="font-paragraph text-xs text-secondary/60">
                      Split equally among {trip.members.length}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-paragraph text-sm text-secondary/70">Share Code</span>
                      <code className="font-mono text-sm bg-secondary/10 px-2 py-1 rounded">
                        {trip.shareCode}
                      </code>
                    </div>
                    <Button onClick={shareTrip} variant="outline" className="w-full">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Trip Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase text-secondary">
                  Member Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={balance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-paragraph text-sm font-medium text-secondary">
                          {balance.name}
                        </div>
                        <div className="font-paragraph text-xs text-secondary/60">
                          Paid: ₹{balance.totalPaid.toFixed(2)} • Owes: ₹{balance.totalOwed.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-heading text-sm ${balance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balance.balance >= 0 ? '+' : ''}₹{balance.balance.toFixed(2)}
                        </div>
                        <div className="font-paragraph text-xs text-secondary/60">
                          {balance.balance >= 0 ? 'Gets back' : 'Owes'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
