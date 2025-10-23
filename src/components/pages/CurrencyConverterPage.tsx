import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import { Currencies } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpDown, Calculator, TrendingUp, Globe, RefreshCw } from 'lucide-react';

interface ConversionHistory {
  id: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  result: number;
  rate: number;
  timestamp: Date;
}

export default function CurrencyConverterPage() {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState<Currencies[]>([]);
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number>(0);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { items } = await BaseCrudService.getAll<Currencies>('currencies');
        setCurrencies(items);
        
        // Set default currencies if available
        const usd = items.find(c => c.currencyCode === 'USD');
        const eur = items.find(c => c.currencyCode === 'EUR');
        
        if (usd) setFromCurrency(usd.currencyCode || 'USD');
        if (eur) setToCurrency(eur.currencyCode || 'EUR');
      } catch (error) {
        console.error('Error fetching currencies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();

    // Load conversion history from localStorage
    const savedHistory = localStorage.getItem('conversionHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setConversionHistory(parsed.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
    }
  }, []);

  const saveConversionHistory = (newHistory: ConversionHistory[]) => {
    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
    setConversionHistory(newHistory);
  };

  const convertCurrency = () => {
    const fromCurrencyData = currencies.find(c => c.currencyCode === fromCurrency);
    const toCurrencyData = currencies.find(c => c.currencyCode === toCurrency);

    if (!fromCurrencyData || !toCurrencyData) return;

    // Calculate conversion using exchange rates
    // Assuming exchange rates are relative to a base currency
    const fromRate = fromCurrencyData.exchangeRate || 1;
    const toRate = toCurrencyData.exchangeRate || 1;
    
    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromRate;
    const convertedAmount = baseAmount * toRate;
    
    setResult(convertedAmount);

    // Add to history
    const newConversion: ConversionHistory = {
      id: crypto.randomUUID(),
      amount,
      fromCurrency,
      toCurrency,
      result: convertedAmount,
      rate: toRate / fromRate,
      timestamp: new Date()
    };

    const updatedHistory = [newConversion, ...conversionHistory.slice(0, 9)]; // Keep last 10
    saveConversionHistory(updatedHistory);
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    
    // If there's a result, swap it with the amount
    if (result > 0) {
      setAmount(result);
      setResult(amount);
    }
  };

  const addToExpenses = () => {
    if (result > 0) {
      navigate(`/add-expense?amount=${result.toFixed(2)}&description=Converted from ${amount} ${fromCurrency} to ${toCurrency}`);
    }
  };

  const getPopularCurrencies = () => {
    return currencies.filter(c => 
      ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].includes(c.currencyCode || '')
    );
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    const currency = currencies.find(c => c.currencyCode === currencyCode);
    const symbol = currency?.currencySymbol || currencyCode;
    return `${symbol}${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-paragraph text-secondary/70">Loading currencies...</p>
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
            CURRENCY CONVERTER
          </h1>
          <p className="font-paragraph text-xl text-secondary/80">
            Convert currencies for international travel expenses
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Converter */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-heading text-2xl uppercase text-secondary flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Currency Converter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount" className="font-paragraph text-secondary">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                    className="text-2xl h-14"
                  />
                </div>

                {/* Currency Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-paragraph text-secondary">From</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency._id} value={currency.currencyCode || ''}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{currency.currencyCode}</span>
                              <span className="text-sm text-secondary/70">
                                {currency.currencyName}
                              </span>
                              <span className="text-sm text-primary">
                                {currency.currencySymbol}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-paragraph text-secondary">To</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency._id} value={currency.currencyCode || ''}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{currency.currencyCode}</span>
                              <span className="text-sm text-secondary/70">
                                {currency.currencyName}
                              </span>
                              <span className="text-sm text-primary">
                                {currency.currencySymbol}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={swapCurrencies}
                    className="rounded-full"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Convert Button */}
                <Button 
                  onClick={convertCurrency}
                  className="w-full h-12 text-lg"
                  disabled={!amount || fromCurrency === toCurrency}
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Convert
                </Button>

                {/* Result */}
                {result > 0 && (
                  <div className="bg-primary/5 p-6 rounded-lg text-center">
                    <div className="font-paragraph text-sm text-secondary/70 mb-2">
                      {formatCurrency(amount, fromCurrency)} equals
                    </div>
                    <div className="font-heading text-4xl text-primary mb-4">
                      {formatCurrency(result, toCurrency)}
                    </div>
                    <div className="font-paragraph text-sm text-secondary/60 mb-4">
                      1 {fromCurrency} = {(result / amount).toFixed(4)} {toCurrency}
                    </div>
                    <Button onClick={addToExpenses} variant="outline">
                      Add to Expenses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversion History */}
            {conversionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-xl uppercase text-secondary flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Recent Conversions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {conversionHistory.slice(0, 5).map((conversion) => (
                      <div key={conversion.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="font-paragraph text-sm font-medium">
                              {formatCurrency(conversion.amount, conversion.fromCurrency)}
                            </div>
                            <ArrowUpDown className="h-3 w-3 mx-auto text-secondary/50" />
                            <div className="font-paragraph text-sm font-medium text-primary">
                              {formatCurrency(conversion.result, conversion.toCurrency)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-paragraph text-xs text-secondary/70">
                            Rate: {conversion.rate.toFixed(4)}
                          </div>
                          <div className="font-paragraph text-xs text-secondary/50">
                            {conversion.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Popular Currencies */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-lg uppercase text-secondary flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Popular Currencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getPopularCurrencies().map((currency) => (
                    <div key={currency._id} className="flex items-center justify-between p-2 hover:bg-secondary/5 rounded cursor-pointer"
                         onClick={() => {
                           if (fromCurrency !== currency.currencyCode) {
                             setToCurrency(currency.currencyCode || '');
                           } else {
                             setFromCurrency(currency.currencyCode || '');
                           }
                         }}>
                      <div>
                        <div className="font-paragraph text-sm font-medium">
                          {currency.currencyCode}
                        </div>
                        <div className="font-paragraph text-xs text-secondary/70">
                          {currency.country}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-paragraph text-sm text-primary">
                          {currency.currencySymbol}
                        </div>
                        <div className="font-paragraph text-xs text-secondary/60">
                          {currency.exchangeRate?.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg uppercase text-secondary flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Exchange Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currencies.slice(0, 8).map((currency) => (
                    <div key={currency._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {currency.currencyCode}
                        </Badge>
                        <span className="font-paragraph text-sm text-secondary/70">
                          {currency.currencySymbol}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-paragraph text-sm">
                          {currency.exchangeRate?.toFixed(4)}
                        </div>
                        {currency.isBaseCurrency && (
                          <Badge variant="secondary" className="text-xs">
                            Base
                          </Badge>
                        )}
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
