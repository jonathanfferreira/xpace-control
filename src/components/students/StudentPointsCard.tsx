import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentPointsCardProps {
  studentId: string;
  studentName: string;
}

export function StudentPointsCard({ studentId, studentName }: StudentPointsCardProps) {
  const [totalPoints, setTotalPoints] = useState(0);
  const [achievements, setAchievements] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, [studentId]);

  const fetchPoints = async () => {
    try {
      const { data: pointsData } = await supabase
        .from('student_points')
        .select('points')
        .eq('student_id', studentId);

      const { data: achievementsData } = await supabase
        .from('student_achievements')
        .select('id')
        .eq('student_id', studentId);

      setTotalPoints(pointsData?.reduce((sum, p) => sum + p.points, 0) || 0);
      setAchievements(achievementsData?.length || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Gamificação - {studentName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Star className="h-3 w-3" />
              Pontos
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{achievements}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" />
              Badges
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
