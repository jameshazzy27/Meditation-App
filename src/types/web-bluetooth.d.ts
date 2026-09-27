// The small part of the Web Bluetooth API that Aura uses (TypeScript doesn't ship these types).
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  value?: DataView
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}
interface BluetoothRemoteGATTService {
  getCharacteristic(name: string | number): Promise<BluetoothRemoteGATTCharacteristic>
}
interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(name: string | number): Promise<BluetoothRemoteGATTService>
}
interface BluetoothDevice extends EventTarget {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
}
interface Bluetooth {
  getAvailability?(): Promise<boolean>
  requestDevice(options: { filters: { services: (string | number)[] }[] }): Promise<BluetoothDevice>
}
interface Navigator {
  bluetooth?: Bluetooth
}
