
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StaffMember } from "../Staff" // Importando a interface

// Função para capitalizar a primeira letra
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const columns: ColumnDef<StaffMember>[] = [
  {
    accessorKey: "displayName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const member = row.original;
        const name = member.displayName;
        const photoUrl = member.photo_url;
        const fallback = name.split(' ').map(n => n[0]).join('').toUpperCase();

        return (
            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={photoUrl} alt={name} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{name}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const variant: "outline" | "secondary" = role === 'admin' ? 'outline' : 'secondary';
      return <Badge variant={variant}>{capitalize(role)}</Badge>
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("active");
      return isActive ? <Badge>Ativo</Badge> : <Badge variant="destructive">Inativo</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(member.id)}>
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Ver Perfil</DropdownMenuItem>
            <DropdownMenuItem disabled>Editar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
