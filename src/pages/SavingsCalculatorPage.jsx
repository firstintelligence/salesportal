import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, TrendingDown, Calendar, Zap } from "lucide-react";
import { Calculator } from "@/components/savings/Calculator";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SavingsCalculatorPage = () => {
  const navigate = useNavigate();
  const [calculatorData, setCalculatorData] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("authenticated")) {
      navigate("/");
    }
  }, [navigate]);

  const handleCalculatorComplete = (data) => {
    setCalculatorData(data);
    setShowResults(true);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleRecalculate = () => {
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Savings calculation logic
  const calculateSavings = () => {
    if (!calculatorData) return null;

    let monthlySavings = 0;
    let totalCost = 0;
    const savingsBreakdown = [];

    // HVAC savings
    if (calculatorData.selectedProducts.includes("hvac")) {
      const hvacSavings = calculatorData.gasBill * 0.8; // 80% gas savings
      monthlySavings += hvacSavings;
      totalCost += 15000;
      savingsBreakdown.push({ name: "Heating/Cooling", savings: Math.round(hvacSavings), cost: 15000 });
    }

    // Solar savings
    if (calculatorData.selectedProducts.includes("solar")) {
      const solarSavings = calculatorData.electricityBill * 0.7; // 70% electricity savings
      monthlySavings += solarSavings;
      totalCost += 25000;
      savingsBreakdown.push({ name: "Solar Panels", savings: Math.round(solarSavings), cost: 25000 });
    }

    // Insulation savings
    if (calculatorData.selectedProducts.includes("insulation")) {
      const insulationSavings = (calculatorData.gasBill + calculatorData.electricityBill) * 0.15;
      monthlySavings += insulationSavings;
      totalCost += 8000;
      savingsBreakdown.push({ name: "Insulation", savings: Math.round(insulationSavings), cost: 8000 });
    }

    // Hot water savings
    if (calculatorData.selectedProducts.includes("hotwater")) {
      const hotWaterSavings = calculatorData.gasBill * 0.3; // 30% of gas bill typically water heating
      monthlySavings += hotWaterSavings;
      totalCost += 5000;
      savingsBreakdown.push({ name: "Hot Water", savings: Math.round(hotWaterSavings), cost: 5000 });
    }

    // Battery (no direct savings, but add cost)
    if (calculatorData.selectedProducts.includes("battery")) {
      totalCost += 12000;
      savingsBreakdown.push({ name: "Home Battery", savings: 0, cost: 12000 });
    }

    // Add OESP credit if applicable
    if (calculatorData.oesp) {
      monthlySavings += 50; // Average OESP credit
      savingsBreakdown.push({ name: "OESP Credit", savings: 50, cost: 0 });
    }

    const yearlySavings = monthlySavings * 12;
    const paybackYears = totalCost > 0 && yearlySavings > 0 ? (totalCost / yearlySavings).toFixed(1) : "N/A";

    // Calculate current vs future monthly costs
    const currentMonthlyCost = calculatorData.gasBill + calculatorData.electricityBill;
    const futureMonthlyCost = Math.max(0, currentMonthlyCost - monthlySavings);

    // Generate 5-year projection data
    const projectionData = Array.from({ length: 60 }, (_, i) => ({
      month: i + 1,
      currentCost: currentMonthlyCost * (i + 1),
      withUpgrades: (futureMonthlyCost * (i + 1)) + totalCost,
      savings: (monthlySavings * (i + 1)) - totalCost
    }));

    return {
      monthlySavings: Math.round(monthlySavings),
      yearlySavings: Math.round(yearlySavings),
      totalCost: Math.round(totalCost),
      paybackYears,
      savingsBreakdown,
      currentMonthlyCost: Math.round(currentMonthlyCost),
      futureMonthlyCost: Math.round(futureMonthlyCost),
      projectionData
    };
  };

  const savings = showResults ? calculateSavings() : null;

  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="bg-card border-b border-border p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/landing")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tools
        </Button>
      </div>
      
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Energy Savings Calculator</h1>
          <p className="text-muted-foreground text-lg">
            Calculate your potential savings with modern energy solutions
          </p>
        </div>

        <Calculator onComplete={handleCalculatorComplete} />
        
        {showResults && savings && (
          <div id="results-section" className="space-y-6 pt-6">
            <Card className="border-2 shadow-lg bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-2xl">Your Potential Savings</CardTitle>
                <CardDescription>Based on your home details and selected categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Monthly Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl md:text-3xl font-bold text-green-500">${savings.monthlySavings}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Yearly Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl md:text-3xl font-bold text-green-500">${savings.yearlySavings}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Total Investment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl md:text-3xl font-bold">${savings.totalCost.toLocaleString()}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Payback Period
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl md:text-3xl font-bold">{savings.paybackYears} {savings.paybackYears !== "N/A" && "years"}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  {/* Monthly Savings Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Savings Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={savings.savingsBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="savings" fill="#10b981" name="Monthly Savings ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Cost Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Investment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={savings.savingsBreakdown.filter(item => item.cost > 0)}
                            dataKey="cost"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.name}: $${entry.cost.toLocaleString()}`}
                          >
                            {savings.savingsBreakdown.filter(item => item.cost > 0).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Before vs After Comparison */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Energy Cost Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { period: "Current", cost: savings.currentMonthlyCost },
                          { period: "With Upgrades", cost: savings.futureMonthlyCost }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cost" fill="#3b82f6" name="Monthly Cost ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 5-Year Savings Projection */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">5-Year Cost Projection</CardTitle>
                    <CardDescription>Cumulative costs with and without upgrades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={savings.projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: 'Cumulative Cost ($)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="currentCost" 
                          stroke="#ef4444" 
                          name="Without Upgrades"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="withUpgrades" 
                          stroke="#10b981" 
                          name="With Upgrades"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="savings" 
                          stroke="#3b82f6" 
                          name="Net Savings"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Button onClick={handleRecalculate} variant="outline" className="w-full mt-6">
                  Recalculate
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsCalculatorPage;
