
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Importado
import { db } from '@/integrations/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SchoolLogo } from '@/components/SchoolLogo';
import { useCart } from '@/contexts/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    image?: string;
}

// Painel do Carrinho
const CartSheet = () => {
    const { cartItems, removeFromCart, updateQuantity, cartCount, totalPrice } = useCart();
    const navigate = useNavigate(); // <-- Hook de navegação
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleCheckout = () => {
        setIsSheetOpen(false); // Fecha o painel
        navigate('/checkout'); // Navega para o checkout
    };

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <ShoppingCart className="mr-2 h-4 w-4"/>
                    Meu Carrinho ({cartCount})
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Seu Carrinho</SheetTitle>
                </SheetHeader>
                {cartCount > 0 ? (
                    <>
                        <div className="flex-1 overflow-y-auto pr-4">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-center gap-4 py-4">
                                    <img src={item.image || '/placeholder.svg'} alt={item.name} className="h-16 w-16 rounded object-cover"/>
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-primary">R$ {item.price.toFixed(2)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button size="icon-sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                            <span>{item.quantity}</span>
                                            <Button size="icon-sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <SheetFooter className="mt-4">
                           <div className="w-full space-y-4">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>R$ {totalPrice.toFixed(2)}</span>
                                </div>
                                <Button className="w-full" onClick={handleCheckout}>Finalizar Compra</Button>
                           </div>
                        </SheetFooter>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                        <p className="mt-4 font-semibold">Seu carrinho está vazio</p>
                        <p className="text-sm text-muted-foreground">Adicione produtos para começar.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

// Layout Público
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background text-foreground">
        <header className="py-4 px-6 flex justify-between items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <SchoolLogo />
            <CartSheet />
        </header>
        <main className="p-6">
            {children}
        </main>
        <footer className="text-center p-4 text-muted-foreground text-sm border-t">
            <p>© {new Date().getFullYear()} XPACE. Todos os direitos reservados.</p>
        </footer>
    </div>
);

export default function PublicStore() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where("stock", ">", 0));
            const querySnapshot = await getDocs(q);
            const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(fetchedProducts);
        } catch (error: any) {
            toast.error('Erro ao carregar produtos da loja.', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddToCart = (product: Product) => {
        addToCart(product);
        toast.success(`${product.name} foi adicionado ao carrinho!`);
    };

    return (
        <PublicLayout>
            <div className="container mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Nossa Loja</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Confira nossos produtos exclusivos.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin" /></div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map(product => (
                            <Card key={product.id} className="flex flex-col">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
                                ) : (
                                    <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                                        <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle>{product.name}</CardTitle>
                                    <CardDescription className="text-primary font-semibold text-lg">R$ {product.price.toFixed(2)}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description || 'Produto sem descrição detalhada.'}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleAddToCart(product)} disabled={product.stock <= 0}>
                                        <ShoppingCart className="mr-2 h-4 w-4"/>
                                        {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Esgotado'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">Nenhum produto disponível</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Nossa loja está vazia no momento. Volte em breve!</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
