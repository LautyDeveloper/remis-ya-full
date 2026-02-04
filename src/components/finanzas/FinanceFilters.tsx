
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FinanceFiltersProps {
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  selectedChoferId: string;
  setSelectedChoferId: (id: string) => void;
  onReset: () => void;
}

export function FinanceFilters({
  dateRange,
  setDateRange,
  selectedChoferId,
  setSelectedChoferId,
  onReset
}: FinanceFiltersProps) {
  const { choferes } = useData();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[280px]",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                    {format(dateRange.to, "LLL dd, y", { locale: es })}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y", { locale: es })
                )
              ) : (
                <span>Seleccionar fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range: any) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                } else if (range?.from) {
                  setDateRange({ from: range.from, to: range.from });
                }
              }}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Select value={selectedChoferId} onValueChange={setSelectedChoferId}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos los choferes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los choferes</SelectItem>
          {choferes.map((chofer) => (
            <SelectItem key={chofer.id} value={chofer.id.toString()}>
              {chofer.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={onReset} className="gap-2">
        <RotateCcw className="w-4 h-4" />
        Resetear Filtros
      </Button>
    </div>
  );
}
