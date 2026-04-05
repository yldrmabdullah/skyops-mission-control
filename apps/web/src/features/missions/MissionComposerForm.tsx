import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2, Plane, User, MapPin } from "lucide-react"
import { format, addHours } from "date-fns"

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
import { Badge } from "@/components/ui/badge"
import { formatEnumLabel } from "../../lib/format"
import type { CreateMissionPayload, Drone, MissionType } from "../../types/api"
import { missionTypes } from "./mission-form.utils"

const missionComposerSchema = z.object({
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

type MissionComposerFormValues = z.infer<typeof missionComposerSchema>

interface MissionComposerFormProps {
  drones: Drone[]
  feedback: { tone: "success" | "error"; message: string } | null
  isPending: boolean
  onSubmit: (payload: CreateMissionPayload) => void
}

export function MissionComposerForm({
  drones,
  isPending,
  onSubmit,
}: MissionComposerFormProps) {
  const form = useForm<MissionComposerFormValues>({
    resolver: zodResolver(missionComposerSchema),
    defaultValues: {
      name: "",
      type: missionTypes[0],
      droneId: "",
      pilotName: "",
      siteLocation: "",
      plannedStart: new Date(),
      plannedEnd: addHours(new Date(), 1),
    },
  })

  function handleSubmit(values: MissionComposerFormValues) {
    onSubmit({
      name: values.name,
      type: values.type as MissionType,
      droneId: values.droneId,
      pilotName: values.pilotName,
      siteLocation: values.siteLocation,
      plannedStart: values.plannedStart.toISOString(),
      plannedEnd: values.plannedEnd.toISOString(),
    })
  }

  const availableDrones = drones.filter((drone) => drone.status === "AVAILABLE")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission Name</FormLabel>
              <FormControl>
                <Input
                  data-testid="mission-name-input"
                  placeholder="e.g. North Ridge Tower Inspection"
                  {...field}
                  className="bg-background/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mission Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {missionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEnumLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="droneId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  Assigned Drone
                  <Badge variant="outline" className="text-[9px] py-0">
                    {availableDrones.length} Available
                  </Badge>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      data-testid="mission-drone-select"
                      className="bg-background/50"
                    >
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drones.map((drone) => (
                      <SelectItem
                        key={drone.id}
                        value={drone.id}
                        disabled={drone.status !== "AVAILABLE"}
                      >
                        <div className="flex items-center gap-2">
                           <Plane className="h-3 w-3 opacity-50" />
                           {drone.serialNumber} 
                           <span className="text-[10px] opacity-50">({formatEnumLabel(drone.status)})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pilotName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilot Command</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input
                      aria-label="Pilot name"
                      {...field}
                      className="pl-10 bg-background/50"
                      placeholder="Operator initials or name"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="siteLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deployment Site</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input
                      aria-label="Site location"
                      {...field}
                      className="pl-10 bg-background/50"
                      placeholder="Coordinates or site name"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-4 mt-2">
          <FormField
            control={form.control}
            name="plannedStart"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">Planned Start</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                       <Input 
                         type="time" 
                         className="h-8"
                         value={format(field.value, "HH:mm")}
                         onChange={(e) => {
                           const [h, m] = e.target.value.split(":")
                           const d = new Date(field.value)
                           d.setHours(Number(h), Number(m))
                           field.onChange(d)
                         }}
                       />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plannedEnd"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">Planned End</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                       <Input 
                         type="time" 
                         className="h-8"
                         value={format(field.value, "HH:mm")}
                         onChange={(e) => {
                           const [h, m] = e.target.value.split(":")
                           const d = new Date(field.value)
                           d.setHours(Number(h), Number(m))
                           field.onChange(d)
                         }}
                       />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            data-testid="create-mission-submit"
            disabled={isPending}
            className="w-full md:w-auto min-w-[160px] h-11"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Scheduling Mission..." : "Schedule Mission"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
