import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ViewMode = "admin" | "test-company";

interface AdminViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAdminView: boolean;
  isTestCompanyView: boolean;
}

const AdminViewContext = createContext<AdminViewContextType>({
  viewMode: "admin",
  setViewMode: () => {},
  isAdminView: true,
  isTestCompanyView: false,
});

export function AdminViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("cchub-admin-view-mode");
    return (saved === "test-company" ? "test-company" : "admin") as ViewMode;
  });

  useEffect(() => {
    localStorage.setItem("cchub-admin-view-mode", viewMode);
  }, [viewMode]);

  return (
    <AdminViewContext.Provider
      value={{
        viewMode,
        setViewMode,
        isAdminView: viewMode === "admin",
        isTestCompanyView: viewMode === "test-company",
      }}
    >
      {children}
    </AdminViewContext.Provider>
  );
}

export function useAdminView() {
  return useContext(AdminViewContext);
}
