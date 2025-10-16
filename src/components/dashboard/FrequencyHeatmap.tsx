import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface HeatmapData {
  day: string;
  hours: { [hour: string]: number };
}

interface FrequencyHeatmapProps {
  data: HeatmapData[];
}

export function FrequencyHeatmap({ data }: FrequencyHeatmapProps) {
  const hours = ["6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h"];
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getIntensity = (value: number) => {
    if (value === 0) return "bg-muted";
    if (value <= 2) return "bg-primary/20";
    if (value <= 4) return "bg-primary/40";
    if (value <= 6) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Heatmap de Frequência
        </CardTitle>
        <CardDescription>
          Distribuição de presenças por dia e horário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-2 ml-12">
            {hours.map((hour) => (
              <div key={hour} className="w-12 text-xs text-center text-muted-foreground">
                {hour}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => (
            <div key={day} className="flex gap-2 items-center">
              <div className="w-10 text-sm text-muted-foreground">{day}</div>
              {hours.map((hour, hourIndex) => {
                const value = data[dayIndex]?.hours[hour] || 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-12 h-10 rounded ${getIntensity(value)} flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer`}
                    title={`${day} ${hour}: ${value} presenças`}
                  >
                    {value > 0 ? value : ""}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex gap-2 items-center justify-end mt-4 text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="w-4 h-4 bg-muted rounded"></div>
            <div className="w-4 h-4 bg-primary/20 rounded"></div>
            <div className="w-4 h-4 bg-primary/40 rounded"></div>
            <div className="w-4 h-4 bg-primary/60 rounded"></div>
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
