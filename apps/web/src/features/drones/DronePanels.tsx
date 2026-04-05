import { format } from "date-fns"
import { Download, ExternalLink, Calendar, Hourglass, Shield, Info } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatusPill } from "@/components/StatusPill"
import { downloadMaintenanceAttachmentFile } from "../../lib/api"
import type { Drone, MaintenanceAttachment } from "../../types/api"
import { formatEnumLabel } from "./drone-detail.utils"
import { cn } from "@/lib/utils"

interface DroneSummaryPanelProps {
  drone: Drone
}

export function DroneSummaryPanel({ drone }: DroneSummaryPanelProps) {
  const stats = [
    { label: "Model", value: formatEnumLabel(drone.model), icon: Shield },
    { label: "Total Flight Hours", value: `${drone.totalFlightHours.toFixed(1)}h`, icon: Hourglass },
    { label: "Last Maintenance", value: format(new Date(drone.lastMaintenanceDate), "dd MMM yyyy"), icon: Calendar },
    { label: "Next Due", value: format(new Date(drone.nextMaintenanceDueDate), "dd MMM yyyy"), icon: Calendar, highlight: drone.maintenanceDue },
  ]

  return (
    <Card className="glass h-full">
      <CardHeader>
        <CardTitle className="text-lg">Profile Summary</CardTitle>
        <CardDescription>Key operational metrics and status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 lg:bg-transparent">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {stat.label}
                </span>
                <span className={cn("text-sm font-medium", stat.highlight && "text-rose-500 font-bold")}>
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface MaintenanceHistoryPanelProps {
  drone: Drone
  emptyHint?: string
}

export function MaintenanceHistoryPanel({
  drone,
  emptyHint,
}: MaintenanceHistoryPanelProps) {
  return (
    <Card className="glass h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Maintenance History</CardTitle>
        <CardDescription>Record of previous services and repairs</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          {drone.maintenanceLogs?.length ? (
            <div className="space-y-4">
              {drone.maintenanceLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="group relative flex items-start justify-between p-4 rounded-xl border border-border/50 bg-background/20 hover:bg-background/40 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <span className="font-semibold text-sm">{formatEnumLabel(log.type)}</span>
                       <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                         {log.flightHoursAtMaintenance.toFixed(1)}h
                       </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{log.technicianName}</span>
                      <span>•</span>
                      <span>{format(new Date(log.performedAt), "dd MMM yyyy")}</span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        &quot;{log.notes}&quot;
                      </p>
                    )}
                    {log.attachments?.length ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {log.attachments.map((att: MaintenanceAttachment, index) =>
                          att.type === "url" ? (
                            <Button 
                              key={index} 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-[10px] gap-1.5 px-2 bg-primary/5 hover:bg-primary/10"
                              asChild
                            >
                              <a href={att.url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3 w-3" />
                                Link
                              </a>
                            </Button>
                          ) : (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] gap-1.5 px-2 bg-primary/5 hover:bg-primary/10"
                              onClick={() => 
                                downloadMaintenanceAttachmentFile(
                                  log.id, 
                                  att.storedFileName, 
                                  att.originalName || att.storedFileName
                                )
                              }
                            >
                              <Download className="h-3 w-3" />
                              File
                            </Button>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-2 opacity-60">
              <Info className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm">{emptyHint ?? "No maintenance logs recorded yet."}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface MissionHistoryPanelProps {
  drone: Drone
}

export function MissionHistoryPanel({ drone }: MissionHistoryPanelProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-lg">Mission History</CardTitle>
        <CardDescription>Previous operational flight records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drone.missions?.length ? (
            drone.missions.map((mission) => (
              <div 
                key={mission.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/20 hover:bg-background/40 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-sm">{mission.name}</span>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{mission.siteLocation}</span>
                    <span>•</span>
                    <span>{format(new Date(mission.plannedStart), "dd MMM yyyy")}</span>
                  </div>
                </div>
                <StatusPill value={mission.status} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 opacity-60">
              <Info className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm">No mission history available yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
