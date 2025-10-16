import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PointsDisplayProps {
  totalPoints: number;
  achievementsCount: number;
  nextAchievementPoints?: number;
}

export function PointsDisplay({ totalPoints, achievementsCount, nextAchievementPoints }: PointsDisplayProps) {
  const progress = nextAchievementPoints 
    ? (totalPoints / nextAchievementPoints) * 100 
    : 100;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Seus Pontos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalPoints}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Star className="h-4 w-4" />
              Pontos Totais
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">{achievementsCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4" />
              Conquistas
            </div>
          </div>
        </div>
        
        {nextAchievementPoints && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Próxima conquista</span>
              <span className="font-semibold text-foreground">
                {totalPoints} / {nextAchievementPoints}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
