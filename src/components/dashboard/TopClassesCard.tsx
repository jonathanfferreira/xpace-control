import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

interface ClassOccupancy {
  name: string;
  enrolled: number;
  capacity: number;
  percentage: number;
}

interface TopClassesCardProps {
  classes: ClassOccupancy[];
}

export function TopClassesCard({ classes }: TopClassesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top 5 Turmas por Ocupação
        </CardTitle>
        <CardDescription>
          Turmas com maior número de matrículas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {classes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma turma com matrículas
            </p>
          ) : (
            classes.map((classItem, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{classItem.name}</span>
                  <span className="text-muted-foreground">
                    {classItem.enrolled}/{classItem.capacity}
                  </span>
                </div>
                <Progress value={classItem.percentage} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
