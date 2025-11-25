
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { SchoolLogo } from '@/components/SchoolLogo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Layout simples para a página de checkout
const CheckoutLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-muted/40">
        <header className="py-4 px-6 flex justify-center items-center border-b bg-background">
            <SchoolLogo />
        </header>
        <main className="p-6">
            {children}
        </main>
    </div>
);

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePlaceOrder = async () => {
        if (!customerName || !customerEmail) {
            toast.warning('Por favor, preencha seu nome e email.');
            return;
        }

        if (cartItems.length === 0) {
            toast.error('Seu carrinho está vazio.');
            navigate('/loja');
            return;
        }

        setIsProcessing(true);
        try {
            // Simula a criação de um pedido no banco de dados
            await addDoc(collection(db, 'orders'), {
                customerName,
                customerEmail,
                items: cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
                total: totalPrice,
                status: 'pending', // Quando o pagamento for real, isso será atualizado por webhook
                createdAt: serverTimestamp(),
            });

            toast.success('Pedido realizado com sucesso!', {
                description: 'Em breve você receberá um email com os detalhes. (Simulado)',
            });
            
            clearCart();
            // Redireciona para uma página de sucesso ou de volta para a loja
            setTimeout(() => navigate('/loja'), 3000);

        } catch (error: any) {
            toast.error('Erro ao finalizar o pedido.', { description: error.message });
            setIsProcessing(false);
        }
    };

    return (
        <CheckoutLayout>
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Coluna do Formulário */}
                    <Card>
                        <CardHeader><CardTitle>Seus Dados</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Seu nome" />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="seu@email.com" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coluna do Resumo do Pedido */}
                    <Card>
                        <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <span>{item.name} (x{item.quantity})</span>
                                        <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4"/>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>R$ {totalPrice.toFixed(2)}</span>
                            </div>
                            <Button onClick={handlePlaceOrder} className="w-full mt-6" disabled={isProcessing || cartItems.length === 0}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isProcessing ? 'Processando...' : 'Finalizar Compra'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </CheckoutLayout>
    );
}
