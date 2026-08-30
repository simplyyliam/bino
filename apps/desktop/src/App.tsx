import { RouterProvider } from "react-router-dom";
import { Router } from "./Router";
import { ThemeProvider } from "./theme/theme-provider";
import { useInitializeStores } from "./hooks/useInitializeStores";

export default function App() {
  useInitializeStores()

  return (
    <ThemeProvider>
      <RouterProvider router={Router}/>
    </ThemeProvider>
  )
}