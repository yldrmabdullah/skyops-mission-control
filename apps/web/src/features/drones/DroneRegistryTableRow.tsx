import { Link } from "react-router-dom"
import { Eye, ExternalLink } from "lucide-react"
import { format } from "date-fns"

import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatEnumLabel } from "./drone-detail.utils"
import type { Drone } from "../../types/api"

interface DroneRegistryTableRowProps {
  drone: Drone
}

export function DroneRegistryTableRow({ drone }: DroneRegistryTableRowProps) {
  const isMaintenanceDue = new Date(drone.nextMaintenanceDueDate) <= new Date()

  return (
    <TableRow className="group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
      <TableCell className="font-medium">
        <Link
          to={`/drones/${drone.id}`}
          className="flex items-center gap-2 font-mono text-primary hover:underline"
          data-registry-drone-id={drone.id}
        >
          {drone.serialNumber}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatEnumLabel(drone.model)}
      </TableCell>
      <TableCell>
        <Badge 
          variant={
            drone.status === "AVAILABLE" ? "success" : 
            drone.status === "IN_MISSION" ? "info" : 
            drone.status === "MAINTENANCE" ? "warning" : "secondary"
          }
          className="uppercase tracking-wider text-[10px] py-0.5"
        >
          {drone.status.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {drone.totalFlightHours.toFixed(1)}
        <span className="ml-1 text-[10px] text-muted-foreground uppercase">hrs</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className={isMaintenanceDue ? "text-destructive font-bold" : ""}>
            {format(new Date(drone.nextMaintenanceDueDate), "MMM d, yyyy")}
          </span>
          {isMaintenanceDue && (
             <span className="text-[10px] uppercase font-bold text-destructive animate-pulse">
               Overdue
             </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {drone.registeredAt ? format(new Date(drone.registeredAt), "MMM d, yyyy") : "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/drones/${drone.id}`} className="gap-2">
            <Eye className="h-4 w-4" />
            Details
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}
