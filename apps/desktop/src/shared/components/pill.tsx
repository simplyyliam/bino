interface PillProps {
  storeName: string
}

export const Pill = ({ storeName }: PillProps) => {
  return (
    <div className="flex items-center justify-center px-3 py-1.5 bg-muted rounded-[5px]">
      <h6>{storeName}</h6>
    </div>
  )
}
