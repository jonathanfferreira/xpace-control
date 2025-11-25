
import { useParams } from "react-router-dom";
import { AsaasOnboarding } from "@/components/financial/AsaasOnboarding";
import { EmpatheticCollector } from "@/components/ai/EmpatheticCollector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Mock data - Em um app real, isso viria de uma API (ex: useStudent(studentId))
const mockStudent = {
  uid: "user-123-abc",
  displayName: "Ana Beatriz",
  email: "ana.beatriz@example.com",
  avatarUrl: "https://i.pravatar.cc/150?u=anabeatriz",
  status: "active", // ou 'inactive'
  classes: ["Ballet Clássico - Intermediário", "Jazz - Adulto"],
  // Opcional: o ID do Asaas pode ou não existir. Teste removendo a linha abaixo.
  // asaasCustomerId: "cus_000005798733", 
};

const mockDebt = {
    studentName: "Ana Beatriz",
    debtAmount: 180.50,
    dueDate: "2024-07-10", // Data no passado para simular inadimplência
};


const StudentDetailPage = () => {
  const { studentId } = useParams();

  // Em um app real, você usaria o studentId para buscar os dados do aluno
  // const { data: student, isLoading } = useQuery(['student', studentId], fetchStudentData);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={mockStudent.avatarUrl} alt={mockStudent.displayName} />
          <AvatarFallback>{mockStudent.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{mockStudent.displayName}</h1>
          <p className="text-muted-foreground">{mockStudent.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Coluna 1: Detalhes e Turmas */}
        <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>ID do Aluno (mock):</strong> {studentId}</p>
                <p><strong>Status:</strong> <Badge variant={mockStudent.status === 'active' ? 'default' : 'destructive'}>{mockStudent.status}</Badge></p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Turmas Matriculadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-muted-foreground">
                {mockStudent.classes.map(c => <li key={c}>{c}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Ações Financeiras */}
        <div className="space-y-6">
          <AsaasOnboarding user={mockStudent} />
        </div>

        {/* Coluna 3: Ações de IA */}
        <div className="space-y-6">
          <EmpatheticCollector debtInfo={mockDebt} />
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage;
