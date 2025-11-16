import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MaterialRecord {
  material: string;
  timestamp: string;
}

const COLORS = {
  plastic: "hsl(142 71% 45%)",
  metal: "hsl(198 70% 50%)",
  paper: "hsl(35 90% 60%)",
  glass: "hsl(210 70% 60%)",
  organic: "hsl(80 60% 50%)",
  other: "hsl(0 0% 60%)",
};

const History = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MaterialRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("recycling-history");
    if (stored) {
      setRecords(JSON.parse(stored));
    }
  }, []);

  const materialCounts = records.reduce((acc, record) => {
    acc[record.material] = (acc[record.material] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(materialCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-8">Recycling History</h1>

        <Card className="p-6 mb-8 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Material Distribution</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || COLORS.other}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No recycling data yet. Start scanning items to see your stats!
            </p>
          )}
        </Card>

        <Card className="p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Material Counts</h2>
          {Object.entries(materialCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(materialCounts).map(([material, count]) => (
                <div
                  key={material}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent"
                >
                  <span className="font-medium capitalize text-accent-foreground">{material}</span>
                  <span className="text-lg font-bold text-accent-foreground">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No materials recorded yet</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default History;