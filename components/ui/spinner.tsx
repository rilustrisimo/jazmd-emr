import { Loader2 } from 'lucide-react'
import { cn } from 'cn'

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2>) {
  return <Loader2 className={cn('size-4 animate-spin', className)} {...props} />
}

function PageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="size-6 text-primary" />
    </div>
  )
}

export { Spinner, PageSpinner }
