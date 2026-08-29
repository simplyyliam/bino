import { IconButton } from "@/shared/components";
import { Field, FieldGroup } from "@bino/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@bino/ui/components/ui/dialog"
import { Config} from "@hugeicons/core-free-icons";
import { ConfigSetting } from "./config-setting";

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigMenu = ({ open, onOpenChange }: MenuProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<IconButton Icon={Config} />} />
      <DialogContent className="min-w-0 w-60">
        <DialogHeader>
          <DialogTitle>Bin Configuration</DialogTitle>
        </DialogHeader>
        <FieldGroup> 
          <ConfigSetting label="Column"/>
          <ConfigSetting label="Row"/>
          <ConfigSetting label="Bins"/>
          <Field orientation="horizontal">
            <IconButton disabled variant="destructive" stretch Label="confirm changes" />
          </Field>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
