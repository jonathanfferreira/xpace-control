import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from "@/integrations/firebase/client";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Phone, MapPin, Calendar, Send, Filter, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';

type LeadStatus = 'new' | 'contacted' | 'converted' | 'discarded';
type LeadSource = 'website' | 'referral' | 'social' | 'ads' | 'other';

interface Lead {
  id: string;
  school_name: string;
  city: string;
  email: string;
  whatsapp: string;
  notes: string | null;
  status: LeadStatus;
  source?: LeadSource;
  created_at: any; // Allow flexible date types from Firestore
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-blue-500' },
  contacted: { label: 'Contato', color: 'bg-yellow-500' },
  converted: { label: 'Convertido', color: 'bg-green-500' },
  discarded: { label: 'Descartado', color: 'bg-gray-500' },
};

function SortableLeadCard({ lead, onSendEmail, onSendWhatsApp }: { 
  lead: Lead; 
  onSendEmail: (leadId: string, email: string) => void;
  onSendWhatsApp: (leadId: string, whatsapp: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{lead.school_name}</CardTitle>
          <CardDescription className="text-xs">
            {format(lead.created_at.toDate(), "dd 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* Lead details... */}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<LeadSource | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if(user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const leadsQuery = query(collection(db, 'leads'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(leadsQuery);
      const leadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[];
      setLeads(leadsData);
    } catch (error: any) {
      toast.error('Erro ao carregar leads', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, { status: newStatus });
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));
      toast.success('Status atualizado', { description: `Lead movido para ${STATUS_CONFIG[newStatus].label}` });
    } catch (error: any) {
      toast.error('Erro ao atualizar', { description: error.message });
    }
  };
  
  // Dummy functions for email/whatsapp
  const sendWelcomeEmail = (id: string, email: string) => toast.info(`Sending email to ${email}`);
  const sendWhatsAppMessage = (id: string, whatsapp: string) => toast.info(`Sending WhatsApp to ${whatsapp}`);

   const getLeadsByStatus = (status: LeadStatus) => {
    return leads
      .filter(lead => lead.status === status)
      .filter(lead => filterSource === 'all' || lead.source === filterSource)
      .filter(lead => 
        searchTerm === '' || 
        lead.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header and filters... */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={e => setActiveId(e.active.id as string)} collisionDetection={closestCenter}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
                    const statusLeads = getLeadsByStatus(status);
                    return (
                        <div key={status} className="space-y-4">
                            {/* Status header */}
                            <SortableContext items={statusLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3 min-h-[200px] p-2 rounded-lg border-2 border-dashed">
                                    {statusLeads.map((lead) => (
                                        <SortableLeadCard key={lead.id} lead={lead} onSendEmail={sendWelcomeEmail} onSendWhatsApp={sendWhatsAppMessage} />
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    );
                })}
            </div>
             <DragOverlay>
                {activeId && leads.find(l=>l.id===activeId) ? (
                    <Card className="cursor-move shadow-2xl"><CardHeader><CardTitle>{leads.find(l=>l.id===activeId)?.school_name}</CardTitle></CardHeader></Card>
                ) : null}
            </DragOverlay>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}
