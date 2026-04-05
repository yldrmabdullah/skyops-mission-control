import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  ClipboardList,
  History,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/use-auth';
import { roleTitle } from '../lib/role-descriptions';
import { showMissionControlNav } from '../lib/roles';
import type { OperatorRole } from '../types/api';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ModeToggle } from './ModeToggle';
import { cn } from '@/lib/utils';

function navigationForRole(role: OperatorRole | undefined) {
  const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/drones', label: 'Drone Registry', icon: Plane },
  ];
  if (showMissionControlNav(role)) {
    items.push({
      to: '/missions',
      label: 'Mission Control',
      icon: ClipboardList,
    });
  }
  items.push(
    { to: '/analytics', label: 'Fleet Analytics', icon: BarChart3 },
    { to: '/audit', label: 'Audit Log', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  );
  return items;
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigationItems = navigationForRole(user?.role);
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '80px' },
  };

  const NavItem = ({ item, isCollapsed = false }: { item: typeof navigationItems[0], isCollapsed?: boolean }) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md" 
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )
      }
    >
      <item.icon className={cn("shrink-0 transition-transform duration-200 group-hover:scale-110", isCollapsed ? "mx-auto" : "")} size={20} />
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-medium whitespace-nowrap"
        >
          {item.label}
        </motion.span>
      )}
      {isCollapsed && (
        <div className="absolute left-[100%] ml-4 px-2 py-1 bg-popover text-popover-foreground rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border z-[60]">
          {item.label}
        </div>
      )}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className={cn(
          "hidden lg:flex flex-col border-r bg-card fixed inset-y-0 z-50 transition-all duration-300 ease-in-out shadow-xl overflow-hidden",
          isSidebarCollapsed ? "items-center" : ""
        )}
      >
        <div className="p-6 flex items-center justify-between border-b w-full h-16">
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2"
            >
              <Plane size={24} className="text-primary" />
              <span>SkyOps</span>
            </motion.div>
          )}
          {isSidebarCollapsed && (
             <Plane size={24} className="text-primary mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hover:bg-accent absolute -right-3 top-16 h-6 w-6 rounded-full border bg-background shadow-sm"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        </div>

        <ScrollArea className="flex-1 w-full px-3 py-6">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavItem key={item.to} item={item} isCollapsed={isSidebarCollapsed} />
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t w-full space-y-4">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-accent/30 glass">
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs uppercase">
                  {user?.fullName?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-semibold truncate leading-none mb-1">{user?.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{roleTitle(user?.role)}</p>
              </div>
            </div>
          )}
          
          <div className={cn("flex items-center justify-between gap-1", isSidebarCollapsed ? "flex-col" : "")}>
            <ModeToggle />
            {!isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium h-9"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </Button>
            )}
            {isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
              >
                <LogOut size={18} />
              </Button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden flex h-16 w-full items-center justify-between px-4 border-b fixed top-0 z-50 bg-background/80 backdrop-blur-md glass">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          <Plane size={20} className="text-primary" />
          <span>SkyOps</span>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col glass border-r-0">
              <div className="p-6 border-b h-16 flex items-center">
                <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
                  <Plane size={24} className="text-primary" />
                  <span>SkyOps</span>
                </div>
              </div>
              <ScrollArea className="flex-1 px-3 py-6">
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </nav>
              </ScrollArea>
              <div className="p-4 border-t space-y-4">
                <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-accent/30 glass">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user?.fullName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{roleTitle(user?.role)}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => signOut()}>
                  <LogOut size={16} className="mr-2" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        "lg:pl-[280px]",
        isSidebarCollapsed && "lg:pl-[80px]",
        "pt-16 lg:pt-0"
      )}>
        <div className="flex-1 p-4 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
