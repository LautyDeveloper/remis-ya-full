
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ViajesPorChoferChartProps {
  data: { nombre: string; viajesCompletados: number }[];
}

export function ViajesPorChoferChart({ data }: ViajesPorChoferChartProps) {
  const sortedData = [...data].sort((a, b) => b.viajesCompletados - a.viajesCompletados);

  return (
    <div className="h-80 w-full bg-card p-4 rounded-xl border">
      <h3 className="text-lg font-semibold mb-4">Viajes por Chofer</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="nombre"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="viajesCompletados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
