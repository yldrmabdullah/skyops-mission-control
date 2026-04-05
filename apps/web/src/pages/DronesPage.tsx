import { useDeferredValue, useRef, useState } from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useSearchParams, Link } from "react-router-dom"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  LayoutGrid,
  ChevronRight,
  Info
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "../auth/use-auth"
import { Badge } from "@/components/ui/badge"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  DroneRegistryHighlights,
  DroneRegistryToolbar,
  DronesTable,
} from "../features/drones/DroneRegistryPanels"
import { DroneRegistryForm } from "../features/drones/DroneRegistryForm"
import { 
  createDrone, 
  fetchDrones, 
  getErrorMessage 
} from "../lib/api"
import { 
  type DroneListSortField, 
  resolveDroneListSort, 
  sortOrderToParam 
} from "../features/drones/drone-list-sort"
import { canManageFleet } from "../lib/roles"
import type { CreateDronePayload } from "../types/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export function DronesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState("")
  const [createSuccessCount, setCreateSuccessCount] = useState(0)
  const dronesTableAnchorRef = useRef<HTMLDivElement>(null)
  
  const selectedStatus = searchParams.get("status") ?? ""
  const { sortBy, sortOrder } = resolveDroneListSort(searchParams)
  const queryClient = useQueryClient()

  const deferredSearch = useDeferredValue(searchValue)
  const dronesQuery = useQuery({
    queryKey: [
      "drones",
      selectedStatus === "ALL" ? "" : selectedStatus,
      deferredSearch.trim(),
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchDrones(
        (selectedStatus && selectedStatus !== "ALL") ? selectedStatus : undefined,
        deferredSearch.trim() || undefined,
        { sortBy, sortOrder },
      ),
    placeholderData: keepPreviousData,
  })

  const data = dronesQuery.data
  const isLoading = dronesQuery.isPending && !dronesQuery.data
  const isListSyncing = dronesQuery.isFetching && dronesQuery.data !== undefined

  const createDroneMutation = useMutation({
    mutationFn: (payload: CreateDronePayload) => createDrone(payload),
    onSuccess: async () => {
      toast.success("New aircraft registered successfully.")
      setCreateSuccessCount((current) => current + 1)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["drones"] }),
        queryClient.invalidateQueries({ queryKey: ["fleet-health"] }),
      ])
      
      // Scroll to registry after creation
      dronesTableAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const showFleetForm = canManageFleet(user?.role)

  if (dronesQuery.isError) {
    return (
      <div className="p-10 max-w-2xl mx-auto">
        <Alert variant="destructive" className="glass">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Registry Connection Unstable</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            {getErrorMessage(dronesQuery.error)}
          </AlertDescription>
          <div className="mt-6">
            <Link to="/" className="text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              Return to Control Center <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </Alert>
      </div>
    )
  }

  const tableDrones = data?.data ?? []

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 w-fit px-2 py-0.5 rounded">
            <LayoutGrid className="h-3 w-3" />
            Control Center / Asset Management
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter">
              Drone Registry
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg mt-2">
              Fleet inventory with real-time operational status, maintenance deadlines, and full mission history audit trails.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
             <div className="text-4xl font-black text-primary font-mono tracking-tighter">
               {data?.meta.total ?? 0}
             </div>
             <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
               Tracked Aircraft
             </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants}>
          <Card className="glass h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  New Registration
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono tracking-tighter">API_ENFORCED</Badge>
              </div>
              <CardDescription>
                Add a new asset to the fleet registry. Full schema validation is performed during ingestion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showFleetForm ? (
          <DroneRegistryForm
            key={createSuccessCount}
                  feedback={null}
            isPending={createDroneMutation.isPending}
                  onSubmit={(payload) => createDroneMutation.mutate(payload)}
                />
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
                  <ShieldCheck className="h-10 w-10 text-muted-foreground opacity-30" />
                  <div className="space-y-2">
                    <p className="font-bold">Administrative Access Required</p>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      Your role is <strong>{user?.role}</strong>. Asset registration is restricted to workspace managers.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
        <DroneRegistryHighlights total={data?.meta.total ?? 0} />
        </motion.div>
      </section>

      <motion.section variants={itemVariants} className="space-y-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <LayoutGrid className="h-6 w-6 text-primary" />
             Managed Fleet Assets
           </h2>
           <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Live Sync
              </div>
              <div className="flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Updated {format(new Date(), "HH:mm:ss")}
              </div>
           </div>
        </div>

      <DroneRegistryToolbar
        searchValue={searchValue}
        selectedStatus={selectedStatus}
        onSearchChange={setSearchValue}
        onStatusChange={(status) => {
            const nextParams = new URLSearchParams(searchParams)

            if (status && status !== "ALL") {
              nextParams.set("status", status)
          } else {
              nextParams.delete("status")
            }

            setSearchParams(nextParams, {
              replace: true,
              preventScrollReset: true,
            })
          }}
        />

        <div ref={dronesTableAnchorRef} className="relative group">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedStatus}-${sortBy}-${sortOrder}`}
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.995 }}
              transition={{ duration: 0.2 }}
            >
      <DronesTable
                drones={tableDrones}
                isBackgroundFetching={isListSyncing}
        isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
        total={data?.meta.total ?? 0}
                onSortChange={(field: DroneListSortField) => {
                  const nextParams = new URLSearchParams(searchParams)
                  if (sortBy === field) {
                    nextParams.set(
                      "order",
                      sortOrderToParam(sortOrder === "ASC" ? "DESC" : "ASC"),
                    )
                  } else {
                    nextParams.set("sort", field)
                    nextParams.set("order", "asc")
                  }
                  setSearchParams(nextParams, {
                    replace: true,
                    preventScrollReset: true,
                  })
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    </motion.div>
  )
}
