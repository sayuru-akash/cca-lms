"use client";

import {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  requireTypedConfirmation?: string; // If set, user must type this text to confirm
  details?: string[]; // List of additional info to display
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typedText, setTypedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resolveRef, setResolveRef] = useState<
    ((value: boolean) => void) | null
  >(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setTypedText("");
      setIsOpen(true);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsLoading(true);
    setIsOpen(false);
    resolveRef?.(true);
    setIsLoading(false);
    setResolveRef(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef?.(false);
    setResolveRef(null);
  };

  const canConfirm = options?.requireTypedConfirmation
    ? typedText === options.requireTypedConfirmation
    : true;

  const variantStyles = {
    danger: {
      icon: "text-red-500",
      button: "bg-red-600 hover:bg-red-700 text-white",
      border: "border-red-500/20",
      bg: "bg-red-500/10",
    },
    warning: {
      icon: "text-yellow-500",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
      border: "border-yellow-500/20",
      bg: "bg-yellow-500/10",
    },
    default: {
      icon: "text-terminal-accent",
      button: "bg-terminal-accent hover:bg-terminal-accent/80 text-white",
      border: "border-terminal-border",
      bg: "bg-terminal-darker",
    },
  };

  const styles = options?.variant
    ? variantStyles[options.variant]
    : variantStyles.default;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${styles.bg}`}>
                {options?.variant === "danger" ? (
                  <Trash2 className={`h-6 w-6 ${styles.icon}`} />
                ) : (
                  <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">{options?.title}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="pt-3 text-sm">
              {options?.description}
            </DialogDescription>
          </DialogHeader>

          {/* Details Section */}
          {options?.details && options.details.length > 0 && (
            <div
              className={`p-3 rounded-md border ${styles.border} ${styles.bg} space-y-1.5`}
            >
              {options.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-terminal-text-muted shrink-0">•</span>
                  <span className="text-terminal-text">{detail}</span>
                </div>
              ))}
            </div>
          )}

          {/* Typed Confirmation */}
          {options?.requireTypedConfirmation && (
            <div className="space-y-2">
              <Label className="text-sm">
                Type{" "}
                <span className="font-mono font-bold text-red-400">
                  {options.requireTypedConfirmation}
                </span>{" "}
                to confirm:
              </Label>
              <Input
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={options.requireTypedConfirmation}
                className="font-mono"
                autoFocus
              />
            </div>
          )}

          {/* Warning for dangerous actions */}
          {options?.variant === "danger" && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This action cannot be undone. All related data will be
                permanently deleted.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {options?.cancelText || "Cancel"}
            </Button>
            <Button
              className={styles.button}
              onClick={handleConfirm}
              disabled={!canConfirm || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : options?.variant === "danger" ? (
                <Trash2 className="h-4 w-4 mr-2" />
              ) : null}
              {options?.confirmText || "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
