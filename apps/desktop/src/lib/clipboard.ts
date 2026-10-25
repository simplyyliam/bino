import { toast } from "@bino/ui";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`Copied ${text}`);
  } catch {
    toast.error("Couldn't copy. Your browser blocked the clipboard.");
  }
}
