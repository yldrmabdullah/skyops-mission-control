import { useDeferredValue, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Rocket, 
  Settings2, 
  ShieldAlert, 
  Calendar as CalendarIcon,
  LayoutGrid,
  AlertCircle
} from "lucide-react"

import { useAuth } from "../auth/use-auth"
import { useNotifications } from "../components/use-notifications"
import { MissionComposerForm } from "../features/missions/MissionComposerForm"
import {
  MissionFilters,
  MissionTimelineTable,
  SelectedMissionPanel,
} from "../features/missions/MissionPanels"
import {
  missionSortOrderToParam,
  resolveMissionListSort,
} from "../features/missions/mission-list-sort"
import { MissionPlanForm } from "../features/missions/MissionPlanForm"
import { MissionTransitionForm } from "../features/missions/MissionTransitionForm"
import {
  createMission,
  fetchDrones,
  fetchMissions,
  getErrorMessage,
  transitionMission,
  updateMission,
} from "../lib/api"
import {
  localDateToEndOfDayIso,
  localDateToStartOfDayIso,
} from "../lib/date-iso-range"
import { invalidateMissionBoardQueries } from "../lib/query-invalidation"
import { canScheduleMissions } from "../lib/roles"
import type {
  CreateMissionPayload,
  MissionListSortField,
  MissionStatus,
  TransitionMissionPayload,
} from "../types/api"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MissionFiltersState {
  status: "" | MissionStatus
  droneId: string
  startDate: string
  endDate: string
  search: string
}

