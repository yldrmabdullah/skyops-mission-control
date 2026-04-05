import { Search, Calendar as CalendarIcon, Plane, Activity } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { formatEnumLabel } from "../../../lib/format"
import type { Drone, MissionStatus } from "../../../types/api"
import { missionStatuses } from "../mission-form.utils"

interface MissionFiltersProps {
  drones: Drone[]
  endDate: string
  onChange: (
    nextFilters: Partial<{
      status: "" | MissionStatus
      droneId: string
      startDate: string
      endDate: string
      search: string
    }>,
  ) => void
  search: string
  startDate: string
  status: "" | MissionStatus
  droneId: string
}

export function MissionFilters({
  drones,
  endDate,
  onChange,
  search,
  startDate,
  status,
  droneId,
}: MissionFiltersProps) {
  return (
    <div className="glass rounded-2xl p-6 mb-8 border-border/40 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="space-y-2 lg:col-span-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Mission or pilot..."
              value={search}
              onChange={(event) => onChange({ search: event.target.value })}
              className="pl-10 h-11 bg-background/50 border-border/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
            Status
          </Label>
          <Select
            value={status || "ALL"}
            onValueChange={(val) => onChange({ status: val === "ALL" ? "" : (val as MissionStatus) })}
          >
            <SelectTrigger className="h-11 bg-background/50 border-border/40">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All statuses" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {missionStatuses.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatEnumLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
            Assigned Drone
          </Label>
          <Select
            value={droneId || "ALL"}
            onValueChange={(val) => onChange({ droneId: val === "ALL" ? "" : val })}
          >
            <SelectTrigger className="h-11 bg-background/50 border-border/40">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All drones" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Drones</SelectItem>
              {drones.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.serialNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
            Start After
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal bg-background/50 border-border/40",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                {startDate ? format(new Date(startDate), "PPP") : <span>Pick date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
                onSelect={(date) => onChange({ startDate: date ? format(date, "yyyy-MM-dd") : "" })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">
            End Before
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal bg-background/50 border-border/40",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                {endDate ? format(new Date(endDate), "PPP") : <span>Pick date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={(date) => onChange({ endDate: date ? format(date, "yyyy-MM-dd") : "" })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
