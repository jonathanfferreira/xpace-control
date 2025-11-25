
import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { Loader2, Upload, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const schoolId = useMemo(async () => {
    if (!user) return null;
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    return schoolSnapshot.empty ? null : schoolSnapshot.docs[0].id;
  }, [user]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      const resolvedSchoolId = await schoolId;
      if (!resolvedSchoolId) {
        setLoading(false);
        return;
      }
      try {
        const schoolRef = doc(db, 'schools', resolvedSchoolId);
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists()) {
          const schoolData = schoolSnap.data();
          setSchool(schoolData);
          setPrimaryColor(schoolData.primaryColor || '#000000');
          setLogoPreview(schoolData.logoUrl || null);
        }
      } catch (error: any) {
        toast.error('Erro ao carregar configurações da escola.', { description: error.message });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSchoolData();
    }
  }, [user, schoolId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const resolvedSchoolId = await schoolId;
    if (!resolvedSchoolId) {
      toast.error('ID da escola não encontrado.');
      return;
    }
    setIsSaving(true);
    try {
      let logoUrl = school.logoUrl;
      if (logoFile) {
        const logoRef = ref(storage, `schools/${resolvedSchoolId}/logo/${logoFile.name}`);
        const snapshot = await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      }

      const schoolRef = doc(db, 'schools', resolvedSchoolId);
      await updateDoc(schoolRef, {
        logoUrl: logoUrl,
        primaryColor: primaryColor,
      });

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar as configurações.', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Personalização da Escola</CardTitle>
              <CardDescription>Faça o upload do seu logo e escolha a cor primária para personalizar a aparência do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Logo da Escola</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && <img src={logoPreview} alt="Pré-visualização do Logo" className="h-16 w-16 object-contain rounded-md border p-1" />}
                  <Input type="file" accept="image/*" onChange={handleLogoChange} className="max-w-xs" />
                </div>
                <p className="text-xs text-muted-foreground">Recomendado: Imagem PNG com fundo transparente.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor='primary-color'>Cor Primária</Label>
                <div className="flex items-center gap-2">
                    <div className='p-2 border rounded-md bg-background'>
                        <input id='primary-color' type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8" />
                    </div>
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32" />
                </div>
              </div>
              
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações
                </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
