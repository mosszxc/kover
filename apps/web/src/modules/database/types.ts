export interface SheetData {
  name: string
  header: string[]
  rows: (string | number | boolean)[][]
}

export interface DatabaseStats {
  clients: number
  activeClients: number
  drivers: number
  activeDrivers: number
  matSizes: number
  totalStops: number
}
