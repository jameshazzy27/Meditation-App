import { Table2, ChartLine } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface TableView {
  columns: string[]
  rows: (string | number)[][]
}

/**
 * A chart with a title, an optional legend, and a Table button that shows
 * the same numbers as a table (so no value is only reachable by hovering).
 */
export function ChartCard({
  title,
  description,
  legend,
  table,
  children,
}: {
  title: string
  description?: string
  legend?: ReactNode
  table: TableView
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <Card className="gap-3">
      <CardHeader className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="-mt-1 -mr-2 text-muted-foreground"
          aria-pressed={showTable}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? <ChartLine /> : <Table2 />}
          {showTable ? 'Chart' : 'Table'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {legend && !showTable && <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">{legend}</div>}
        {showTable ? <DataTable table={table} /> : children}
      </CardContent>
    </Card>
  )
}

function DataTable({ table }: { table: TableView }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted text-left text-muted-foreground">
          <tr>
            {table.columns.map((c, i) => (
              <th key={c} className={i === 0 ? 'px-3 py-2 font-medium' : 'px-3 py-2 text-right font-medium'}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {table.rows.map((row, r) => (
            <tr key={r} className="border-t">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? 'px-3 py-1.5' : 'px-3 py-1.5 text-right'}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {table.rows.length === 0 && (
            <tr>
              <td colSpan={table.columns.length} className="px-3 py-3 text-center text-muted-foreground">
                Nothing in this range
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** A legend entry: a short line or square in the series colour, then the name in normal text. */
export function LegendKey({ color, shape = 'line', children }: { color: string; shape?: 'line' | 'square'; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={shape === 'line' ? 'h-0.5 w-4 rounded-full' : 'size-2.5 rounded-[3px]'}
        style={{ background: color }}
      />
      {children}
    </span>
  )
}
