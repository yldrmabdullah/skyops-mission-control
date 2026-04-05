import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2, Plane, User, MapPin } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { formatEnumLabel } from "../../lib/format"
import type { CreateMissionPayload, Drone, Mission } from "../../types/api"
import { missionTypes } from "./mission-form.utils"

const missionPlanSchema = z.object({
  name: z.string().min(1, "Mission name is required"),
  type: z.string().min(1, "Mission type is required"),
  droneId: z.string().min(1, "Assigned drone is required"),
  pilotName: z.string().min(1, "Pilot name is required"),
  siteLocation: z.string().min(1, "Site location is required"),
  plannedStart: z.date({ message: "Planned start date is required" }),
  plannedEnd: z.date({ message: "Planned end date is required" }),
}).refine((data) => data.plannedEnd > data.plannedStart, {
  message: "End date must be after start date",
  path: ["plannedEnd"],
})

type MissionPlanFormValues = z.infer<typeof missionPlanSchema>

interface MissionPlanFormProps {
  drones: Drone[]
  isPending: boolean
  mission: Mission
  onSubmit: (payload: CreateMissionPayload) => void
}

export function MissionPlanForm({
  drones,
  isPending,
  mission,
  onSubmit,
}: MissionPlanFormProps) {
  const form = useForm<MissionPlanFormValues>({
    resolver: zodResolver(missionPlanSchema),
    defaultValues: {
      name: mission.name,
      type: mission.type,
      droneId: mission.droneId,
      pilotName: mission.pilotName,
      siteLocation: mission.siteLocation,
      plannedStart: new Date(mission.plannedStart),
      plannedEnd: new Date(mission.plannedEnd),
    },
  })

  const handleSubmit = (values: MissionPlanFormValues) => {
    onSubmit({
      ...values,
      plannedStart: values.plannedStart.toISOString(),
      plannedEnd: values.plannedEnd.toISOString(),
    } as CreateMissionPayload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mission Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Pipeline Alpha Inspection" className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/20 font-medium" />
                </FormControl>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mission Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-background/50 border-border/50 font-medium">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass">
                    {missionTypes.map((type) => (
                      <SelectItem key={type} value={type} className="font-medium focus:bg-primary/10">
                        {formatEnumLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="droneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Plane className="h-3.5 w-3.5" /> Assigned Drone
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 bg-background/50 border-border/50 font-medium">
                      <SelectValue placeholder="Select drone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass">
                    {drones.map((drone) => (
                      <SelectItem key={drone.id} value={drone.id} className="font-medium focus:bg-primary/10">
                        {drone.serialNumber} ({drone.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pilotName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Pilot in Command
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 bg-background/50 border-border/50 font-medium" />
                </FormControl>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="siteLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Site Location
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-11 bg-background/50 border-border/50 font-medium" />
                </FormControl>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plannedStart"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Planned Start</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-11 pl-3 text-left font-medium bg-background/50 border-border/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="rounded-md border-0"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plannedEnd"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Planned End</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-11 pl-3 text-left font-medium bg-background/50 border-border/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="rounded-md border-0"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs transition-all shadow-lg"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling Update...
            </>
          ) : (
            "Update Mission Schedule"
          )}
        </Button>
      </form>
    </Form>
  )
}
