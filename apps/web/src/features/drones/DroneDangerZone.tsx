import { AlertCircle, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Feedback {
  tone: "success" | "error"
  message: string
}

interface DroneDangerZoneProps {
  canDelete: boolean
  feedback: Feedback | null
  isDeleteArmed: boolean
  isPending: boolean
  onDelete: () => void
}

export function DroneDangerZone({
  canDelete,
  feedback,
  isDeleteArmed,
  isPending,
  onDelete,
}: DroneDangerZoneProps) {
  return (
    <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <CardTitle>Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Critical actions for this asset. These operations are irreversible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canDelete ? (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Deletion Restricted</AlertTitle>
            <AlertDescription>
              This drone cannot be deleted because it has an existing operational history (missions or maintenance logs). 
              History must stay auditable for regulatory compliance.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete is permanently disabled once the asset participates in a mission or receives a maintenance log.
              Drones with no history can be removed from the registry.
            </p>

            {feedback && (
              <Alert variant={feedback.tone === "error" ? "destructive" : "default"}>
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant={isDeleteArmed ? "destructive" : "outline"}
                className={isDeleteArmed ? "animate-pulse" : "border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"}
                disabled={isPending}
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isPending
                  ? "Deleting Asset..."
                  : isDeleteArmed
                  ? "Confirm Permanent Deletion"
                  : "Delete Drone"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
