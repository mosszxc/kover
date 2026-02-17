import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useDriverStore } from '@/modules/drivers'
import { usePaymentStore } from '@/modules/payments'
import { useInventoryStore } from '@/modules/inventory'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useCostSettingsStore } from '@/shared/stores/costSettingsStore'
import { useInvoiceSettingsStore } from '@/shared/stores/invoiceSettingsStore'
import { useRouteSettingsStore } from '@/shared/stores/routeSettingsStore'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useServiceReportStore } from '@/shared/stores/serviceReportStore'
import type { BackupData } from './backup'

export function collectStores(): Omit<BackupData, 'meta'> {
  const { clients } = useClientStore.getState()
  const { routes } = useRouteStore.getState()
  const { drivers } = useDriverStore.getState()
  const { payments } = usePaymentStore.getState()
  const { inventory, transactions } = useInventoryStore.getState()
  const { sizes } = useMatSizeStore.getState()

  const {
    geocodeCity, showWeekends, fileSyncEnabled, fileSyncFileName,
    lastFileSyncAt, notificationsEnabled, autostartEnabled, startMinimized,
  } = useSettingsStore.getState()
  const settings = {
    geocodeCity, showWeekends, fileSyncEnabled, fileSyncFileName,
    lastFileSyncAt, notificationsEnabled, autostartEnabled, startMinimized,
  }

  const { laundryCostPerSqm, logisticsCostPerStop } = useCostSettingsStore.getState()
  const costSettings = { laundryCostPerSqm, logisticsCostPerStop }

  const {
    companyName, inn, bankName, bankAccount, bik, corrAccount, invoicePrefix,
  } = useInvoiceSettingsStore.getState()
  const invoiceSettings = { companyName, inn, bankName, bankAccount, bik, corrAccount, invoicePrefix }

  const { maxStopsPerDay } = useRouteSettingsStore.getState()
  const routeSettings = { maxStopsPerDay }

  const { exceptions } = useRouteExceptionsStore.getState()
  const { entries: changelog } = useChangeLogStore.getState()
  const { entries: serviceLog } = useServiceLogStore.getState()
  const { reports: serviceReports } = useServiceReportStore.getState()

  return {
    clients,
    routes,
    drivers,
    payments,
    inventory,
    inventoryTransactions: transactions,
    matSizes: sizes,
    settings,
    costSettings,
    invoiceSettings,
    routeSettings,
    routeExceptions: exceptions,
    changelog,
    serviceLog,
    serviceReports,
  }
}

export function restoreStores(data: BackupData): void {
  // Core data stores (always present, even in old backups)
  useClientStore.getState().seedClients(data.clients as never)
  useRouteStore.getState().seedRoutes(data.routes as never)

  // Module stores (optional — may be missing in old backups)
  if (data.drivers) {
    useDriverStore.getState().seedDrivers(data.drivers as never)
  }
  if (data.payments) {
    usePaymentStore.setState({ payments: data.payments as [] })
  }
  if (data.inventory != null || data.inventoryTransactions != null) {
    const patch: Record<string, unknown> = {}
    if (data.inventory) patch.inventory = data.inventory
    if (data.inventoryTransactions) patch.transactions = data.inventoryTransactions
    useInventoryStore.setState(patch)
  }

  // Shared stores
  if (data.matSizes) {
    useMatSizeStore.setState({ sizes: data.matSizes as [] })
  }
  if (data.settings && typeof data.settings === 'object') {
    useSettingsStore.setState(data.settings as Record<string, unknown>)
  }
  if (data.costSettings && typeof data.costSettings === 'object') {
    useCostSettingsStore.setState(data.costSettings as Record<string, unknown>)
  }
  if (data.invoiceSettings && typeof data.invoiceSettings === 'object') {
    useInvoiceSettingsStore.setState(data.invoiceSettings as Record<string, unknown>)
  }
  if (data.routeSettings && typeof data.routeSettings === 'object') {
    useRouteSettingsStore.setState(data.routeSettings as Record<string, unknown>)
  }
  if (data.routeExceptions) {
    useRouteExceptionsStore.setState({ exceptions: data.routeExceptions as [] })
  }
  if (data.changelog) {
    useChangeLogStore.setState({ entries: data.changelog as [] })
  }
  if (data.serviceLog) {
    useServiceLogStore.setState({ entries: data.serviceLog as [] })
  }
  if (data.serviceReports) {
    useServiceReportStore.setState({ reports: data.serviceReports as [] })
  }
}
