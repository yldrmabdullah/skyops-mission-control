import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2, Upload, X, Link as LinkIcon, Info } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { maintenanceTypes, formatEnumLabel } from "./drone-detail.utils"
import type {
  CreateMaintenanceLogPayload,
  MaintenanceType,
} from "../../types/api"

const maintenanceLogSchema = z.object({
  type: z.string().min(1, "Maintenance type is required"),
  technicianName: z.string().min(2, "Technician name is required"),
  performedAt: z.date({
    message: "Service date is required",
  }),
  flightHoursAtMaintenance: z.string().refine((val) => !isNaN(Number(val.replace(",", "."))), {
    message: "Must be a valid number",
  }),
  notes: z.string().optional(),
  attachmentUrlsRaw: z.string().optional(),
})

type MaintenanceLogFormValues = z.infer<typeof maintenanceLogSchema>

interface MaintenanceLogFormProps {
  droneId: string
  totalFlightHours: number
  isPending: boolean
  onSubmit: (
    payload: CreateMaintenanceLogPayload,
    options?: { file?: File }
  ) => void
}

export function MaintenanceLogForm({
  droneId,
  totalFlightHours,
  isPending,
  onSubmit,
}: MaintenanceLogFormProps) {
  const [fileAttachment, setFileAttachment] = useState<File | null>(null)

  const form = useForm<MaintenanceLogFormValues>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: {
      type: "ROUTINE_CHECK",
      technicianName: "",
      performedAt: new Date(),
      flightHoursAtMaintenance: String(totalFlightHours),
      notes: "",
      attachmentUrlsRaw: "",
    },
  })

  const flightHours = Number(form.watch("flightHoursAtMaintenance").replace(",", "."))
  const isHoursSuspicious = flightHours > totalFlightHours + 50 || flightHours < totalFlightHours - 10

  function handleSubmit(values: MaintenanceLogFormValues) {
    const attachmentUrls = values.attachmentUrlsRaw
      ? values.attachmentUrlsRaw
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 5)
      : []

    onSubmit(
      {
        droneId,
        type: values.type as MaintenanceType,
        technicianName: values.technicianName.trim(),
        performedAt: values.performedAt.toISOString(),
        flightHoursAtMaintenance: Number(values.flightHoursAtMaintenance.replace(",", ".")),
        notes: values.notes?.trim() || undefined,
        ...(attachmentUrls.length ? { attachmentUrls } : {}),
      },
      {
        file: fileAttachment ?? undefined,
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Step 1: Service Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">1</div>
            <div>
              <h4 className="text-sm font-semibold">Service Details</h4>
              <p className="text-xs text-muted-foreground">Type and date of service</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
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
              name="performedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="mb-2">Service Date</FormLabel>
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
                          date > new Date() || date < new Date("2000-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Step 2: Technical Record */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">2</div>
            <div>
              <h4 className="text-sm font-semibold">Technical Record</h4>
              <p className="text-xs text-muted-foreground">Technician and airframe status</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
            <FormField
              control={form.control}
              name="technicianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alex Rivera" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flightHoursAtMaintenance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Airframe Hours at Service</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        className={cn(isHoursSuspicious && "border-amber-500 focus-visible:ring-amber-500")}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                        TOTAL: {totalFlightHours}h
                      </div>
                    </div>
                  </FormControl>
                  {isHoursSuspicious && flightHours > 0 && (
                    <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" />
                      Unusual variance from registered total ({totalFlightHours}h).
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Step 3: Documentation */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">3</div>
            <div>
              <h4 className="text-sm font-semibold">Documentation</h4>
              <p className="text-xs text-muted-foreground">Notes and attachments</p>
            </div>
          </div>
          <div className="space-y-4 ml-11">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed findings, parts replaced..."
                      className="min-h-[100px]"
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
                name="attachmentUrlsRaw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                       <LinkIcon className="h-3 w-3" />
                       External Links
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter comma-separated URLs"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Max 5 links allowed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>File Attachment (PDF/Image)</FormLabel>
                <div 
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border border-dashed p-4 transition-all hover:bg-accent/50 group relative min-h-[80px]",
                    fileAttachment ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  )}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    onChange={(e) => setFileAttachment(e.target.files?.[0] ?? null)}
                  />
                  {fileAttachment ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-primary truncate max-w-[150px]">
                        {fileAttachment.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 relative z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileAttachment(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-4 w-4 group-hover:text-primary transition-colors" />
                      <span className="text-[10px]">Click or drag to upload</span>
                    </div>
                  )}
                </div>
              </FormItem>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border/40">
           <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[180px]">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Creating Log..." : "Save Maintenance Log"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
