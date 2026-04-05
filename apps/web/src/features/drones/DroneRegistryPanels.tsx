import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  LayoutGrid,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Drone } from "../../types/api"
import type { DroneListSortField } from "./drone-list-sort"
import { DroneRegistryTableRow } from "./DroneRegistryTableRow"

function SortableTh({
  label,
  field,
  activeField,
  sortOrder,
  onSort,
}: {
  label: string
  field: DroneListSortField
  activeField: DroneListSortField
  sortOrder: "ASC" | "DESC"
  onSort: (field: DroneListSortField) => void
}) {
  const active = activeField === field
  
  return (
    <TableHead className="py-3">
      <button
        className={`flex items-center gap-1 transition-colors hover:text-foreground ${active ? "text-foreground font-bold" : "text-muted-foreground"}`}
        type="button"
        onClick={() => onSort(field)}
      >
        {label}
        {active ? (
          sortOrder === "ASC" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    </TableHead>
  )
}

interface DroneRegistryHighlightsProps {
  total: number
}

export function DroneRegistryHighlights({ total }: DroneRegistryHighlightsProps) {
  const highlights = [
    {
      title: "Strong domain validation",
      description: "Serial format, maintenance dates, and operational status are enforced end to end.",
      icon: ShieldCheck,
      color: "text-blue-500",
    },
    {
      title: "Maintenance-aware operations",
      description: "Fleet detail is linked to mission and maintenance history for full auditability.",
      icon: Zap,
      color: "text-amber-500",
    },
    {
      title: "Drill-down ready",
      description: `Access flight logs and health telemetry across all ${total} tracked aircraft.`,
      icon: LayoutGrid,
      color: "text-emerald-500",
    },
  ]

  return (
    <Card className="glass h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registry Intelligence</CardTitle>
          <Badge variant="outline" className="text-[10px] tracking-tight text-muted-foreground uppercase">
            Fleet Overview
          </Badge>
        </div>
        <CardDescription>Automated insights for fleet management.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-6">
          {highlights.map((item, index) => (
            <li key={index} className="flex gap-4 group">
              <div className={`mt-1 h-8 w-8 rounded-lg bg-background/50 flex items-center justify-center border border-border/40 shadow-sm transition-transform group-hover:scale-110`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold leading-none">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  {item.description}
                </p>
          </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

interface DroneRegistryToolbarProps {
  onSearchChange: (value: string) => void
  onStatusChange: (status: string) => void
  searchValue: string
  selectedStatus: string
}

export function DroneRegistryToolbar({
  onSearchChange,
  onStatusChange,
  searchValue,
  selectedStatus,
}: DroneRegistryToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-6">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by serial number or model..."
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10 h-11 bg-background/50"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-background/50">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Statuses" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="IN_MISSION">In Mission</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface DronesTableProps {
  drones: Drone[]
  isBackgroundFetching?: boolean
  isLoading: boolean
  sortBy: DroneListSortField
  sortOrder: "ASC" | "DESC"
  total: number
  onSortChange: (field: DroneListSortField) => void
}

export function DronesTable({
  drones,
  isBackgroundFetching: _isBackgroundFetching = false,
  isLoading,
  sortBy,
  sortOrder,
  total,
  onSortChange,
}: DronesTableProps) {
  const skeletons = Array(5).fill(0)

  return (
    <Card className="glass border-none shadow-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-border/50">
            <SortableTh
              activeField={sortBy}
              field="serialNumber"
              label="Serial number"
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <SortableTh
              activeField={sortBy}
              field="model"
              label="Model"
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <SortableTh
              activeField={sortBy}
              field="status"
              label="Status"
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <SortableTh
              activeField={sortBy}
              field="totalFlightHours"
              label="Total hours"
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <SortableTh
              activeField={sortBy}
              field="nextMaintenanceDueDate"
              label="Next maintenance"
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <SortableTh
              activeField={sortBy}
              field="registeredAt"
              label="Registered"
              sortOrder={sortOrder}
              onSort={onSortChange}
            />
            <TableHead className="text-right py-3 uppercase text-[10px] font-bold tracking-wider opacity-50">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
      {isLoading ? (
            skeletons.map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                {Array(7).fill(0).map((_, j) => (
                  <TableCell key={j} className="py-6">
                    <Skeleton className="h-4 w-full opacity-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : drones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center bg-muted/5">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-5 w-5 text-muted-foreground opacity-50" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">No assets found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search terms or filters to find match.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            drones.map((drone) => (
              <DroneRegistryTableRow drone={drone} key={drone.id} />
            ))
          )}
        </TableBody>
      </Table>
      
      {!isLoading && (
        <div className="px-6 py-4 bg-muted/10 border-t border-border/40 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-bold text-foreground">{drones.length}</span> of <span className="font-bold text-foreground">{total}</span> assets
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
            <Info className="h-3 w-3" />
            Live Registry Sync Active
          </div>
        </div>
      )}
    </Card>
  )
}
