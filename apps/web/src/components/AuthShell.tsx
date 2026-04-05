import React from 'react';
import { Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

interface AuthShellProps {
  children: React.ReactNode;
  subtitle: string;
  title: string;
  footer?: React.ReactNode;
}

export function AuthShell({
  children,
  subtitle,
  title,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background patterns/glows */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[450px] z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 glass mb-4">
            <Plane size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">SkyOps</h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] mt-1">Mission Control</p>
        </div>

        <Card className="glass border-primary/10 shadow-2xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed italic">{subtitle}</p>
          </div>
          
          <Separator className="bg-primary/5" />
          
          <div className="space-y-6">
            {children}
          </div>

          {footer && (
            <div className="pt-4 text-center border-t border-primary/5">
              {footer}
            </div>
          )}
        </Card>

        <p className="text-[10px] text-center text-muted-foreground mt-8 uppercase tracking-widest font-bold opacity-50">
          Authorized Personnel Only • Enterprise-Grade Operations
        </p>
      </motion.div>
    </div>
  );
}
