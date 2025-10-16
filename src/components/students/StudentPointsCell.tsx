import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy } from 'lucide-react';

interface StudentPointsCellProps {
  studentId: string;
}

export function StudentPointsCell({ studentId }: StudentPointsCellProps) {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, [studentId]);

  const fetchPoints = async () => {
    try {
      const { data } = await supabase
        .from('student_points')
        .select('points')
        .eq('student_id', studentId);

      const total = data?.reduce((sum, p) => sum + p.points, 0) || 0;
      setPoints(total);
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex items-center gap-1 text-primary font-semibold">
      <Trophy className="h-4 w-4" />
      {points}
    </div>
  );
}
