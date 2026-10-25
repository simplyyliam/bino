import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Router } from "./Router";
import { ThemeProvider, useTheme } from "./theme/theme-provider";
import { Toaster, TooltipProvider } from "@bino/ui";
import { useAppStore } from "@bino/store";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} />;
}

export default function App() {
  useEffect(() => {
    void useAppStore.getState().load();
  }, []);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={Router} />
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
