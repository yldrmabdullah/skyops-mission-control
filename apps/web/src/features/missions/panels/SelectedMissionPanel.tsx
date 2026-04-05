import type { ReactNode } from "react"
import { format } from "date-fns"
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Plane, 
  Activity,
  MousePointer2,
  Info
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatEnumLabel } from "../../../lib/format"
import type { Mission } from "../../../types/api"

interface SelectedMissionPanelProps {
  children: ReactNode
  mission: Mission | undefined
}

export function SelectedMissionPanel({
  children,
  mission,
}: SelectedMissionPanelProps) {
  if (!mission) {
    return (
      <Card className="glass h-full border-dashed border-2 flex flex-col items-center justify-center text-center p-8">
        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
          <MousePointer2 className="h-8 w-8 text-primary/40" />
        </div>
        <CardTitle className="mb-2">No Mission Selected</CardTitle>
        <CardDescription className="max-w-[240px]">
          Select an operational unit from the timeline to manage its lifecycle and parameters.
        </CardDescription>
      </Card>
    )
  }

  const statusColor = 
    mission.status === "PLANNED" ? "bg-secondary" :
    mission.status === "IN_PROGRESS" ? "bg-blue-500" :
    mission.status === "COMPLETED" ? "bg-emerald-500" :
    mission.status === "ABORTED" ? "bg-rose-500" : "bg-muted"

  return (
    <Card className="glass h-full overflow-hidden flex flex-col relative">
      <div className={`absolute top-0 left-0 w-1 h-full ${statusColor}`} />
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight underline decoration-primary/20 underline-offset-4 decoration-2">
              {mission.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Plane className="h-3 w-3" />
              {mission.drone?.serialNumber ?? mission.droneId}
              <span className="opacity-30">•</span>
              {formatEnumLabel(mission.type)}
            </div>
          </div>
          <Badge
            variant={
              mission.status === "PLANNED" ? "secondary" :
              mission.status === "IN_PROGRESS" ? "info" :
              mission.status === "COMPLETED" ? "success" :
              mission.status === "ABORTED" ? "destructive" : "outline"
            }
            className="uppercase tracking-widest text-[9px] py-1 px-3"
          >
            {mission.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1 group hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <User className="h-3 w-3" />
              Pilot
            </div>
            <div className="text-sm font-bold truncate">
              {mission.pilotName}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1 group hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <MapPin className="h-3 w-3" />
              Location
            </div>
            <div className="text-sm font-bold truncate">
              {mission.siteLocation}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1 group hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Calendar className="h-3 w-3" />
              Departure
            </div>
            <div className="text-sm font-bold truncate">
              {format(new Date(mission.plannedStart), "dd MMM HH:mm")}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1 group hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              Estimated End
            </div>
            <div className="text-sm font-bold truncate">
              {format(new Date(mission.plannedEnd), "dd MMM HH:mm")}
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
             <Activity className="h-3 w-3" />
             Mission Controls
          </div>
          {children}
        </div>
      </CardContent>

      <div className="px-6 py-3 bg-muted/10 border-t border-border/40 flex items-center gap-2 mt-auto">
         <Info className="h-3 w-3 text-muted-foreground" />
         <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
           Operational state locked unless modified by authorized personnel.
         </span>
      </div>
    </Card>
  )
}
