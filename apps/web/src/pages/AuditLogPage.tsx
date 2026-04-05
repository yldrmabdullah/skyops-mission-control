import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Info, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { fetchAuditEvents, getErrorMessage } from '../lib/api';
import { formatEnumLabel } from '../lib/format';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Input } from '../components/ui/input';

const PAGE_SIZE = 25;

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const auditQuery = useQuery({
    queryKey: ['audit-events', page],
    queryFn: () => fetchAuditEvents(page, PAGE_SIZE),
  });

  const isLoading = auditQuery.isLoading;
  const isError = auditQuery.isError;
  const payload = auditQuery.data;
  const rows = payload?.data ?? [];
  const meta = payload?.meta;

  if (isError) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle size={48} />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Log Interrupted</h1>
          <p className="text-muted-foreground italic">
            {getErrorMessage(auditQuery.error)}
          </p>
        </div>
        
        <div className="flex gap-4 mt-8">
          <Button onClick={() => auditQuery.refetch()} variant="default" className="shadow-lg">
            Retry Connection
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline" className="glass">
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-0 h-5 text-[10px] uppercase font-bold tracking-widest bg-primary/5 border-primary/20 text-primary">
              Security & Compliance
            </Badge>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Audit Trails
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             System <span className="text-primary italic">Ledger</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            A cryptographically verified trail of every significant state change and user action 
            within the SkyOps ecosystem. Ensuring 100% operational transparency.
          </p>
        </div>
        
        <div className="flex items-center gap-8 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
          <div className="space-y-1">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Total Events</div>
             <div className="text-3xl font-black tracking-tighter text-right">{meta?.total ?? 0}</div>
          </div>
          <div className="h-10 w-px bg-border/40 hidden md:block" />
          <div className="space-y-1">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Compliance Status</div>
             <div className="flex items-center gap-2 text-emerald-500">
               <ShieldCheck size={16} />
               <span className="text-sm font-bold">Verified</span>
             </div>
          </div>
        </div>
      </header>

      <Alert className="glass bg-primary/[0.03] border-primary/10 shadow-sm">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs font-black uppercase tracking-widest text-primary mb-1">Log Visibility Policy</AlertTitle>
        <AlertDescription className="text-[11px] text-muted-foreground leading-normal">
          Managers have full visibility over the entire fleet ledger. Pilots and Technicians see a filtered 
          history of actions relevant to their assigned assets and missions.
        </AlertDescription>
      </Alert>

      <Card className="glass border-primary/10 shadow-2xl overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <History size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Operational Logs</CardTitle>
                <CardDescription className="text-[10px] font-medium uppercase tracking-tighter">
                  Real-time activity stream
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search ledger..." 
                    className="h-9 w-full sm:w-[200px] pl-9 bg-background/50 border-border/50 text-xs focus-visible:ring-primary/20"
                    disabled
                  />
               </div>
               <Button variant="outline" size="icon" className="h-9 w-9 glass border-border/50" disabled>
                 <Filter size={14} />
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-tight pl-6">Timestamp</TableHead>
                    <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-tight">Operation</TableHead>
                    <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-tight">Subject</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-tight">Reference ID</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-tight pr-6">Metadata Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="border-border/20">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j} className={j === 0 ? "pl-6" : j === 4 ? "pr-6" : ""}>
                            <Skeleton className="h-5 w-full bg-primary/5 rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                           <FileText className="h-10 w-10" />
                           <p className="text-sm font-bold uppercase tracking-widest">No Events Found</p>
                           <p className="text-xs">Start performing operations to populate the ledger.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-primary/[0.02] transition-colors border-border/20 group">
                        <TableCell className="font-mono text-[10px] text-muted-foreground pl-6 whitespace-nowrap">
                          {format(new Date(row.createdAt), 'dd MMM yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="text-[9px] font-black tracking-tighter px-2 py-0 h-5 bg-background/50 border-border group-hover:border-primary/30 transition-colors"
                          >
                            {row.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold text-foreground">
                            {formatEnumLabel(row.entityType)}
                          </span>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-mono">
                          {row.entityId.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="flex justify-end">
                            <code className="text-[9px] bg-muted/30 px-2 py-1 rounded max-w-[240px] truncate text-muted-foreground border border-border/20 font-mono">
                              {row.metadata && Object.keys(row.metadata).length
                                ? JSON.stringify(row.metadata)
                                : '—'}
                            </code>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {meta && meta.totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-xl border border-primary/10 shadow-lg"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Page <span className="text-primary">{meta.page}</span> of <span className="text-foreground">{meta.totalPages}</span>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30 mx-1" />
            Events <span className="text-foreground">{(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, meta.total)}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 glass px-4 text-xs font-bold gap-2"
            >
              <ChevronLeft size={14} />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => {
                setPage(p => Math.min(meta.totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 glass px-4 text-xs font-bold gap-2"
            >
              Next
              <ChevronRight size={14} />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
