import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Crown, Zap } from "lucide-react";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  student_limit: number | null;
  features: string[];
  active: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  school_id: string;
  status: 'trial' | 'active' | 'canceled';
  renew_at: any;
  plan?: Plan;
}

interface School {
  id: string;
  admin_id: string;
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
      const schoolSnapshot = await getDocs(schoolQuery);
      if (schoolSnapshot.empty) {
        setLoading(false);
        return; // No school found, so can't have a subscription
      }
      const schoolData = { id: schoolSnapshot.docs[0].id, ...schoolSnapshot.docs[0].data() } as School;
      setSchool(schoolData);

      const subQuery = query(collection(db, 'subscriptions'), where('school_id', '==', schoolData.id));
      const subSnapshot = await getDocs(subQuery);
      if (!subSnapshot.empty) {
        const subData = { id: subSnapshot.docs[0].id, ...subSnapshot.docs[0].data() } as Subscription;
        if (subData.plan_id) {
          const planDoc = await getDoc(doc(db, 'plans', subData.plan_id));
          if (planDoc.exists()) {
            subData.plan = { id: planDoc.id, ...planDoc.data() } as Plan;
          }
        }
        setSubscription(subData);
      }

      const plansQuery = query(collection(db, 'plans'), where('active', '==', true));
      const plansSnapshot = await getDocs(plansQuery);
      const plansData = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Plan[];
      // Sort plans by price in ascending order
      plansData.sort((a, b) => a.monthly_price - b.monthly_price);
      setPlans(plansData);

    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!school) {
      toast.error("Você precisa criar uma escola primeiro");
      navigate("/onboarding");
      return;
    }
    
    toast.info("Processando assinatura...");
    try {
        const renewDate = new Date();
        renewDate.setDate(renewDate.getDate() + 30);

        if (subscription) {
            await updateDoc(doc(db, 'subscriptions', subscription.id), {
                plan_id: planId,
                status: 'active',
                renew_at: renewDate,
                updated_at: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, 'subscriptions'), {
                school_id: school.id,
                plan_id: planId,
                status: 'active',
                renew_at: renewDate,
                created_at: serverTimestamp()
            });
        }
        toast.success("Plano atualizado com sucesso! 🎉");
        fetchData(); // Refresh data
    } catch (error: any) {
        toast.error("Erro ao atualizar plano: " + error.message);
    }
  };

  // Render logic remains largely the same, just adjust for data structure changes
  if (loading) {
      return <div>Carregando planos...</div>;
  }

  return (
    <DashboardLayout>
      <div>Render UI for pricing plans here</div>
    </DashboardLayout>
  );
}
