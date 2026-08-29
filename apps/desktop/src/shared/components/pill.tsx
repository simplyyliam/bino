interface PillProps {
  storeName: string
}

export const Pill = ({ storeName }: PillProps) => {
  return (
    <div className="flex items-center justify-center px-3 py-1.5 bg-muted border rounded-md">
      <h6 className="text-xs">{storeName}</h6>
    </div>
  )
}
