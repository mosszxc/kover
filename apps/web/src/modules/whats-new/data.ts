export interface ReleaseEntry {
  version: string
  date: string
  items: {
    type: "feature" | "fix" | "improvement"
    text: string
  }[]
}

export const releases: ReleaseEntry[] = [
  {
    version: "1.0.3",
    date: "2026-02-18",
    items: [
      { type: "feature", text: "Страница «Нововведения» — теперь видно что нового в приложении" },
      { type: "feature", text: "Индикатор непрочитанных обновлений в сайдбаре" },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-02-18",
    items: [
      { type: "feature", text: "Версия приложения отображается в настройках" },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-02-18",
    items: [
      { type: "feature", text: "Порог перегрузки маршрута теперь можно менять прямо в интерфейсе" },
      { type: "fix", text: "Изменение расписания клиента теперь корректно обновляет маршруты" },
      { type: "improvement", text: "Телефон клиента больше не печатается на маршрутном листе" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-02-16",
    items: [
      { type: "feature", text: "Печать маршрутного листа отдельно для каждого водителя" },
      { type: "feature", text: "Настройка размеров шрифтов в интерфейсе" },
      { type: "fix", text: "Суббота и воскресенье теперь корректно учитываются везде" },
      { type: "improvement", text: "Увеличены кнопки и touch targets для удобства" },
      { type: "improvement", text: "Улучшена читаемость текста и контрастность" },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-02-12",
    items: [
      { type: "feature", text: "Упрощённые фильтры клиентов вместо 6 групп" },
      { type: "feature", text: "Кнопки перемещения остановок — альтернатива drag & drop" },
      { type: "feature", text: "Брифинг «Сегодня» — что делать, а не только данные" },
      { type: "feature", text: "Сворачиваемые карточки клиентов для уменьшения перегрузки" },
      { type: "improvement", text: "Группировка навигации в сайдбаре" },
      { type: "improvement", text: "Светлая тема по умолчанию" },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-02-08",
    items: [
      { type: "feature", text: "Загрузка водителя в м² — не только количество остановок" },
      { type: "feature", text: "Партионный учёт износа ковров" },
      { type: "feature", text: "Визуализация маршрута на карте с путями" },
      { type: "feature", text: "Бекапы теперь включают все stores" },
    ],
  },
]
