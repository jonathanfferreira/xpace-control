
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Edit, Trash, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    image?: string;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '0', stock: '0' });

    const productsRef = collection(db, 'products');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(productsRef);
            const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(fetchedProducts);
        } catch (error: any) {
            toast.error('Erro ao carregar produtos.', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenDialog = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: String(product.price),
                stock: String(product.stock)
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '0', stock: '0' });
        }
        setIsDialogOpen(true);
    };

    const handleSaveProduct = async () => {
        if (!formData.name) {
            toast.warning("O nome do produto é obrigatório.");
            return;
        }
        setIsSaving(true);
        try {
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                stock: parseInt(formData.stock, 10) || 0,
            };

            if (editingProduct) {
                const productRef = doc(db, 'products', editingProduct.id);
                await updateDoc(productRef, productData);
                toast.success("Produto atualizado!");
            } else {
                await addDoc(productsRef, { ...productData, createdAt: serverTimestamp() });
                toast.success("Produto criado!");
            }
            fetchProducts();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("Erro ao salvar produto.", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            try {
                await deleteDoc(doc(db, 'products', productId));
                toast.success("Produto excluído.");
                fetchProducts();
            } catch (error: any) {
                toast.error("Erro ao excluir produto.", { description: error.message });
            }
        }
    };

    return (
        <DashboardLayout>
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl flex items-center"><ShoppingBag className="mr-2"/>Produtos da Loja</CardTitle>
                        <CardDescription>Gerencie os produtos disponíveis na sua vitrine virtual.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Produto</Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <Card key={product.id}>
                                    <CardHeader>
                                        <CardTitle>{product.name}</CardTitle>
                                        <CardDescription>R$ {product.price.toFixed(2)} | Estoque: {product.stock}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground h-10">{product.description || 'Sem descrição.'}</p>
                                        <div className="flex gap-2 justify-end pt-4 border-t">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(product)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}><Trash className="mr-2 h-4 w-4"/>Excluir</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-lg font-semibold">Nenhum produto cadastrado</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Clique em "Adicionar Produto" para começar a vender.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingProduct ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div><Label>Nome do Produto</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Uniforme de Balé" /></div>
                        <div><Label>Descrição</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Collant, meia e sapatilha" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Preço (R$)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                            <div><Label>Estoque</Label><Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveProduct} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
}
