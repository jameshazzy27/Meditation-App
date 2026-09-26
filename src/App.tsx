import { Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/AppShell'
import { ComplexLibraryScreen } from '@/screens/ComplexLibraryScreen'
import { ComplexesScreen } from '@/screens/ComplexesScreen'
import { ComplexFormScreen } from '@/screens/ComplexFormScreen'
import { DayScreen } from '@/screens/DayScreen'
import { HistoryScreen } from '@/screens/HistoryScreen'
import { KettlebellLogScreen } from '@/screens/KettlebellLogScreen'
import { LogScreen } from '@/screens/LogScreen'
import { MeditationEditScreen } from '@/screens/MeditationEditScreen'
import { MoodLogScreen } from '@/screens/MoodLogScreen'
import { RunLogScreen } from '@/screens/RunLogScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { StylePreviewScreen } from '@/screens/StylePreviewScreen'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DayScreen />} />
        <Route path="day/:date" element={<DayScreen />} />
        <Route path="history" element={<HistoryScreen />} />
        <Route path="log" element={<LogScreen />} />
        <Route path="log/kettlebell" element={<KettlebellLogScreen />} />
        <Route path="log/mood" element={<MoodLogScreen />} />
        <Route path="log/mood/:id" element={<MoodLogScreen />} />
        <Route path="log/run" element={<RunLogScreen />} />
        <Route path="log/run/:id" element={<RunLogScreen />} />
        <Route path="log/kettlebell/:id" element={<KettlebellLogScreen />} />
        <Route path="meditation/:id" element={<MeditationEditScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="settings/style" element={<StylePreviewScreen />} />
        <Route path="settings/complexes" element={<ComplexesScreen />} />
        <Route path="settings/complexes/library" element={<ComplexLibraryScreen />} />
        <Route path="settings/complexes/:id" element={<ComplexFormScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
