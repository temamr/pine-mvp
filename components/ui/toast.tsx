"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (message: Omit<ToastMessage, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToasterProvider");
  }

  return context;
}

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((message: Omit<ToastMessage, "id">) => {
    setMessages((current) => [
      ...current,
      { ...message, id: crypto.randomUUID() }
    ]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border bg-white p-4 shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out"
            onOpenChange={(open) => {
              if (!open) {
                setMessages((current) => current.filter((item) => item.id !== message.id));
              }
            }}
          >
            <div>
              <ToastPrimitive.Title className="text-sm font-semibold">{message.title}</ToastPrimitive.Title>
              {message.description ? (
                <ToastPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {message.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport
          className={cn(
            "fixed bottom-20 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none",
            "md:bottom-4"
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
