import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface PortfolioChartProps {
  walletAddress?: string;
}

interface ChartData {
  date: string;
  value: number;
}

export function PortfolioChart({ walletAddress }: PortfolioChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetchChartData();
    }
  }, [walletAddress]);

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/copytrading/user/${walletAddress}/portfolio-history`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      } else {
        // Use mock data if endpoint not available
        setChartData(generateMockData());
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): ChartData[] => {
    const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    let baseValue = 5000;
    return months.map(month => {
      baseValue += (Math.random() - 0.4) * 500;
      return {
        date: month,
        value: Math.round(baseValue),
      };
    });
  };

  const formatValue = (value: number) => `$${value.toLocaleString()}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Portfolio Performance
        </CardTitle>
        <CardDescription>
          Your portfolio value over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatValue(value), "Portfolio Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
