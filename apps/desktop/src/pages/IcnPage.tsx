import { useParams, useNavigate } from "react-router-dom";
import { useItemStore, useBinStore } from "@bino/store";
import { Button, Badge } from "@bino/ui";
import { ArrowLeft01Icon, Package02Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DynamicIcon } from "lucide-react/dynamic";
import { isValidIconName } from "@/lib/icons";
import { Package } from "lucide-react";

export default function ICNPage() {
  const { icnValue } = useParams<{ icnValue: string }>();
  const navigate = useNavigate();

  const getICNByValue = useItemStore((s) => s.getICNByValue);
  const getItem = useItemStore((s) => s.getItem);
  const findICNLocation = useItemStore((s) => s.findICNLocation);
  const bins = useBinStore((s) => s.bins);

  const icn = icnValue ? getICNByValue(decodeURIComponent(icnValue)) : undefined;
  const item = icn ? getItem(icn.itemId) : undefined;
  const location = icn ? findICNLocation(icn.value) : undefined;
  const bin = location ? bins.find((b) => b.id === location.binId) : undefined;

  if (!icn || !item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <HugeiconsIcon icon={Package02Icon} size={48} strokeWidth={1.5} className="text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">ICN Not Found</h1>
          <p className="text-muted-foreground">
            The ICN "{icnValue}" could not be found in the system.
          </p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.67} />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 -ml-3"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.67} />
          Back
        </Button>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center gap-6 mb-12 p-12 rounded-3xl bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5 border border-border/50 backdrop-blur-sm">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-xl border border-primary/20">
            {bin?.icon && isValidIconName(bin.icon) ? (
              <DynamicIcon name={bin.icon} strokeWidth={1.5} className="w-16 h-16 text-primary" />
            ) : (
              <Package className="w-16 h-16 text-primary" strokeWidth={1.5} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {icn.value}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              {item.name}
            </p>
          </div>

          {location && (
            <Badge variant="outline" className="text-base px-4 py-2 rounded-full">
              {location.quantity} in stock
            </Badge>
          )}
        </div>

        {/* Item Details Card */}
        <div className="grid gap-6 mb-8">
          <div className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Item Details
            </h2>
            <div className="grid gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-2xl font-semibold">{item.name}</span>
              </div>

              {item.description && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="text-lg">{item.description}</span>
                </div>
              )}

              {item.category && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="secondary" className="w-fit text-sm px-3 py-1">
                    {item.category}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* ICN Metadata Card */}
          {icn.metadata && Object.keys(icn.metadata).length > 0 && (
            <div className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
                ICN Metadata
              </h2>
              <div className="grid gap-4">
                {icn.metadata.manufacturer && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span className="font-medium">{icn.metadata.manufacturer}</span>
                  </div>
                )}
                {icn.metadata.partNumber && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Part Number</span>
                    <span className="font-mono text-sm font-medium">{icn.metadata.partNumber}</span>
                  </div>
                )}
                {icn.metadata.serialNumber && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Serial Number</span>
                    <span className="font-mono text-sm font-medium">{icn.metadata.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(icn.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Location Card */}
          {location && bin && (
            <div className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <HugeiconsIcon icon={Location01Icon} size={24} strokeWidth={1.67} className="text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Current Location
                </h2>
              </div>
              <div className="grid gap-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Bin</span>
                  <span className="font-medium">{bin.name || bin.locationCode}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Location Code</span>
                  <span className="font-mono text-sm font-medium">{bin.locationCode}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-2xl font-bold text-primary">{location.quantity}</span>
                </div>
              </div>
            </div>
          )}

          {!location && (
            <div className="p-8 rounded-2xl border border-dashed border-border bg-muted/20">
              <div className="flex flex-col items-center gap-3 text-center">
                <HugeiconsIcon icon={Location01Icon} size={32} strokeWidth={1.5} className="text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  This ICN is not currently assigned to any bin location.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
