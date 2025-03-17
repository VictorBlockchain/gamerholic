"use client"

import { TableHead } from "@/components/ui/table"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableTableHeaderProps {
  column: string
  label: string
  sortColumn: string | null
  sortDirection: "asc" | "desc"
  onSort: (column: string) => void
  className?: string
}

export function SortableTableHeader({
  column,
  label,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: SortableTableHeaderProps) {
  const isSorted = sortColumn === column

  return (
    <TableHead className={cn("cursor-pointer", className)} onClick={() => onSort(column)}>
      <div className="flex items-center">
        {label}
        {isSorted ? (
          sortDirection === "asc" ? (
            <ArrowUp className="w-4 h-4 ml-1" />
          ) : (
            <ArrowDown className="w-4 h-4 ml-1" />
          )
        ) : null}
      </div>
    </TableHead>
  )
}

