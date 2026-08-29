import { IconButton } from "@/shared/components";
import { Button, Field, FieldDescription, FieldGroup, Input, Label } from "@bino/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@bino/ui/components/ui/dialog"
import { Config } from "@hugeicons/core-free-icons";

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigMenu = ({ open, onOpenChange }: MenuProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<IconButton Icon={Config} />} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            Configure your desired bin grid layout by adjusting the values below.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field className="flex justify-between">
            <Label htmlFor="row">Row</Label>
            <Input id="row" type="number" />
          </Field>
          <Field className="flex justify-between">
            <Label htmlFor="column">Column</Label>
            <FieldDescription>Columns are created automatically, or add a custom value</FieldDescription>
            <Input id="column" type="number" />
          </Field>
          <Field className="flex justify-between">
            <Label htmlFor="column">Column</Label>
            <FieldDescription>Columns are created automatically, or add a custom value</FieldDescription>
            <Input id="column" type="number" />
          </Field>
          <Field className="flex justify-between">
            <Label htmlFor="column">Bins</Label>
            <FieldDescription>Add more bins to your grid</FieldDescription>
            <Input id="column" type="number" />
          </Field>
          <Field orientation="horizontal">
            <IconButton variant="default" stretch Label="submit"/>
          </Field>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}
