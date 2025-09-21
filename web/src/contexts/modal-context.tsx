"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CustomModal, ModalProps } from "@/components/custom-modal";

interface ModalContextType {
  showModal: (props: Omit<ModalProps, "isOpen" | "onClose">) => void;
  hideModal: () => void;
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => Promise<void>;
  showError: (message: string, title?: string) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalProps, setModalProps] = useState<ModalProps>({
    isOpen: false,
    onClose: () => {},
    message: "",
  });

  const showModal = (props: Omit<ModalProps, "isOpen" | "onClose">) => {
    setModalProps({
      ...props,
      isOpen: true,
      onClose: hideModal,
    });
  };

  const hideModal = () => {
    setModalProps(prev => ({ ...prev, isOpen: false }));
  };

  const showAlert = (message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: "info",
        confirmText: "OK",
        onConfirm: () => resolve(),
      });
    });
  };

  const showConfirm = (message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: "confirm",
        confirmText: "OK",
        cancelText: "Cancel",
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  const showSuccess = (message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: "success",
        confirmText: "OK",
        onConfirm: () => resolve(),
      });
    });
  };

  const showError = (message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: "error",
        confirmText: "OK",
        onConfirm: () => resolve(),
      });
    });
  };

  return (
    <ModalContext.Provider
      value={{
        showModal,
        hideModal,
        showAlert,
        showConfirm,
        showSuccess,
        showError,
      }}
    >
      {children}
      <CustomModal {...modalProps} />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
