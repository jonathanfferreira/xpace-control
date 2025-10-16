import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";

interface ChurnData {
  last30Days: number;
  last60Days: number;
  totalStudents: number;
  percentage30: number;
  percentage60: number;
}

interface ChurnIndicatorCardProps {
  data: ChurnData;
}

export function ChurnIndicatorCard({ data }: ChurnIndicatorCardProps) {
  const isHighChurn = data.percentage30 > 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isHighChurn ? (
            <TrendingDown className="h-5 w-5 text-red-500" />
          ) : (
            <TrendingUp className="h-5 w-5 text-green-500" />
          )}
          Indicador de Churn
        </CardTitle>
        <CardDescription>
          Alunos que saíram nos últimos períodos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
              <p className="text-2xl font-bold">{data.last30Days}</p>
            </div>
            <Badge variant={isHighChurn ? "destructive" : "secondary"}>
              {data.percentage30.toFixed(1)}%
            </Badge>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Últimos 60 dias</p>
              <p className="text-2xl font-bold">{data.last60Days}</p>
            </div>
            <Badge variant={data.percentage60 > 15 ? "destructive" : "secondary"}>
              {data.percentage60.toFixed(1)}%
            </Badge>
          </div>

          {isHighChurn && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ Taxa de churn acima do esperado. Considere ações de retenção.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
