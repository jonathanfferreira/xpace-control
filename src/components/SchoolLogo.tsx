
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';

export function SchoolLogo({ className }: { className?: string }) {
    const { schoolId } = useAuth();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [schoolName, setSchoolName] = useState<string>('');

    useEffect(() => {
        if (!schoolId) return;

        const fetchSchoolData = async () => {
            const schoolRef = doc(db, 'schools', schoolId);
            const schoolSnap = await getDoc(schoolRef);

            if (schoolSnap.exists()) {
                const schoolData = schoolSnap.data();
                setLogoUrl(schoolData.logoUrl || null);
                setSchoolName(schoolData.name || '');
            }
        };

        fetchSchoolData();
    }, [schoolId]);

    if (logoUrl) {
        return <img src={logoUrl} alt={`Logo de ${schoolName}`} className={className || 'h-16 w-auto'} />;
    }

    // Placeholder if no logo is set
    return (
        <div className={className || 'flex items-center justify-center h-16 w-32 bg-gray-200 rounded-md'}>
            <span className="text-sm font-semibold text-gray-600">{schoolName || 'Sua Escola'}</span>
        </div>
    );
}
