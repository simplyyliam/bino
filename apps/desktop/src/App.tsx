import { RouterProvider } from "react-router-dom";
import { Router } from "./Router";
import { ThemeProvider } from "./theme/theme-provider";
import { TooltipProvider } from "@bino/ui";

export default function App() {
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
