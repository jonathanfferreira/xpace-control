import { useEffect, useState, useCallback } from "react";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface Plan {
  id: string;
  name?: string;
  student_limit?: number;
}

interface Subscription {
  id: string;
  status?: 'active' | 'trial' | 'canceled' | 'past_due';
  renew_at?: any; // Can be a string or a Firestore Timestamp
  plan_id?: string;
  school_id?: string;
  plans?: Plan; // Combined data
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const schoolsQuery = query(collection(db, "schools"), where("admin_id", "==", user.uid));
      const schoolSnapshot = await getDocs(schoolsQuery);

      if (schoolSnapshot.empty) {
        setSubscription(null);
        return;
      }
      const schoolId = schoolSnapshot.docs[0].id;

      const subsQuery = query(collection(db, "subscriptions"), where("school_id", "==", schoolId));
      const subSnapshot = await getDocs(subsQuery);

      if (subSnapshot.empty) {
        setSubscription(null);
        return;
      }
      
      const subData = subSnapshot.docs[0].data();
      let sub: Subscription = { id: subSnapshot.docs[0].id, ...subData };

      if (sub.plan_id) {
        const planDocRef = doc(db, "plans", sub.plan_id);
        const planDocSnap = await getDoc(planDocRef);
        if (planDocSnap.exists()) {
          sub.plans = { id: planDocSnap.id, ...planDocSnap.data() } as Plan;
        }
      }
      
      setSubscription(sub);

    } catch (error) {
      console.error("Error fetching subscription:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canAddStudent = async (currentStudentCount: number): Promise<boolean> => {
    if (!subscription?.plans) return true;

    const studentLimit = subscription.plans.student_limit;
    if (studentLimit === null || studentLimit === undefined) return true;

    return currentStudentCount < studentLimit;
  };

  const isActive = (): boolean => {
    if (!subscription) return false;
    return subscription.status === "active" || subscription.status === "trial";
  };

  const getDaysRemaining = (): number => {
    if (!subscription?.renew_at) return 0;
    
    // Handle both string and Firestore Timestamp for renew_at
    const renewDate = typeof subscription.renew_at === 'string' 
      ? new Date(subscription.renew_at) 
      : subscription.renew_at.toDate();
      
    const now = new Date();
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
