import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  plans?: Database["public"]["Tables"]["plans"]["Row"];
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's school
      const { data: schoolData } = await supabase
        .from("schools")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (!schoolData) return;

      // Get subscription with plan details
      const { data } = await supabase
        .from("subscriptions")
        .select(`
          *,
          plans(*)
        `)
        .eq("school_id", schoolData.id)
        .single();

      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const canAddStudent = async (currentStudentCount: number): Promise<boolean> => {
    if (!subscription?.plans) return true;

    const studentLimit = subscription.plans.student_limit;
    if (!studentLimit) return true; // Unlimited

    return currentStudentCount < studentLimit;
  };

  const isActive = (): boolean => {
    if (!subscription) return false;
    return subscription.status === "active" || subscription.status === "trial";
  };

  const getDaysRemaining = (): number => {
    if (!subscription?.renew_at) return 0;
    const now = new Date();
    const renewDate = new Date(subscription.renew_at);
    const diff = renewDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return {
    subscription,
    loading,
    canAddStudent,
    isActive,
    getDaysRemaining,
    refetch: fetchSubscription,
  };
}
