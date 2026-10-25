import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@bino/ui";
import { EmptyState } from "./EmptyState";

// Shown instead of a blank page if something throws while rendering.
export default function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined;

  if (error) console.error(error);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-card">
        <EmptyState
          icon={TriangleAlertIcon}
          title="Something went wrong"
          description={
            <>
              This screen hit an error. Your data is safe. Try again, or head back to the overview.
              {detail && <span className="mt-3 block font-mono text-xs break-words">{detail}</span>}
            </>
          }
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button onClick={() => window.location.assign("/")}>Go to Overview</Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
