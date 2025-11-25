
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeResult, Html5QrcodeError } from "html5-qrcode";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, updateDoc, collection } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Video, VideoOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Attendee {
    id: string;
    name: string;
    ticketTypeName: string;
    status: 'pending' | 'paid' | 'used';
}

export default function EventScannerPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const qrcodeRegionId = "qr-code-reader";
    const qrcodeScanner = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [lastResult, setLastResult] = useState<Attendee | null>(null);
    const [lastStatus, setLastStatus] = useState<'valid' | 'used' | 'invalid' | null>(null);

    const onScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
        // Pausa o scanner para evitar múltiplas leituras
        if (qrcodeScanner.current?.isScanning) {
            await qrcodeScanner.current.pause();
        }

        try {
            const attendeeId = decodedText;
            const attendeeRef = doc(db, 'events', eventId!, 'attendees', attendeeId);
            const attendeeSnap = await getDoc(attendeeRef);

            if (attendeeSnap.exists()) {
                const attendee = { id: attendeeSnap.id, ...attendeeSnap.data() } as Attendee;
                setLastResult(attendee);

                if (attendee.status === 'paid') {
                    setLastStatus('valid');
                    await updateDoc(attendeeRef, { status: 'used' });
                    toast.success(`Acesso liberado para ${attendee.name}.`);
                } else if (attendee.status === 'used') {
                    setLastStatus('used');
                    toast.warning(`${attendee.name} já utilizou este ingresso.`);
                } else {
                    setLastStatus('invalid');
                    toast.error(`Ingresso com status inválido (${attendee.status}).`);
                }
            } else {
                setLastStatus('invalid');
                setLastResult({ id: attendeeId, name: "Ingresso não encontrado", ticketTypeName: "-", status: 'pending'});
                toast.error("Ingresso não encontrado no banco de dados.");
            }
        } catch (error: any) {
            toast.error("Erro ao validar ingresso:", { description: error.message });
        }

        // Resume o scanner após um tempo
        setTimeout(() => {
            if (qrcodeScanner.current && !qrcodeScanner.current.isScanning) {
                qrcodeScanner.current.resume();
            }
        }, 3000); // 3 segundos de pausa para ler o resultado
    };

    const onScanFailure = (error: Html5QrcodeError) => { /* Ignora erros de "não encontrei QR code" */ };

    const startScanner = async () => {
        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length) {
                if (!qrcodeScanner.current) {
                     qrcodeScanner.current = new Html5Qrcode(qrcodeRegionId, false);
                }
                await qrcodeScanner.current.start(
                    { facingMode: "environment" }, // Câmera traseira
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    onScanFailure
                );
                setIsScanning(true);
                setLastResult(null);
                setLastStatus(null);
            }
        } catch (err: any) {
            toast.error("Erro ao iniciar câmera:", { description: err.message });
        }
    };

    const stopScanner = () => {
        if (qrcodeScanner.current?.isScanning) {
            qrcodeScanner.current.stop().then(() => {
                setIsScanning(false);
            }).catch(err => {
                console.error("Falha ao parar scanner", err);
            });
        }
    };
    
    // Limpa o scanner ao desmontar o componente
    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    const getStatusColor = () => {
        switch(lastStatus) {
            case 'valid': return 'border-green-500 bg-green-50';
            case 'used': return 'border-yellow-500 bg-yellow-50';
            case 'invalid': return 'border-red-500 bg-red-50';
            default: return 'border-gray-200';
        }
    }

    const getStatusIcon = () => {
        switch(lastStatus) {
            case 'valid': return <CheckCircle className="w-16 h-16 text-green-500" />;
            case 'used': return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
            case 'invalid': return <XCircle className="w-16 h-16 text-red-500" />;
            default: return <Loader2 className="w-16 h-16 animate-spin" />;
        }
    }

    return (
        <div className="min-h-screen bg-background p-4">
             <Button variant="outline" onClick={() => navigate(`/eventos/${eventId}`)} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Detalhes do Evento</Button>
            <Card>
                <CardContent className="p-6">
                    <h1 className="text-2xl font-bold text-center">Validador de Ingressos</h1>
                    <div id={qrcodeRegionId} className="w-full max-w-md mx-auto my-4 aspect-square bg-gray-100 rounded-lg overflow-hidden"/>
                    
                    {!isScanning ? (
                        <Button onClick={startScanner} className="w-full"><Video className="mr-2"/> Iniciar Scanner</Button>
                    ) : (
                        <Button onClick={stopScanner} variant="destructive" className="w-full"><VideoOff className="mr-2"/> Parar Scanner</Button>
                    )}

                    {lastResult && (
                         <Card className={`mt-6 p-4 border-2 ${getStatusColor()}`}>
                             <div className="flex items-center gap-4">
                                 <div className="flex-shrink-0">{getStatusIcon()}</div>
                                 <div>
                                     <p className="font-bold text-xl">{lastResult.name}</p>
                                     <p className="text-muted-foreground">{lastResult.ticketTypeName}</p>
                                     <p className="text-sm font-mono">ID: {lastResult.id}</p>
                                 </div>
                             </div>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
