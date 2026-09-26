import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2 text-muted-foreground">
      <Link to={to}>
        <ArrowLeft /> {label}
      </Link>
    </Button>
  )
}
