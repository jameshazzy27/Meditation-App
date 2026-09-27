import { Flame, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { BackLink } from '@/components/BackLink'
import { EntryCard, Note } from '@/components/EntryCard'
import { MoodScale } from '@/components/MoodScale'
import { ScreenHeader } from '@/components/ScreenHeader'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { entryKinds, type EntryKind } from '@/lib/entryTypes'
import { moodLevels, type MoodRating } from '@/lib/mood'
import { cn } from '@/lib/utils'

// A living reference for Aura's look: every colour, text style and card pattern
// in one place. Reached from Settings → Appearance.
export function StylePreviewScreen() {
  const [mood, setMood] = useState<MoodRating>(4)

  return (
    <>
      <BackLink to="/settings" label="Settings" />
      <ScreenHeader title="Style" subtitle="Aura's look, all in one place" rune="ᚨ" />

      <div className="space-y-10">
        <Section title="Appearance">
          <ThemeToggle />
        </Section>

        <Section title="Colours">
          <div className="grid grid-cols-4 gap-3">
            <Swatch name="Background" className="bg-background" />
            <Swatch name="Card" className="bg-card" />
            <Swatch name="Muted" className="bg-muted" />
            <Swatch name="Accent" className="bg-accent" />
            <Swatch name="Primary" className="bg-primary" />
            <Swatch name="Text" className="bg-foreground" />
            <Swatch name="Subtle text" className="bg-muted-foreground" />
            <Swatch name="Danger" className="bg-destructive" />
          </div>
          <Label>Entry types</Label>
          <div className="grid grid-cols-4 gap-3">
            {(Object.keys(entryKinds) as EntryKind[]).map((kind) => (
              <Swatch key={kind} name={entryKinds[kind].label} className={entryKinds[kind].bar} />
            ))}
          </div>
          <Label>Mood scale</Label>
          <div className="flex h-10 overflow-hidden rounded-xl">
            {([1, 2, 3, 4, 5] as MoodRating[]).map((r) => (
              <div key={r} className={cn('flex-1', moodLevels[r].bg)} />
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-3">
            <p className="font-display text-4xl font-medium tracking-tight">Still as the fjord</p>
            <p className="font-display text-2xl font-medium">Section heading</p>
            <p className="text-base font-semibold">Card title</p>
            <p className="text-base leading-relaxed">
              Body text is Alegreya Sans — warm and a little hand-made, with roots in calligraphy. Headings use
              Cinzel, carved capitals like an inscription on stone. Runes mark each screen.
            </p>
            <p className="text-sm text-muted-foreground">Supporting text for descriptions and hints.</p>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Small label</p>
            <p className="font-display text-5xl font-medium tabular-nums">
              5:24<span className="ml-1 font-sans text-base text-muted-foreground">/km</span>
            </p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-2">
            <Button>Save entry</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="outline">Edit</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="destructive">Delete</Button>
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
          </div>
        </Section>

        <Section title="Mood picker">
          <MoodScale value={mood} onChange={setMood} />
          <div className="flex flex-wrap gap-2">
            {['sleep', 'work', 'family', 'exercise'].map((tag, i) => (
              <Badge key={tag} variant={i < 2 ? 'default' : 'outline'} className="px-3 py-1 text-sm">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="border-dashed px-3 py-1 text-sm text-muted-foreground">
              <Plus /> tag
            </Badge>
          </div>
        </Section>

        <Section title="Cards">
          <Card>
            <CardHeader>
              <CardDescription>This week</CardDescription>
              <div className="flex items-end justify-between">
                <p className="font-display text-4xl font-medium">
                  18.4<span className="ml-1 font-sans text-base text-muted-foreground">km</span>
                </p>
                <span className="flex items-center gap-1 rounded-full bg-kettlebell/15 px-2.5 py-1 text-sm font-medium text-kettlebell">
                  <Flame className="size-4" /> 5 day streak
                </span>
              </div>
            </CardHeader>
          </Card>

          <EntryCard kind="mood" title="Good" meta="08:12">
            <div className="flex gap-1.5">
              <Badge variant="secondary">sleep</Badge>
              <Badge variant="secondary">exercise</Badge>
            </div>
          </EntryCard>
          <EntryCard kind="run" title="Long run" meta="12.1 km · 1:05:20 · 5:24/km">
            <Note>Easy pace along the river, legs felt fresh.</Note>
          </EntryCard>
          <EntryCard kind="kettlebell" title="Complex A" meta="24 kg · 7 rounds · 20 min">
            <p className="text-sm text-muted-foreground">Swing · Clean · Press · Front squat</p>
          </EntryCard>
          <EntryCard kind="meditation" title="Meditation" meta="15 min · avg 58 bpm">
            <Note>Heart rate dropped 9 bpm.</Note>
          </EntryCard>

          <Card className="border-dashed bg-transparent shadow-none">
            <CardHeader className="text-center">
              <CardTitle>Nothing logged yet</CardTitle>
              <CardDescription>Empty states use a dashed outline.</CardDescription>
            </CardHeader>
          </Card>
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-medium">{title}</h2>
      {children}
    </section>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="pt-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">{children}</p>
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1.5">
      <div className={cn('aspect-square rounded-xl border', className)} />
      <p className="text-xs leading-tight text-muted-foreground">{name}</p>
    </div>
  )
}
