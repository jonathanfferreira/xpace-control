
import { useMemo } from 'react';
import {
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from 'recharts';
import { useClasses } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewChart() {
  const { classes, loading: loadingClasses } = useClasses();
  const { students, loading: loadingStudents } = useStudents();

  const data = useMemo(() => {
    if (loadingClasses || loadingStudents) {
      return [];
    }

    return classes.map(c => ({
      name: c.name,
      Alunos: students.filter(s => s.classId === c.id && s.status === 'ativo').length,
    }));
  }, [classes, students, loadingClasses, loadingStudents]);

  if (loadingClasses || loadingStudents) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (data.length === 0) {
    return (
        <div className="flex h-[350px] w-full items-center justify-center">
            <p className='text-muted-foreground'>Não há dados suficientes para exibir o gráfico.</p>
        </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          allowDecimals={false}
        />
        <Tooltip 
            cursor={{fill: 'hsl(var(--accent))'}}
            contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}
        />
        <Legend />
        <Bar dataKey="Alunos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
