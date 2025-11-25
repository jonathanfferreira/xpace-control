
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { writeBatch, collection, doc, Timestamp } from "firebase/firestore"; 
import { db } from '@/integrations/firebase/client';

const steps = ['Upload do Arquivo', 'Mapeamento de Colunas', 'Validação e Importação'];

// Definição dos campos que esperamos no nosso banco de dados.
const xpaceFields = [
    { key: 'name', label: 'Nome Completo do Aluno', required: true, type: 'string' },
    { key: 'email', label: 'Email do Aluno', type: 'string' },
    { key: 'phone', label: 'Telefone do Aluno', type: 'string' },
    { key: 'birthDate', label: 'Data de Nascimento (DD/MM/AAAA)', type: 'date' },
    { key: 'cpf', label: 'CPF do Aluno', type: 'string' },
    { key: 'status', label: 'Status (ativo/inativo)', type: 'string', defaultValue: 'ativo' },
    { key: 'guardian.name', label: 'Nome do Responsável', type: 'string' },
    { key: 'guardian.cpf', label: 'CPF do Responsável', type: 'string' },
    { key: 'guardian.email', label: 'Email do Responsável', type: 'string' },
    { key: 'guardian.phone', label: 'Telefone do Responsável', type: 'string' },
    { key: 'address.street', label: 'Endereço (Rua)', type: 'string' },
    { key: 'address.city', label: 'Endereço (Cidade)', type: 'string' },
    { key: 'address.state', label: 'Endereço (Estado)', type: 'string' },
    { key: 'address.zip', label: 'Endereço (CEP)', type: 'string' },
];

// Função para converter data de string (ex: 25/12/2024) para Timestamp do Firebase
const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (!parts) return null;
    // new Date(year, monthIndex, day)
    const date = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
    return Timestamp.fromDate(date);
};