export function MissionsPage() {
  const { user } = useAuth()
  const { notify } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()
  const { sortBy, sortOrder } = resolveMissionListSort(searchParams)
  const allowMissionEdits = canScheduleMissions(user?.role)
  const [filters, setFilters] = useState<MissionFiltersState>({
    status: "",
    droneId: "",
    startDate: "",
    endDate: "",
    search: "",
  })
  const [selectedMissionId, setSelectedMissionId] = useState("")
  const [createSuccessCount, setCreateSuccessCount] = useState(0)

  const queryClient = useQueryClient()
  const deferredMissionSearch = useDeferredValue(filters.search)

  const dronesQuery = useQuery({
    queryKey: ["drones", "missions-page"],
    queryFn: () => fetchDrones(),
  })

  const missionsQuery = useQuery({
    queryKey: [
      "missions",
      filters.status,
      filters.droneId,
      filters.startDate,
      filters.endDate,
      deferredMissionSearch.trim(),
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchMissions({
        status: filters.status || undefined,
        droneId: filters.droneId || undefined,
        startDate: filters.startDate
          ? localDateToStartOfDayIso(filters.startDate)
          : undefined,
        endDate: filters.endDate
          ? localDateToEndOfDayIso(filters.endDate)
          : undefined,
        search: deferredMissionSearch.trim() || undefined,
        sortBy,
        sortOrder,
      }),
    placeholderData: keepPreviousData,
  })

  const drones = dronesQuery.data?.data ?? []
  const missions = missionsQuery.data?.data ?? []
  const totalMissions = missionsQuery.data?.meta.total ?? 0

  const activeMissionId = missions.some((m) => m.id === selectedMissionId)
    ? selectedMissionId
    : (missions[0]?.id ?? "")
  
  const selectedMission = missions.find((m) => m.id === activeMissionId)
  
  const assignableDrones = drones.filter(
    (d) => d.status === "AVAILABLE" || d.id === selectedMission?.droneId,
  )

  const createMissionMutation = useMutation({
    mutationFn: (payload: CreateMissionPayload) => createMission(payload),
    onSuccess: async (mission) => {
      setCreateSuccessCount((c) => c + 1)
      notify({
        tone: "success",
        title: "Mission Scheduled",
        description: `"${mission.name}" is now on the operational board.`,
      })
      setSelectedMissionId(mission.id)
      await invalidateMissionBoardQueries(queryClient)
    },
    onError: (error) => {
      notify({
        tone: "error",
        title: "Scheduling Failed",
        description: getErrorMessage(error),
      })
    },
  })

  const updateMissionMutation = useMutation({
    mutationFn: ({ missionId, payload }: { missionId: string; payload: CreateMissionPayload }) => 
      updateMission(missionId, payload),
    onSuccess: async (mission) => {
      notify({
        tone: "success",
        title: "Plan Refined",
        description: "The mission parameters have been updated.",
      })
      setSelectedMissionId(mission.id)
      await invalidateMissionBoardQueries(queryClient)
    },
    onError: (error) => {
       notify({
        tone: "error",
        title: "Update Failed",
        description: getErrorMessage(error),
      })
    },
  })

  const transitionMutation = useMutation({
    mutationFn: ({ missionId, payload }: { missionId: string; payload: TransitionMissionPayload }) => 
      transitionMission(missionId, payload),
    onSuccess: async () => {
      notify({
        tone: "success",
        title: "Lifecycle Updated",
        description: "Mission has successfully transitioned to the next state.",
      })
      await invalidateMissionBoardQueries(queryClient)
    },
    onError: (error) => {
      notify({
        tone: "error",
        title: "Transition Failed",
        description: getErrorMessage(error),
      })
    },
  })

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-0 h-5 text-[10px] uppercase font-bold tracking-widest bg-primary/5 border-primary/20 text-primary">
              Control Center
            </Badge>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Fleet Operations
            </span>
          </div>
          <h2 className="text-4xl font-black tracking-tight">
            Mission <span className="text-primary italic">Intelligence</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Monitor, schedule, and orchestrate complex drone operations. This command center ensures 
            safety compliance through strictly enforced lifecycle state machines.
          </p>
        </div>
        
        <div className="flex items-center gap-8 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
          <div className="space-y-1">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Active Missions</div>
             <div className="text-3xl font-black tracking-tighter text-right">{totalMissions}</div>
          </div>
          <div className="h-10 w-px bg-border/40 hidden md:block" />
          <div className="space-y-1">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">System Health</div>
             <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-sm font-bold">Operational</span>
             </div>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="relative">
        <MissionFilters
          drones={drones}
          droneId={filters.droneId}
          endDate={filters.endDate}
          search={filters.search}
          startDate={filters.startDate}
          status={filters.status}
          onChange={(nextFilters) =>
            setFilters((currentState) => ({
              ...currentState,
              ...nextFilters,
            }))
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scheduling */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="glass relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Rocket className="h-32 w-32 rotate-12" />
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                </div>
                <CardTitle className="text-lg">Schedule Mission</CardTitle>
              </div>
              <CardDescription>
                {allowMissionEdits 
                  ? "Only 'Available' drones appear in deployment rosters."
                  : "Read-only access: Operational changes restricted to Flight Ops."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allowMissionEdits ? (
                <MissionComposerForm
                  key={createSuccessCount}
                  drones={drones}
                  feedback={null}
                  isPending={createMissionMutation.isPending}
                  onSubmit={(payload) => createMissionMutation.mutate(payload)}
                />
              ) : (
                <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Privileged Operation</AlertTitle>
                  <AlertDescription className="text-[11px] opacity-80">
                    Your current permissions allow for lifecycle monitoring only. Scheduling is 
                    restricted to Pilots and System Managers.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mission Lifecycle */}
        <div className="lg:col-span-7 space-y-6">
          <SelectedMissionPanel mission={selectedMission}>
            {allowMissionEdits ? (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {selectedMission?.status === "PLANNED" ? (
                    <motion.div
                      key="plan-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <MissionPlanForm
                        key={`${selectedMission.id}-${selectedMission.plannedStart}`}
                        drones={assignableDrones}
                        isPending={updateMissionMutation.isPending}
                        mission={selectedMission}
                        onSubmit={(payload) =>
                          updateMissionMutation.mutate({
                            missionId: selectedMission.id,
                            payload,
                          })
                        }
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="locked-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-xl border border-warning/20 bg-warning/5 text-warning flex items-center gap-3"
                    >
                      <Settings2 className="h-5 w-5 opacity-40" />
                      <p className="text-[11px] font-medium leading-tight">
                        Direct parameter editing is locked. Mission has bypassed the initial 
                        planning gate and is now in operational transit.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedMission && (
                  <div className="pt-2">
                    <MissionTransitionForm
                      key={`${selectedMission.id}-${selectedMission.status}`}
                      isPending={transitionMutation.isPending}
                      mission={selectedMission}
                      onSubmit={(payload) =>
                        transitionMutation.mutate({
                          missionId: selectedMission.id,
                          payload,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                 <ShieldAlert className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                 <p className="text-sm font-medium text-muted-foreground max-w-[200px] mx-auto">
                   Operational controls are locked for your role tier.
                 </p>
              </div>
            )}
          </SelectedMissionPanel>
        </div>
      </div>

      {/* Bottom Section: Operations Timeline */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="space-y-1">
             <h3 className="text-xl font-bold flex items-center gap-2">
               <LayoutGrid className="h-5 w-5 text-primary" />
               Operations Timeline
             </h3>
             <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
               Flight Logs & Real-time Deployment State
             </p>
           </div>
           
           <div className="flex items-center gap-2">
              {missionsQuery.isFetching && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Syncing</span>
                </div>
              )}
           </div>
        </div>

        <Card className="glass overflow-hidden border-none shadow-2xl">
          <MissionTimelineTable
            isBackgroundFetching={missionsQuery.isFetching}
            isLoading={missionsQuery.isPending && !missionsQuery.data}
            missions={missions}
            selectedMissionId={activeMissionId}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSelect={setSelectedMissionId}
            onSortChange={(field: MissionListSortField) => {
              const nextParams = new URLSearchParams(searchParams)
              if (sortBy === field) {
                nextParams.set("order", missionSortOrderToParam(sortOrder === "ASC" ? "DESC" : "ASC"))
              } else {
                nextParams.set("sort", field)
                nextParams.set("order", "asc")
              }
              setSearchParams(nextParams, { replace: true, preventScrollReset: true })
            }}
          />
        </Card>
      </section>

      {/* Global Query Errors */}
      <AnimatePresence>
        {(dronesQuery.isError || missionsQuery.isError) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <Alert variant="destructive" className="shadow-2xl glass border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>System Link Interrupted</AlertTitle>
              <AlertDescription className="text-xs italic">
                {getErrorMessage(dronesQuery.error ?? missionsQuery.error)}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
