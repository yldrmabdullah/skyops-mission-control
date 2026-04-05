import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2, ArrowRightLeft, Clock, Activity } from "lucide-react"
import { format } from "date-fns"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { formatEnumLabel } from "../../lib/format"
import type { Mission, MissionStatus, TransitionMissionPayload } from "../../types/api"
import {
  getAllowedTransitions,
  transitionFormToPayload,
} from "./mission-form.utils"

const transitionSchema = z.object({
  status: z.string().min(1, "Status is required"),
  actualStart: z.date().optional(),
  actualEnd: z.date().optional(),
  flightHoursLogged: z.string().optional().refine((val) => !val || !isNaN(Number(val.replace(",", "."))), {
    message: "Must be a valid number",
  }),
  abortReason: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status === "IN_PROGRESS" && !data.actualStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Actual start date is required",
      path: ["actualStart"],
    })
  }
  if ((data.status === "COMPLETED" || data.status === "ABORTED") && !data.actualEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Actual end date is required",
      path: ["actualEnd"],
    })
  }
  if (data.status === "COMPLETED") {
    const hours = Number(data.flightHoursLogged?.replace(",", ".") || "0")
    if (hours < 0.1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flight hours must be at least 0.1 for completion",
        path: ["flightHoursLogged"],
      })
    }
  }
  if (data.status === "ABORTED" && (!data.abortReason || data.abortReason.length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A valid abort reason (min 5 chars) is required",
      path: ["abortReason"],
    })
  }
})

type TransitionFormValues = z.infer<typeof transitionSchema>

interface MissionTransitionFormProps {
  isPending: boolean
  mission: Mission
  onSubmit: (payload: TransitionMissionPayload) => void
}

function MissionTransitionFormFields({
  isPending,
  mission,
  onSubmit,
}: MissionTransitionFormProps) {
  const allowedStatuses = getAllowedTransitions(mission.status)

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionSchema),
    defaultValues: {
      status: allowedStatuses[0] ?? "",
      flightHoursLogged: "0.0",
      abortReason: "",
    },
  })

  const selectedStatus = form.watch("status")

  useEffect(() => {
    if (selectedStatus === "IN_PROGRESS") {
      const current = form.getValues("actualStart")
      if (!current) {
        form.setValue("actualStart", new Date())
      }
    }
  }, [selectedStatus, form])

  useEffect(() => {
    if (selectedStatus === "COMPLETED" || selectedStatus === "ABORTED") {
      const current = form.getValues("actualEnd")
      if (!current) {
        form.setValue("actualEnd", new Date())
      }
    }
  }, [selectedStatus, form])

  const handleSubmit = (values: TransitionFormValues) => {
    const status = values.status as MissionStatus
    const payload = transitionFormToPayload(
      {
        status,
        actualStart: values.actualStart?.toISOString() ?? "",
        actualEnd: values.actualEnd?.toISOString() ?? "",
        flightHoursLogged: values.flightHoursLogged ?? "",
        abortReason: values.abortReason ?? "",
      },
      status,
    )
    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Next Lifecycle State
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/20 transition-all font-medium">
                    <SelectValue placeholder="Select target status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="glass">
                  {allowedStatuses.map((status) => (
                    <SelectItem 
                      key={status} 
                      value={status}
                      className="font-medium focus:bg-primary/10"
                    >
                      {formatEnumLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-[10px]">
                Moving from {formatEnumLabel(mission.status)}
              </FormDescription>
              <FormMessage className="text-[10px] font-bold" />
            </FormItem>
          )}
        />

        {selectedStatus === "IN_PROGRESS" && (
          <FormField
            control={form.control}
            name="actualStart"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Actual Start Time
                </FormLabel>
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
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date</span>
                        )}
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
        )}

        {(selectedStatus === "COMPLETED" || selectedStatus === "ABORTED") && (
          <FormField
            control={form.control}
            name="actualEnd"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Actual Completion Time
                </FormLabel>
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
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Pick a date</span>
                        )}
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
        )}

        {selectedStatus === "COMPLETED" && (
          <FormField
            control={form.control}
            name="flightHoursLogged"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Flight Hours to Log
                </FormLabel>
                <FormControl>
                  <Input
                    aria-label="Flight hours logged"
                    {...field}
                    type="text"
                    placeholder="e.g. 1.5"
                    className="h-11 bg-background/50 border-border/50 focus-visible:ring-primary/20 font-medium"
                  />
                </FormControl>
                <FormDescription className="text-[10px]">
                  Total duration of flight in decimal hours.
                </FormDescription>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />
        )}

        {selectedStatus === "ABORTED" && (
          <FormField
            control={form.control}
            name="abortReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground text-destructive">
                  Reason for Aborting
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe why the mission was stopped..." 
                    className="min-h-[100px] bg-background/50 border-border/50 focus-visible:ring-destructive/20 font-medium resize-none shadow-inner"
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          data-testid="mission-transition-submit"
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-[0.98]"
          disabled={isPending || !selectedStatus}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Mission...
            </>
          ) : (
            `Confirm Transition to ${selectedStatus ? formatEnumLabel(selectedStatus) : "..."}`
          )}
        </Button>
      </form>
    </Form>
  )
}

export function MissionTransitionForm(props: MissionTransitionFormProps) {
  const allowedStatuses = getAllowedTransitions(props.mission.status)

  if (allowedStatuses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 bg-muted/20 rounded-xl border border-dashed border-border">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Activity className="h-6 w-6 text-muted-foreground opacity-50" />
        </div>
        <div>
          <p className="text-sm font-bold">No further transitions</p>
          <p className="text-xs text-muted-foreground">
            This mission has reached its final state ({props.mission.status}).
          </p>
        </div>
      </div>
    )
  }

  return (
    <MissionTransitionFormFields
      key={`${props.mission.id}-${props.mission.status}`}
      {...props}
    />
  )
}
