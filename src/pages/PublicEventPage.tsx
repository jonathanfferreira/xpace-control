
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, functions } from '@/integrations/firebase/client';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Loader2, Calendar, MapPin, Ticket, Copy, CheckCircle } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Tipos
interface SchoolEvent { id: string; name: string; date: Date; location: string; }
interface TicketType { id: string; name: string; price: number; quantity: number; }
interface Attendee {
    id: string;
    name: string;
    email: string;
    ticketTypeName: string;
    status: 'pending' | 'paid' | 'used';
    qrCodeValue: string;
}

// Funções do Firebase (MOCK por enquanto)
const fakeSyncUserWithAsaas = (data: any) => Promise.resolve({ data: { customerId: `cus_${Math.random().toString(36).substring(7)}` } });
const fakeCreateChargeForCustomer = (data: any) => Promise.resolve({ data: { charge: { pixQrCode: { payload: 'fakepixpayload' }, bankSlipUrl: 'fakeboleto.com', identificationField: '123456789' } } });


export default function PublicEventPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [event, setEvent] = useState<SchoolEvent | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    
    // State do formulário
    const [selectedTicket, setSelectedTicket] = useState<string>("");
    const [quantity, setQuantity] = useState(1);
    const [buyer, setBuyer] = useState({ name: '', email: '', cpfCnpj: '' });
    const [billingType, setBillingType] = useState<'PIX' | 'BOLETO'>('PIX');
    
    // State do resultado
    const [purchaseResult, setPurchaseResult] = useState<Attendee | null>(null);
    const [isResultOpen, setIsResultOpen] = useState(false);

    const fetchEventDetails = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const eventRef = doc(db, 'events', eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
                const data = eventSnap.data();
                setEvent({ id: eventSnap.id, ...data, date: data.date.toDate() } as SchoolEvent);
                
                const ticketsQuery = collection(db, 'events', eventId, 'ticketTypes');
                const querySnapshot = await getDocs(ticketsQuery);
                const fetchedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketType));
                setTicketTypes(fetchedTickets);
                if (fetchedTickets.length > 0) setSelectedTicket(fetchedTickets[0].id);
            } else {
                toast.error("Evento não encontrado.");
            }
        } catch (error: any) {
            toast.error('Erro ao carregar evento.', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEventDetails(); }, [eventId]);

    const handlePurchase = async () => {
        if (!buyer.name || !buyer.email || !buyer.cpfCnpj) {
            toast.warning("Por favor, preencha todos os seus dados.");
            return;
        }

        const currentTicket = ticketTypes.find(t => t.id === selectedTicket);
        if (!currentTicket) {
            toast.error("Tipo de ingresso inválido.");
            return;
        }

        setProcessing(true);
        try {
            // SIMULAÇÃO: Como o deploy do Blaze está pendente, vamos simular a compra
            // e focar em gerar o ingresso/QR code.

            // 1. Gerar um ID único para o ingresso (attendee)
            const newAttendeeRef = doc(collection(db, 'events', eventId!, 'attendees'));
            const attendeeId = newAttendeeRef.id;

            // 2. Montar os dados do participante/ingresso
            const attendeeData = {
                name: buyer.name,
                email: buyer.email,
                cpf: buyer.cpfCnpj,
                ticketTypeId: currentTicket.id,
                ticketTypeName: currentTicket.name,
                price: currentTicket.price * quantity,
                quantity: quantity,
                status: 'paid', // Simulamos como pago para gerar o QR
                qrCodeValue: attendeeId, // O QR Code conterá o ID do documento
                createdAt: serverTimestamp()
            };

            // 3. Salvar o ingresso no banco
            await addDoc(collection(db, 'events', eventId!, 'attendees'), attendeeData);

            // 4. Exibir o resultado para o usuário
            setPurchaseResult({ ...attendeeData, id: attendeeId } as Attendee);
            setIsResultOpen(true);

        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao processar sua compra.", { description: "Tente novamente. Se o erro persistir, entre em contato." });
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !event) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    const currentTicket = ticketTypes.find(t => t.id === selectedTicket);
    const totalPrice = (currentTicket?.price || 0) * quantity;

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${purchaseResult?.qrCodeValue}`;

    return (
        <div className="bg-gray-50 min-h-screen py-8 md:py-12">
            <div className="container mx-auto max-w-2xl">
                <Card className="shadow-lg">
                     <CardHeader>
                        <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">{event.name}</CardTitle>
                        <div className="flex flex-col md:flex-row md:items-center text-muted-foreground pt-3 gap-x-6 gap-y-1">
                            <div className='flex items-center'><Calendar className='mr-2 h-4 w-4' /> {format(event.date, "PPPP 'às' HH:mm", { locale: ptBR })}</div>
                            <div className='flex items-center'><MapPin className='mr-2 h-4 w-4' /> {event.location || 'Local a definir'}</div>
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6">
                        <div className="space-y-8">
                             {/* Passo 1: Seleção de Ingresso */}
                            <div>
                                <h2 className="text-xl font-semibold flex items-center mb-4"><Ticket className="mr-3 text-primary"/>1. Selecione seu Ingresso</h2>
                                <div className="p-4 border rounded-lg space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Tipo de Ingresso</Label>
                                            <Select value={selectedTicket} onValueChange={setSelectedTicket} disabled={ticketTypes.length === 0}>
                                                <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
                                                <SelectContent>
                                                    {ticketTypes.map(ticket => (
                                                        <SelectItem key={ticket.id} value={ticket.id}>{ticket.name} (R$ {ticket.price.toFixed(2)})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Quantidade</Label>
                                            <Input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                             {/* Passo 2: Seus Dados */}
                            <div>
                                <h2 className="text-xl font-semibold flex items-center mb-4">2. Seus Dados</h2>
                                <div className="p-4 border rounded-lg space-y-4">
                                    <div><Label>Nome Completo</Label><Input value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} placeholder="Seu nome" /></div>
                                    <div><Label>Email</Label><Input type="email" value={buyer.email} onChange={e => setBuyer({...buyer, email: e.target.value})} placeholder="seu@email.com" /></div>
                                    <div><Label>CPF</Label><Input value={buyer.cpfCnpj} onChange={e => setBuyer({...buyer, cpfCnpj: e.target.value})} placeholder="000.000.000-00" /></div>
                                </div>
                            </div>

                             {/* Passo 3: Finalizar (Simulado) */}
                             <div>
                                <h2 className="text-xl font-semibold flex items-center mb-4">3. Resumo</h2>
                                <div className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-center text-xl font-bold"><span className="text-base font-medium text-muted-foreground">Total a Pagar:</span><span>R$ {totalPrice.toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>
                        
                        <Button onClick={handlePurchase} disabled={processing} className="w-full text-lg py-6 mt-8">
                            {processing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : null}
                            {processing ? 'Processando...' : `Garantir meu Ingresso`}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Resultado com QR Code */}
            <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center"><CheckCircle className="mr-2 text-green-500"/>Compra Confirmada!</DialogTitle>
                        <DialogDescription>Seu ingresso foi gerado. Apresente o QR Code abaixo na entrada do evento.</DialogDescription>
                    </DialogHeader>
                    {purchaseResult && (
                        <div className="py-4 text-center space-y-4">
                           <img src={qrApiUrl} alt="QR Code do Ingresso" className="mx-auto border-4 border-primary rounded-lg"/>
                            <div>
                                <p className="font-bold text-lg">{purchaseResult.name}</p>
                                <p className="text-muted-foreground">{purchaseResult.ticketTypeName}</p>
                            </div>
                           <p className="text-xs text-muted-foreground pt-4">ID do Ingresso: {purchaseResult.id}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
