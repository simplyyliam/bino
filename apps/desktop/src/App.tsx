import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Router } from "./Router";
import { ThemeProvider } from "./theme/theme-provider";
import { TooltipProvider } from "@bino/ui";
import { useAppStore } from "@bino/store";

export default function App() {
  useEffect(() => {
    void useAppStore.getState().load();
  }, []);

  return (
    <ThemeProvider>
      <div className="typeset typeset-docs">
        <TooltipProvider>
          <RouterProvider router={Router} />
        </TooltipProvider>
      </div>
    </ThemeProvider>
  )
}
