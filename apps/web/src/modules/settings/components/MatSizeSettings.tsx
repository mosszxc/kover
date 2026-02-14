import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { MatSizeConfig } from '@/shared/types'

interface EditingState {
  id: string
  label: string
  area: string
}

interface MatSizeSettingsProps {
  isSizeUsed: (sizeId: string) => boolean
  getClientsUsing: (sizeId: string) => number
  onDeleteAndReplace: (oldSizeId: string, newSizeId: string) => void
}

export function MatSizeSettings({ isSizeUsed, getClientsUsing, onDeleteAndReplace }: MatSizeSettingsProps) {
  const sizes = useMatSizeStore((s) => s.sizes)
  const addSize = useMatSizeStore((s) => s.addSize)
  const updateSize = useMatSizeStore((s) => s.updateSize)
  const removeSize = useMatSizeStore((s) => s.removeSize)

  const [editing, setEditing] = useState<EditingState | null>(null)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newArea, setNewArea] = useState('')
  const [deletingSize, setDeletingSize] = useState<MatSizeConfig | null>(null)
  const [replacementSizeId, setReplacementSizeId] = useState<string>('')

  function handleStartEdit(size: MatSizeConfig) {
    setEditing({ id: size.id, label: size.label, area: String(size.area) })
    setAdding(false)
  }

  function handleSaveEdit() {
    if (!editing) return
    const area = parseFloat(editing.area)
    if (!editing.label.trim() || isNaN(area) || area <= 0) {
      toast.error('Введите корректное название и площадь')
      return
    }
    updateSize(editing.id, { label: editing.label.trim(), area })
    toast.success('Размер обновлён')
    setEditing(null)
  }

  function handleDelete(size: MatSizeConfig) {
    if (isSizeUsed(size.id)) {
      setDeletingSize(size)
      setReplacementSizeId('')
      return
    }
    removeSize(size.id)
    toast.success(`Размер «${size.label}» удалён`)
  }

  function handleConfirmDeleteAndReplace() {
    if (!deletingSize || !replacementSizeId) return
    onDeleteAndReplace(deletingSize.id, replacementSizeId)
    const replacementLabel = sizes.find((s) => s.id === replacementSizeId)?.label ?? replacementSizeId
    toast.success(`Размер «${deletingSize.label}» удалён, клиенты переведены на «${replacementLabel}»`)
    setDeletingSize(null)
    setReplacementSizeId('')
  }

  function handleAdd() {
    const area = parseFloat(newArea)
    if (!newLabel.trim()) {
      toast.error('Введите название размера')
      return
    }
    if (isNaN(area) || area <= 0) {
      toast.error('Введите корректную площадь')
      return
    }
    const id = newLabel.trim().toLowerCase().replace(/\s+/g, '')
    if (sizes.some((s) => s.id === id)) {
      toast.error('Размер с таким названием уже существует')
      return
    }
    addSize(id, newLabel.trim(), area)
    toast.success(`Размер «${newLabel.trim()}» добавлен`)
    setNewLabel('')
    setNewArea('')
    setAdding(false)
  }

  const inputClass =
    'h-9 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'

  const availableReplacements = deletingSize
    ? sizes.filter((s) => s.id !== deletingSize.id)
    : []

  const clientsUsingCount = deletingSize ? getClientsUsing(deletingSize.id) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Размеры ковриков</h2>
          <p className="text-sm text-slate-400">
            Управление списком доступных размеров ковриков
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAdding(true)
            setEditing(null)
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="border-b border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-400">
                Название
              </th>
              <th className="border-b border-slate-700 px-4 py-3 text-right text-sm font-medium text-slate-400">
                Площадь (м²)
              </th>
              <th className="border-b border-slate-700 px-4 py-3 text-right text-sm font-medium text-slate-400 w-28">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((size, i) => {
              const isEditing = editing?.id === size.id

              if (isEditing) {
                return (
                  <tr key={size.id} className={`border-b border-slate-800 ${i % 2 === 1 ? 'bg-slate-900/50' : ''}`}>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editing.label}
                        onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                        className={`${inputClass} w-full`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') setEditing(null)
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editing.area}
                        onChange={(e) => setEditing({ ...editing, area: e.target.value })}
                        className={`${inputClass} w-full text-right`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') setEditing(null)
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-400 hover:text-green-300"
                          onClick={handleSaveEdit}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-300"
                          onClick={() => setEditing(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={size.id} className={`border-b border-slate-800 ${i % 2 === 1 ? 'bg-slate-900/50' : ''}`}>
                  <td className="px-4 py-3 text-sm text-slate-50">
                    {size.label}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-50">
                    {size.area}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-200"
                        onClick={() => handleStartEdit(size)}
                        aria-label={`Редактировать ${size.label}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                        onClick={() => handleDelete(size)}
                        aria-label={`Удалить ${size.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {adding && (
              <tr className="border-b border-slate-800 bg-blue-950/20">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Название (напр. 300)"
                    className={`${inputClass} w-full`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') {
                        setAdding(false)
                        setNewLabel('')
                        setNewArea('')
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Площадь м²"
                    className={`${inputClass} w-full text-right`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') {
                        setAdding(false)
                        setNewLabel('')
                        setNewArea('')
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-400 hover:text-green-300"
                      onClick={handleAdd}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-300"
                      onClick={() => {
                        setAdding(false)
                        setNewLabel('')
                        setNewArea('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deletingSize} onOpenChange={(open) => { if (!open) { setDeletingSize(null); setReplacementSizeId('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить размер «{deletingSize?.label}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Этот размер используется у {clientsUsingCount}{' '}
              {clientsUsingCount === 1 ? 'клиента' : clientsUsingCount < 5 ? 'клиентов' : 'клиентов'}.
              Выберите размер-замену — он будет автоматически назначен всем затронутым клиентам.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={replacementSizeId} onValueChange={setReplacementSizeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите размер-замену" />
              </SelectTrigger>
              <SelectContent>
                {availableReplacements.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} ({s.area} м²)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!replacementSizeId}
              onClick={handleConfirmDeleteAndReplace}
            >
              Удалить и заменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
