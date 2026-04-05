import { format, parseISO } from "date-fns"
import { 
  Clock,
  Plane,
  MapPin,
  Activity,
  ArrowUpDown,
  MoreVertical,
  History,
  Info,
  User
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatEnumLabel } from "../../../lib/format"
import type { Mission, MissionListSortField, SortOrder } from "../../../types/api"

interface MissionTimelineTableProps {
  isBackgroundFetching: boolean
  isLoading: boolean
  missions: Mission[]
  selectedMissionId: string
  sortBy: MissionListSortField
  sortOrder: SortOrder
  onSelect: (id: string) => void
  onSortChange: (field: MissionListSortField) => void
}

export function MissionTimelineTable({
  isBackgroundFetching,
  isLoading,
  missions,
  selectedMissionId,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
  onSelect,
  onSortChange,
}: MissionTimelineTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-muted/20" />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {isBackgroundFetching && (
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 overflow-hidden z-10">
          <div className="h-full bg-primary animate-shimmer" style={{ width: "40%" }} />
        </div>
      )}
      
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-border/40">
            <TableHead className="w-[200px]">
              <Button 
                variant="ghost" 
                size="sm" 
                className="-ml-3 h-8 data-[state=open]:bg-accent font-bold text-[10px] uppercase tracking-widest"
                onClick={() => onSortChange("name")}
              >
                Mission Unit
                <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </TableHead>
            <TableHead>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status / Type</span>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <User className="h-3 w-3" /> Pilot
              </div>
            </TableHead>
            <TableHead>
               <Button 
                variant="ghost" 
                size="sm" 
                className="-ml-3 h-8 font-bold text-[10px] uppercase tracking-widest"
                onClick={() => onSortChange("plannedStart")}
              >
                Schedule
                <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {missions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center space-y-2 opacity-40">
                   <History className="h-8 w-8" />
                   <p className="text-xs font-medium">No operational logs found matching filters.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            missions.map((mission) => (
              <TableRow 
                key={mission.id}
                data-state={selectedMissionId === mission.id ? "selected" : ""}
                className={cn(
                  "cursor-pointer group transition-all border-border/40",
                  selectedMissionId === mission.id ? "bg-primary/[0.03]" : "hover:bg-muted/20"
                )}
                onClick={() => onSelect(mission.id)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold tracking-tight text-sm group-hover:text-primary transition-colors">
                      {mission.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground mt-0.5">
                      <Plane className="h-3 w-3 opacity-50" />
                      {mission.drone?.serialNumber ?? mission.droneId}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        mission.status === "PLANNED" ? "secondary" :
                        mission.status === "IN_PROGRESS" ? "info" :
                        mission.status === "COMPLETED" ? "success" :
                        mission.status === "ABORTED" ? "destructive" : "outline"
                      }
                      className="uppercase text-[9px] font-black tracking-tighter px-2 py-0"
                    >
                      {mission.status.replace("_", " ")}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
                      {formatEnumLabel(mission.type)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                      {mission.pilotName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold">{mission.pilotName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                       <Clock className="h-3 w-3 text-primary opacity-50" />
                       {format(parseISO(mission.plannedStart), "HH:mm")}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
                       {format(parseISO(mission.plannedStart), "dd MMM yyyy")}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass w-48">
                      <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Mission Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                        <Activity className="mr-2 h-3.5 w-3.5" /> View Flight Telemetry
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                        <MapPin className="mr-2 h-3.5 w-3.5" /> Site Location Detail
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs font-medium cursor-pointer text-destructive focus:text-destructive">
                        <Info className="mr-2 h-3.5 w-3.5" /> Audit Log
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
