import { Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/AppShell'
import { ComplexesScreen } from '@/screens/ComplexesScreen'
import { ComplexFormScreen } from '@/screens/ComplexFormScreen'
import { HistoryScreen } from '@/screens/HistoryScreen'
import { KettlebellLogScreen } from '@/screens/KettlebellLogScreen'
import { LogScreen } from '@/screens/LogScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { StylePreviewScreen } from '@/screens/StylePreviewScreen'
import { TodayScreen } from '@/screens/TodayScreen'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayScreen />} />
        <Route path="history" element={<HistoryScreen />} />
        <Route path="log" element={<LogScreen />} />
        <Route path="log/kettlebell" element={<KettlebellLogScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="settings/style" element={<StylePreviewScreen />} />
        <Route path="settings/complexes" element={<ComplexesScreen />} />
        <Route path="settings/complexes/:id" element={<ComplexFormScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
