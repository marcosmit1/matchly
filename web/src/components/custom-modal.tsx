"use client";

import { useEffect } from "react";
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "success" | "error" | "warning" | "info" | "confirm";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCloseButton?: boolean;
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      case "confirm":
        return <AlertTriangle className="w-8 h-8 text-blue-400" />;
      default:
        return <Info className="w-8 h-8 text-blue-400" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case "success":
        return "Success!";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      case "confirm":
        return "Confirm Action";
      default:
        return "Information";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 rounded-3xl"></div>
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                {getIcon()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{getTitle()}</h3>
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
            )}
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-white/80 text-base leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {type === "confirm" ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-white/30 text-white/80 rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur-md font-medium"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={handleConfirm}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
