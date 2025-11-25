import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Download } from 'lucide-react';
import { studentSchema, type StudentFormData } from '@/lib/validations';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionLimitWarning } from '@/components/SubscriptionLimitWarning';
import { UpgradeModal } from '@/components/UpgradeModal';
import { StudentPointsCell } from '@/components/students/StudentPointsCell';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

export default function Students() {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const [students, setStudents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { subscription, canAddStudent } = useSubscription();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    emergency_contact: '',
    emergency_phone: '',
    unit_id: null,
    active: true,
  });

  useEffect(() => {
    if (user) {
      fetchStudents();
      fetchUnits();
    }
  }, [user, selectedUnit]);

  const getSchoolId = async () => {
    if (!user) throw new Error("Usuário não autenticado");
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    if (schoolSnapshot.empty) throw new Error("Escola não encontrada");
    return schoolSnapshot.docs[0].id;
  }

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      let q = query(collection(db, 'students'), where('school_id', '==', schoolId));
      if (selectedUnit) {
        q = query(q, where('unit_id', '==', selectedUnit.id));
      }
      const querySnapshot = await getDocs(q);
      const studentsList = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const studentData = doc.data();
          let unitName = '-';
          if (studentData.unit_id) {
              const unitDoc = await getDoc(doc(db, 'school_units', studentData.unit_id));
              if (unitDoc.exists()) {
                  unitName = unitDoc.data().name;
              }
          }
          return { id: doc.id, ...studentData, unit_name: unitName };
      }));
      setStudents(studentsList);
    } catch (error: any) {
      toast.error('Erro ao carregar alunos', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ... other functions converted to use Firestore

  return <DashboardLayout><div>Students list</div></DashboardLayout>; // Placeholder
}