export default function ImportarDadosPage() {
    const { schoolId } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<{ [key: string]: string }>({});
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = (file: File | null) => {
        if (!file) return;
        if (file.type !== 'text/csv') {
            toast.error('Tipo de arquivo inválido. Por favor, envie um arquivo .csv');
            return;
        }
        setCsvFile(file);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (!results.meta.fields) {
                    toast.error('Não foi possível ler os cabeçalhos do arquivo CSV.');
                    return;
                }
                setCsvHeaders(results.meta.fields);
                setCsvData(results.data);
                setCurrentStep(1);
            },
            error: (error) => {
                toast.error(`Erro ao processar o arquivo: ${error.message}`);
            }
        });
    };
    
    const handleMappingChange = (xpaceKey: string, csvHeader: string) => {
        setMapping(prev => ({ ...prev, [xpaceKey]: csvHeader }));
    };

    const resetState = () => {
        setCurrentStep(0);
        setCsvFile(null);
        setCsvHeaders([]);
        setCsvData([]);
        setMapping({});
        setIsImporting(false);
    }

    const Uploader = () => (
        <div className="w-full max-w-lg mx-auto">
            <label 
                htmlFor="csv-upload" 
                onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]); }}
                onDragOver={(e) => e.preventDefault()}
                className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-4 text-muted-foreground" />
                     <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-muted-foreground">Arquivo CSV com os dados dos alunos</p>
                </div>
                <input id="csv-upload" type="file" className="absolute inset-0 w-full h-full opacity-0" accept=".csv" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
            </label>
        </div> 
    );

    const Mapper = () => (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Mapeamento de Colunas</CardTitle>
                <p className='text-muted-foreground'>Associe as colunas do seu arquivo <span className='font-semibold text-primary'>{csvFile?.name}</span> aos campos do XPACE OS.</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {xpaceFields.map(field => (
                    <div key={field.key} className='grid grid-cols-2 gap-4 items-center'>
                        <div className='text-right font-medium'>
                            {field.label} {field.required && <span className='text-red-500'>*</span>}
                        </div>
                        <Select onValueChange={(value) => handleMappingChange(field.key, value)} value={mapping[field.key]}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a coluna do seu arquivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {csvHeaders.map(header => (
                                    <SelectItem key={header} value={header}>{header}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}
                <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(0)}>Voltar</Button>
                    <Button onClick={() => {
                        if (!mapping.name) {
                            toast.error('O campo "Nome Completo do Aluno" é obrigatório e deve ser mapeado.');
                            return;
                        }
                        setCurrentStep(2);
                    }}>Próximo: Validar Dados</Button>
                </div>
            </CardContent>
        </Card>
    );

    const Validator = () => {
        const processedData = useMemo(() => {
            return csvData.map(row => {
                const newStudent: any = { roles: ['student'], schoolId };
                xpaceFields.forEach(field => {
                    const csvHeader = mapping[field.key];
                    let value = csvHeader ? row[csvHeader] : field.defaultValue;

                    if (value) {
                        if (field.type === 'date') {
                            value = parseDate(value);
                        } else if (field.key === 'status') {
                            value = value.toLowerCase();
                        }
                        // Lógica para campos aninhados (ex: guardian.name)
                        if (field.key.includes('.')) {
                            const [parent, child] = field.key.split('.');
                            if (!newStudent[parent]) newStudent[parent] = {};
                            newStudent[parent][child] = value;
                        } else {
                            newStudent[field.key] = value;
                        }
                    }
                });
                return newStudent;
            });
        }, [csvData, mapping, schoolId]);

        const handleImport = async () => {
            if (!schoolId) return toast.error("ID da escola não encontrado.");
            setIsImporting(true);
            try {
                // O Firestore tem um limite de 500 operações por batch
                const batch = writeBatch(db);
                processedData.forEach(studentData => {
                    if(studentData.name) { // Só importa se o nome existir
                         const studentRef = doc(collection(db, 'students'));
                         batch.set(studentRef, studentData);
                    }
                });
                await batch.commit();
                toast.success(`${processedData.length} alunos importados com sucesso!`);
                resetState(); // Volta para a tela inicial
            } catch (error: any) {
                 toast.error(`Falha na importação: ${error.message}`);
                 setIsImporting(false);
            }
        }

        return (
             <Card className="w-full max-w-6xl mx-auto">
                 <CardHeader>
                    <CardTitle>Validação e Prévia</CardTitle>
                    <p className='text-muted-foreground'>Confira os 5 primeiros registros. Se estiver tudo certo, inicie a importação.</p>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {xpaceFields.filter(f => f.key === 'name' || f.key === 'email' || f.key === 'status').map(f => <TableHead key={f.key}>{f.label}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processedData.slice(0, 5).map((student, index) => (
                                <TableRow key={index}>
                                    <TableCell>{student.name || <span className='text-red-500'>Nome ausente</span>}</TableCell>
                                    <TableCell>{student.email || 'N/A'}</TableCell>
                                    <TableCell>{student.status || 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isImporting}>Voltar ao Mapeamento</Button>
                        <Button onClick={handleImport} disabled={isImporting}>
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Importar {processedData.length} Alunos
                        </Button>
                    </div>
                </CardContent>
             </Card>
        )
    }

    const Success = () => (
        // Este componente pode ser implementado no futuro para mostrar um resumo da importação.
        <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="mt-4 text-2xl font-bold">Importação Concluída!</h2>
            <p className="mt-2 text-muted-foreground">Os dados dos alunos foram importados com sucesso.</p>
            <Button onClick={resetState} className="mt-6">Importar outro arquivo</Button>
        </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Importação de Dados</h1>
                <p className="text-muted-foreground">Migre seus dados de outros sistemas para o XPACE OS de forma fácil.</p>
            </div>

            <div className="w-full max-w-3xl mx-auto px-4">
                <div className="flex items-center">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-center w-full">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {currentStep > index ? <CheckCircle size={20} /> : index + 1}
                            </div>
                            <div className={`ml-4 text-sm font-medium ${currentStep >= index ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-auto border-t-2 mx-4 ${currentStep > index ? 'border-primary' : 'border-muted'}`}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8">
                {currentStep === 0 && <Uploader />}
                {currentStep === 1 && <Mapper />}
                {currentStep === 2 && <Validator />}
            </div>
        </div>
    );
}
