import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users, Plus, Share2, Copy, UserPlus, DollarSign, Calculator, Link as LinkIcon, QrCode } from 'lucide-react';
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

export default function GroupsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [trips, setTrips] = useState<GroupTrip[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: '',
    description: '',
    currency: 'INR'
  });
  const [joinCode, setJoinCode] = useState('');
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    // Load trips from localStorage
    const savedTrips = localStorage.getItem('groupTrips');
    if (savedTrips) {
      const parsed = JSON.parse(savedTrips);
      setTrips(parsed.map((trip: any) => ({
        ...trip,
        createdAt: new Date(trip.createdAt),
        members: trip.members.map((member: any) => ({
          ...member,
          joinedAt: new Date(member.joinedAt)
        }))
      })));
    }

    // Check if joining via share link or action parameter
    const shareCode = searchParams.get('join');
    const action = searchParams.get('action');
    
    if (shareCode) {
      setJoinCode(shareCode.toUpperCase());
      setIsJoinDialogOpen(true);
      // Clear the URL parameter after setting the code
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('join');
      window.history.replaceState({}, '', newUrl.toString());
    } else if (action === 'join') {
      setIsJoinDialogOpen(true);
      // Clear the URL parameter after opening dialog
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const saveTrips = (newTrips: GroupTrip[]) => {
    localStorage.setItem('groupTrips', JSON.stringify(newTrips));
    setTrips(newTrips);
  };

  const generateShareCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createTrip = () => {
    if (!newTrip.name.trim()) return;

    const trip: GroupTrip = {
      id: crypto.randomUUID(),
      name: newTrip.name,
      description: newTrip.description,
      members: [{
        id: crypto.randomUUID(),
        name: 'You',
        joinedAt: new Date(),
        totalPaid: 0,
        totalOwed: 0
      }],
      createdBy: 'current-user',
      createdAt: new Date(),
      shareCode: generateShareCode(),
      totalExpenses: 0,
      currency: newTrip.currency
    };

    const updatedTrips = [...trips, trip];
    saveTrips(updatedTrips);

    setNewTrip({ name: '', description: '', currency: 'INR' });
    setIsCreateDialogOpen(false);

    toast({
      title: "Trip Created!",
      description: `${trip.name} has been created successfully.`,
    });
  };

  const joinTrip = () => {
    if (!joinCode.trim() || !memberName.trim()) return;

    const trip = trips.find(t => t.shareCode === joinCode.toUpperCase());
    if (!trip) {
      toast({
        title: "Invalid Code",
        description: "The trip code you entered doesn't exist.",
        variant: "destructive"
      });
      return;
    }

    // Check if already a member
    if (trip.members.some(m => m.name.toLowerCase() === memberName.toLowerCase())) {
      toast({
        title: "Already a Member",
        description: "You're already part of this trip.",
        variant: "destructive"
      });
      return;
    }

    const newMember: GroupMember = {
      id: crypto.randomUUID(),
      name: memberName,
      joinedAt: new Date(),
      totalPaid: 0,
      totalOwed: 0
    };

    const updatedTrips = trips.map(t => 
      t.id === trip.id 
        ? { ...t, members: [...t.members, newMember] }
        : t
    );

    saveTrips(updatedTrips);

    setJoinCode('');
    setMemberName('');
    setIsJoinDialogOpen(false);

    toast({
      title: "Joined Trip!",
      description: `You've successfully joined ${trip.name}. Redirecting to trip page...`,
    });

    // Navigate to the trip expenses page after joining
    setTimeout(() => {
      navigate(`/group-expenses?tripId=${trip.id}`);
    }, 1500);
  };

  const shareTrip = (trip: GroupTrip) => {
    const shareUrl = `${window.location.origin}/groups?join=${trip.shareCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join my trip: ${trip.name}`,
        text: `I'm inviting you to join our group trip "${trip.name}". Use code: ${trip.shareCode}`,
        url: shareUrl,
      }).catch((error) => {
        console.log('Error sharing:', error);
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Share link has been copied to clipboard.",
        });
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard.",
      });
    }
  };

  const copyShareCode = (shareCode: string) => {
    navigator.clipboard.writeText(shareCode);
    toast({
      title: "Code Copied!",
      description: "Share code has been copied to clipboard.",
    });
  };

  const getTripBalance = (trip: GroupTrip) => {
    const totalPerPerson = trip.totalExpenses / trip.members.length;
    return trip.members.map(member => ({
      ...member,
      balance: member.totalPaid - totalPerPerson
    }));
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
                GROUP TRIPS
              </h1>
              <p className="font-paragraph text-xl text-secondary/80">
                Create trips, invite friends, and split expenses easily
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Trip
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl uppercase text-secondary">
                      Join a Trip
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="joinCode" className="font-paragraph text-secondary">Trip Code</Label>
                      <Input
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="uppercase text-center text-lg font-mono tracking-wider"
                        autoComplete="off"
                        autoFocus
                      />
                      <p className="font-paragraph text-xs text-secondary/60 mt-1">
                        Enter the 6-character trip code shared with you
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="memberName" className="font-paragraph text-secondary">Your Name</Label>
                      <Input
                        id="memberName"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Enter your name"
                        className="text-lg"
                        autoComplete="name"
                      />
                      <p className="font-paragraph text-xs text-secondary/60 mt-1">
                        This name will be visible to other trip members
                      </p>
                    </div>
                    <Button onClick={joinTrip} className="w-full h-12 text-lg" disabled={!joinCode || !memberName}>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Join Trip
                    </Button>
                    <p className="font-paragraph text-xs text-secondary/60 text-center">
                      You'll be redirected to the trip expense page after joining
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Trip
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl uppercase text-secondary">
                      Create New Trip
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tripName" className="font-paragraph text-secondary">Trip Name</Label>
                      <Input
                        id="tripName"
                        value={newTrip.name}
                        onChange={(e) => setNewTrip(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Goa Beach Trip 2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tripDescription" className="font-paragraph text-secondary">Description (Optional)</Label>
                      <Textarea
                        id="tripDescription"
                        value={newTrip.description}
                        onChange={(e) => setNewTrip(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your trip..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency" className="font-paragraph text-secondary">Currency</Label>
                      <Input
                        id="currency"
                        value={newTrip.currency}
                        onChange={(e) => setNewTrip(prev => ({ ...prev, currency: e.target.value }))}
                        placeholder="INR"
                      />
                    </div>
                    <Button onClick={createTrip} className="w-full" disabled={!newTrip.name}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Trip
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-secondary/30 mx-auto mb-6" />
              <h3 className="font-heading text-2xl uppercase text-secondary mb-4">
                No Group Trips Yet
              </h3>
              <p className="font-paragraph text-secondary/70 mb-8 max-w-md mx-auto">
                Create your first group trip to start splitting expenses with friends and family.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Trip
                </Button>
                <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)} size="lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Existing Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => {
              const balances = getTripBalance(trip);
              const yourBalance = balances.find(b => b.name === 'You')?.balance || 0;
              
              return (
                <Card key={trip.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-heading text-xl uppercase text-secondary mb-2">
                          {trip.name}
                        </CardTitle>
                        {trip.description && (
                          <p className="font-paragraph text-sm text-secondary/70 mb-3">
                            {trip.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {trip.members.length} members
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {trip.currency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Trip Stats */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/5 rounded-lg">
                        <div className="text-center">
                          <div className="font-heading text-lg text-primary">
                            ₹{trip.totalExpenses.toFixed(2)}
                          </div>
                          <div className="font-paragraph text-xs text-secondary/70">
                            Total Expenses
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`font-heading text-lg ${yourBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {yourBalance >= 0 ? '+' : ''}₹{yourBalance.toFixed(2)}
                          </div>
                          <div className="font-paragraph text-xs text-secondary/70">
                            Your Balance
                          </div>
                        </div>
                      </div>

                      {/* Members */}
                      <div>
                        <h4 className="font-heading text-sm uppercase text-secondary mb-2">Members</h4>
                        <div className="space-y-1">
                          {trip.members.slice(0, 3).map((member) => (
                            <div key={member.id} className="flex items-center justify-between text-sm">
                              <span className="font-paragraph text-secondary/80">{member.name}</span>
                              <span className="font-paragraph text-xs text-secondary/60">
                                ₹{member.totalPaid.toFixed(0)}
                              </span>
                            </div>
                          ))}
                          {trip.members.length > 3 && (
                            <div className="font-paragraph text-xs text-secondary/60">
                              +{trip.members.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Share Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-paragraph text-sm text-secondary/70">Share Code</span>
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm bg-secondary/10 px-2 py-1 rounded">
                              {trip.shareCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyShareCode(trip.shareCode)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareTrip(trip)}
                            className="flex-1"
                          >
                            <Share2 className="mr-1 h-3 w-3" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/group-expenses?tripId=${trip.id}`)}
                            className="flex-1"
                          >
                            <Calculator className="mr-1 h-3 w-3" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        {trips.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-primary mb-2">
                  {trips.length}
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Active Trips
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/5">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-secondary mb-2">
                  {trips.reduce((sum, trip) => sum + trip.members.length, 0)}
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Total Members
                </div>
              </CardContent>
            </Card>

            <Card className="bg-highlightyellow/20">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-3xl text-highlightyellow mb-2">
                  ₹{trips.reduce((sum, trip) => sum + trip.totalExpenses, 0).toFixed(0)}
                </div>
                <div className="font-paragraph text-sm text-secondary/70">
                  Total Group Expenses
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
