import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface AchievementUnlockModalProps {
  open: boolean;
  onClose: () => void;
  achievement: {
    name: string;
    description: string;
    icon: string;
  };
}

export function AchievementUnlockModal({ open, onClose, achievement }: AchievementUnlockModalProps) {
  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🎉 Nova Conquista Desbloqueada!
          </DialogTitle>
          <DialogDescription className="text-center">
            Parabéns pelo seu progresso!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl animate-bounce">
            {achievement.icon}
          </div>
          <h3 className="text-2xl font-bold text-primary">{achievement.name}</h3>
          <p className="text-center text-muted-foreground">
            {achievement.description}
          </p>
        </div>
        <Button onClick={onClose} className="w-full">
          Continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
