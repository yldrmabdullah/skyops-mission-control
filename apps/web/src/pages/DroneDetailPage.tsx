import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  Settings2,
  Wrench,
  History,
  AlertTriangle,
  HelpCircle,
  Info,
  Shield,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { useAuth } from "../auth/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { DroneDangerZone } from "../features/drones/DroneDangerZone"
import { DroneProfileForm } from "../features/drones/DroneProfileForm"
import { MaintenanceLogForm } from "../features/drones/MaintenanceLogForm"
import {
  DroneSummaryPanel,
  MaintenanceHistoryPanel,
  MissionHistoryPanel,
} from "../features/drones/DronePanels"
import {
  createMaintenanceLog,
  deleteDrone,
  fetchDrone,
  getErrorMessage,
  updateDrone,
  uploadMaintenanceAttachment,
} from "../lib/api"
import { invalidateDroneRelatedQueries } from "../lib/query-invalidation"
import { canManageFleet, canRecordMaintenance } from "../lib/roles"

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export function DroneDetailPage() {
  const { user } = useAuth()
  const { droneId = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteArmed, setIsDeleteArmed] = useState(false)

  const droneQuery = useQuery({
    queryKey: ["drone", droneId],
    queryFn: () => fetchDrone(droneId),
    enabled: Boolean(droneId),
  })
  
  const drone = droneQuery.data
  const isLoading = droneQuery.isLoading

  const updateDroneMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateDrone>[1]) =>
      updateDrone(droneId, payload),
    onSuccess: async () => {
      toast.success("Drone profile updated successfully.")
      await invalidateDroneRelatedQueries(queryClient, droneId)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const createMaintenanceLogMutation = useMutation({
    mutationFn: async ({
      payload,
      file,
    }: {
      payload: Parameters<typeof createMaintenanceLog>[0]
      file?: File
    }) => {
      const log = await createMaintenanceLog(payload)
      if (file) {
        await uploadMaintenanceAttachment(log.id, file)
      }
      return log
    },
    onSuccess: async () => {
      toast.success("Maintenance log added successfully.")
      await invalidateDroneRelatedQueries(queryClient, droneId)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const deleteDroneMutation = useMutation({
    mutationFn: () => deleteDrone(droneId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["drones"] }),
        queryClient.invalidateQueries({ queryKey: ["fleet-health"] }),
      ])
      toast.success("Drone asset removed from registry.")
      void navigate("/drones")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
      setIsDeleteArmed(false)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 lg:p-8">
        <div className="flex flex-col gap-4">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-[400px] md:col-span-1" />
           <Skeleton className="h-[400px] md:col-span-2" />
        </div>
      </div>
    )
  }

  if (droneQuery.isError || !drone) {
    const message = droneQuery.isError ? getErrorMessage(droneQuery.error) : "Drone data unavailable."
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12">
        <Alert variant="destructive" className="glass">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Asset Registry Error</AlertTitle>
          <AlertDescription className="mt-2">
            {message}
          </AlertDescription>
          <div className="mt-6 flex justify-end">
            <Button asChild variant="outline">
              <Link to="/drones">Return to Registry</Link>
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  const canDelete = !drone.missions?.length && !drone.maintenanceLogs?.length
  const allowFleetEdits = canManageFleet(user?.role)
  const allowMaintenance = canRecordMaintenance(user?.role)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-4">
          <Link 
            to="/drones" 
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Registry
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight underline decoration-primary/30 underline-offset-4 decoration-2">
                {drone.serialNumber}
              </h1>
              {drone.maintenanceDue && (
                <Badge variant="error" className="animate-pulse shadow-sm shadow-rose-500/20">
                  Maintenance Due
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Configuration and history for the <span className="font-bold text-foreground/80">{drone.model}</span> fleet unit.
              Real-time synchronization across fleet management and operation dashboards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card/10 backdrop-blur-sm p-1.5 rounded-xl border border-border/40 shadow-sm self-start md:self-end">
           <Badge variant={drone.status === "AVAILABLE" ? "success" : "warning"} className="px-3 py-1 text-sm font-bold uppercase tracking-wider">
             {drone.status.replace("_", " ")}
           </Badge>
        </div>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sticky top-2 z-40 p-1 rounded-xl bg-background/50 backdrop-blur-lg border border-border/25 shadow-lg">
          <TabsList className="bg-transparent border-none w-full sm:w-auto p-0">
            <TabsTrigger value="profile" className="flex-1 sm:flex-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all gap-2">
              <Settings2 className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex-1 sm:flex-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all gap-2">
              <History className="h-4 w-4" />
              Mission Logs
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden lg:flex items-center gap-2 pr-2 text-[10px] uppercase font-bold text-muted-foreground">
             <Info className="h-3 w-3" />
             Last Sync: {format(new Date(), "HH:mm")}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="profile" className="mt-2 space-y-8 outline-none">
            <motion.div 
               variants={itemVariants} 
               initial="hidden" 
               animate="visible" 
               exit={{ opacity: 0, y: -20 }}
               className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2">
                <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-border/25 pb-4">
                     <h3 className="text-xl font-bold flex items-center gap-2">
                       <Settings2 className="h-5 w-5 text-primary" />
                       Primary Configuration
                     </h3>
                     {!allowFleetEdits && (
                       <Badge variant="outline" className="text-[10px] font-mono">READ_ONLY_ACCESS</Badge>
                     )}
                  </div>
                  {allowFleetEdits ? (
                    <DroneProfileForm
                      key={`${drone.id}-${drone.status}-${drone.totalFlightHours}`}
                      drone={drone}
                      isPending={updateDroneMutation.isPending}
                      onSubmit={(payload) => updateDroneMutation.mutate(payload)}
                    />
                  ) : (
                    <Alert className="glass bg-amber-500/5">
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Restricted Access</AlertTitle>
                      <AlertDescription>
                        You are signed in as <strong>{user?.role}</strong>. Only workspace <strong>MANAGERS</strong> can modify asset configurations.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              <div className="space-y-8">
                <DroneSummaryPanel drone={drone} />
                {allowFleetEdits && (
                   <DroneDangerZone
                    canDelete={canDelete}
                    feedback={null}
                    isDeleteArmed={isDeleteArmed}
                    isPending={deleteDroneMutation.isPending}
                    onDelete={() => {
                        if (!isDeleteArmed) {
                          setIsDeleteArmed(true);
                          return;
                        }
                        deleteDroneMutation.mutate();
                    }}
                  />
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-2 space-y-8 outline-none">
            <motion.div 
               variants={itemVariants} 
               initial="hidden" 
               animate="visible" 
               exit={{ opacity: 0, y: -20 }}
               className="grid grid-cols-1 xl:grid-cols-5 gap-8"
            >
              <div className="xl:col-span-3">
                <div className="glass rounded-2xl p-6 md:p-8 space-y-6 h-full">
                  <div className="flex items-center justify-between border-b border-border/25 pb-4 mb-2">
                     <h3 className="text-xl font-bold flex items-center gap-2">
                       <Wrench className="h-5 w-5 text-primary" />
                       New Service Record
                     </h3>
                  </div>
                  {allowMaintenance ? (
                    <MaintenanceLogForm
                      key={`${drone.id}-${drone.maintenanceLogs?.length ?? 0}`}
                      droneId={droneId}
                      totalFlightHours={drone.totalFlightHours}
                      isPending={createMaintenanceLogMutation.isPending}
                      onSubmit={(payload, options) => {
                        createMaintenanceLogMutation.mutate({
                          payload,
                          file: options?.file,
                        });
                      }}
                    />
                  ) : (
                    <Alert className="glass bg-amber-500/5">
                      <HelpCircle className="h-4 w-4" />
                      <AlertTitle>Insufficent Permissions</AlertTitle>
                      <AlertDescription>
                        Standard users cannot manually register maintenance events.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              <div className="xl:col-span-2">
                <MaintenanceHistoryPanel
                  drone={drone}
                  emptyHint={
                    user?.role === "PILOT"
                      ? "Operational details are visible to Technicians and Managers only."
                      : undefined
                  }
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="mt-2 outline-none">
            <motion.div 
               variants={itemVariants} 
               initial="hidden" 
               animate="visible" 
               exit={{ opacity: 0, y: -20 }}
               className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-2xl font-bold">Operational Timeline</h2>
                 <Badge variant="outline" className="font-mono">{drone.missions?.length ?? 0} MISSIONS</Badge>
              </div>
              <MissionHistoryPanel drone={drone} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}
