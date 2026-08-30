import { RouterProvider } from "react-router-dom";
import { Router } from "./Router";
import { ThemeProvider } from "./theme/theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={Router}/>
    </ThemeProvider>
  )
}