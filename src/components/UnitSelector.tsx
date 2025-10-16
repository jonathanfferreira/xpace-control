import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useUnit } from '@/contexts/UnitContext';

export function UnitSelector() {
  const { selectedUnit, units, selectUnit, loading } = useUnit();

  if (loading || units.length === 0) {
    return null;
  }

  // Don't show selector if only one unit
  if (units.length === 1 && selectedUnit) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{selectedUnit.name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedUnit?.id || ''}
        onValueChange={(value) => {
          const unit = units.find(u => u.id === value);
          selectUnit(unit || null);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione a unidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as unidades</SelectItem>
          {units.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
