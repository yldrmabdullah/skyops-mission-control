import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
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
import { droneModels, editableStatuses, formatEnumLabel } from "./drone-detail.utils"
import type {
  CreateDronePayload,
  DroneModel,
  DroneStatus,
} from "../../types/api"

const droneRegistrySchema = z.object({
  serialNumber: z.string().min(1, "Serial number is required").toUpperCase(),
  model: z.string().min(1, "Model is required"),
  status: z.string().min(1, "Status is required"),
  totalFlightHours: z.string().refine((val) => !isNaN(Number(val.replace(",", "."))), {
    message: "Must be a valid number",
  }),
  flightHoursAtLastMaintenance: z.string().refine((val) => !isNaN(Number(val.replace(",", "."))), {
    message: "Must be a valid number",
  }),
  lastMaintenanceDate: z.date({
    message: "Last maintenance date is required",
  }),
})

type DroneRegistryFormValues = z.infer<typeof droneRegistrySchema>

interface DroneRegistryFormProps {
  feedback: { tone: "success" | "error"; message: string } | null
  isPending: boolean
  onSubmit: (payload: CreateDronePayload) => void
}

export function DroneRegistryForm({
  isPending,
  onSubmit,
}: DroneRegistryFormProps) {
  const form = useForm<DroneRegistryFormValues>({
    resolver: zodResolver(droneRegistrySchema),
    defaultValues: {
      serialNumber: "",
      model: "MATRICE_300",
      status: "AVAILABLE",
      totalFlightHours: "0",
      flightHoursAtLastMaintenance: "0",
      lastMaintenanceDate: new Date(),
    },
  })

  function handleSubmit(values: DroneRegistryFormValues) {
    onSubmit({
      serialNumber: values.serialNumber.trim(),
      model: values.model as DroneModel,
      status: values.status as DroneStatus,
      totalFlightHours: Number(values.totalFlightHours.replace(",", ".")),
      flightHoursAtLastMaintenance: Number(values.flightHoursAtLastMaintenance.replace(",", ".")),
      lastMaintenanceDate: values.lastMaintenanceDate.toISOString(),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="serialNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Serial Number</FormLabel>
              <FormControl>
                <Input
                  data-testid="drone-serial-input"
                  placeholder="SKY-XXXX-XXXX"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {droneModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {formatEnumLabel(model)}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {editableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatEnumLabel(status)}
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
            name="totalFlightHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Flight Hours</FormLabel>
                <FormControl>
                  <Input
                    aria-label="Total flight hours"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="flightHoursAtLastMaintenance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours at Last Service</FormLabel>
                <FormControl>
                  <Input
                    aria-label="Hours at last maintenance"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="lastMaintenanceDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-2">Last Maintenance Date</FormLabel>
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
                        format(field.value, "PPP")
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            data-testid="create-drone-submit"
            disabled={isPending}
            className="w-full md:w-auto min-w-[140px]"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Registering..." : "Register Drone"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
