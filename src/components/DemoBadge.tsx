import { useDemo } from "@/contexts/DemoContext";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./ui/button";

export function DemoBadge() {
  const { isDemoMode, setDemoMode } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
      <AlertCircle className="h-5 w-5" />
      <span className="font-medium text-sm md:text-base">
        Modo DEMO ativo - Os dados são apenas demonstrativos
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDemoMode(false)}
        className="ml-auto text-white hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
