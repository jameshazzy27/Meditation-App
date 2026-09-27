import { useCallback, useEffect, useRef, useState } from 'react'

import { isPlausibleBpm, parseHeartRate } from '@/lib/meditation'

// Connects to any heart-rate monitor using the standard Bluetooth Heart Rate
// Service (0x180D, measurement 0x2A37) — chest straps, and watches set to
// broadcast heart rate (e.g. Garmin "Broadcast Heart Rate").

export type MonitorStatus = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface MonitorState {
  status: MonitorStatus
  bpm?: number
  deviceName?: string
  message?: string
}

export const bluetoothAvailable = () => typeof navigator !== 'undefined' && !!navigator.bluetooth

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 15000]

export function useHeartRateMonitor(onReading?: (bpm: number) => void) {
  const [state, setState] = useState<MonitorState>(() => ({ status: bluetoothAvailable() ? 'idle' : 'unsupported' }))
  const device = useRef<BluetoothDevice | null>(null)
  const wanted = useRef(false) // false once you tap Disconnect, so we stop reconnecting
  const readingHandler = useRef(onReading)
  useEffect(() => {
    readingHandler.current = onReading
  }, [onReading])

  const handleValue = useCallback((event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value
    const bpm = value && parseHeartRate(value)
    if (bpm === undefined || !isPlausibleBpm(bpm)) return
    setState((s) => ({ ...s, bpm }))
    readingHandler.current?.(bpm)
  }, [])

  const subscribe = useCallback(
    async (d: BluetoothDevice) => {
      const server = await d.gatt!.connect()
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')
      characteristic.addEventListener('characteristicvaluechanged', handleValue)
      await characteristic.startNotifications()
    },
    [handleValue],
  )

  const onDisconnected = useCallback(async () => {
    const d = device.current
    if (!d || !wanted.current) return
    setState((s) => ({ ...s, status: 'reconnecting', bpm: undefined, message: 'Signal lost — reconnecting…' }))
    for (const delay of RECONNECT_DELAYS_MS) {
      await new Promise((r) => setTimeout(r, delay))
      if (!wanted.current) return
      try {
        await subscribe(d)
        setState((s) => ({ ...s, status: 'connected', message: undefined }))
        return
      } catch {
        // try again after the next delay
      }
    }
    setState((s) => ({
      ...s,
      status: 'error',
      message: 'Lost the heart-rate monitor. Check it’s still broadcasting, then tap Connect.',
    }))
  }, [subscribe])

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) return
    wanted.current = true
    setState({ status: 'connecting' })
    try {
      const d = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      device.current?.removeEventListener('gattserverdisconnected', onDisconnected)
      device.current = d
      d.addEventListener('gattserverdisconnected', onDisconnected)
      await subscribe(d)
      setState({ status: 'connected', deviceName: d.name })
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === 'NotFoundError'
      setState({
        status: cancelled ? 'idle' : 'error',
        message: cancelled ? undefined : 'Couldn’t connect. Make sure the watch is broadcasting heart rate and nearby.',
      })
    }
  }, [onDisconnected, subscribe])

  const disconnect = useCallback(() => {
    wanted.current = false
    device.current?.gatt?.disconnect()
    setState({ status: 'idle' })
  }, [])

  // Let go of the monitor when leaving the screen.
  useEffect(
    () => () => {
      wanted.current = false
      device.current?.gatt?.disconnect()
    },
    [],
  )

  return { ...state, connect, disconnect }
}
