
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, ArrowUpDown } from 'lucide-react';

interface ChoferStat {
  id: number;
  nombre: string;
  viajesCompletados: number;
  totalFacturado: number;
  comisionTotal: number;
  promedioPorViaje: number;
}

interface ChoferTableProps {
  data: ChoferStat[];
}

export function ChoferTable({ data }: ChoferTableProps) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ChoferStat; direction: 'asc' | 'desc' } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const handleSort = (key: keyof ChoferStat) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let result = data.filter(c =>
      c.nombre.toLowerCase().includes(search.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, search, sortConfig]);

  const exportToCSV = () => {
    const headers = ['Chofer,Viajes Completados,Total Facturado,Comisión Total,Promedio por Viaje'];
    const rows = filteredData.map(c =>
      `${c.nombre},${c.viajesCompletados},${c.totalFacturado},${c.comisionTotal},${c.promedioPorViaje}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rendimiento_choferes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar chofer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('nombre')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-1">
                  Chofer <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('viajesCompletados')} className="cursor-pointer hover:bg-muted/50 text-right">
                <div className="flex items-center justify-end gap-1">
                  Viajes <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalFacturado')} className="cursor-pointer hover:bg-muted/50 text-right">
                <div className="flex items-center justify-end gap-1">
                  Total Facturado <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('comisionTotal')} className="cursor-pointer hover:bg-muted/50 text-right">
                <div className="flex items-center justify-end gap-1">
                  Comisión Total <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('promedioPorViaje')} className="cursor-pointer hover:bg-muted/50 text-right">
                <div className="flex items-center justify-end gap-1">
                  Promedio <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.nombre}</TableCell>
                  <TableCell className="text-right">{row.viajesCompletados}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.totalFacturado)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.comisionTotal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.promedioPorViaje)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
