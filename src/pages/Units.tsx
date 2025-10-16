import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { toast } from "sonner";

export default function Units() {
  const { isDemoMode } = useDemo();
  const [units] = useState([
    {
      id: "1",
      name: "Unidade Centro",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      phone: "(11) 3456-7890",
      active: true,
    },
    {
      id: "2",
      name: "Unidade Jardins",
      address: "Av. Paulista, 456",
      city: "São Paulo",
      phone: "(11) 3456-7891",
      active: true,
    },
  ]);

  const handleAddUnit = () => {
    toast.info("Funcionalidade de adicionar unidade em desenvolvimento");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Unidades</h1>
            <p className="text-muted-foreground">
              Gerencie as unidades da sua escola
            </p>
          </div>
          <Button onClick={handleAddUnit}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {units.map((unit) => (
            <Card key={unit.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {unit.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Endereço:</span> {unit.address}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Cidade:</span> {unit.city}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Telefone:</span> {unit.phone}
                </p>
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isDemoMode && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Modo Demo:</strong> A funcionalidade de multiunidade permite gerenciar
                várias unidades da sua escola em um só lugar. Cada unidade pode ter suas próprias
                turmas, professores e horários.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
