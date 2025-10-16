import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  badgeColor?: string;
}

export function AchievementBadge({ name, description, icon, unlocked, badgeColor = '#6324b2' }: AchievementBadgeProps) {
  return (
    <Card className={`p-4 ${unlocked ? 'border-primary' : 'opacity-50'}`}>
      <div className="flex items-start gap-3">
        <div 
          className="text-3xl p-2 rounded-full"
          style={{ backgroundColor: unlocked ? `${badgeColor}20` : '#e5e7eb' }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-foreground">{name}</h4>
            {unlocked && (
              <Badge className="bg-green-500">
                <Trophy className="h-3 w-3 mr-1" />
                Desbloqueado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}
