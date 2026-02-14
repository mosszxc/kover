export interface GeoPoint {
  id: string
  lat: number
  lng: number
  /** Вес точки для балансировки нагрузки (напр. площадь ковриков) */
  weight: number
}

export interface Cluster {
  centroid: { lat: number; lng: number }
  points: GeoPoint[]
  totalWeight: number
}

/**
 * K-means кластеризация точек по координатам.
 * Возвращает K кластеров с минимизацией суммарного расстояния.
 *
 * После кластеризации применяется балансировка: если один кластер
 * перегружен по весу более чем на 40%, пограничные точки перемещаются
 * в соседние кластеры.
 */
export function clusterPoints(points: GeoPoint[], k: number, maxIterations = 50): Cluster[] {
  if (points.length === 0 || k <= 0) return []
  if (k >= points.length) {
    return points.map((p) => ({
      centroid: { lat: p.lat, lng: p.lng },
      points: [p],
      totalWeight: p.weight,
    }))
  }

  // Инициализация: K-means++ для лучшего стартового расположения центроидов
  const centroids = initCentroidsKMeansPlusPlus(points, k)

  let assignments = new Array<number>(points.length).fill(0)

  for (let iter = 0; iter < maxIterations; iter++) {
    // Шаг 1: назначить каждую точку ближайшему центроиду
    const newAssignments = points.map((p) => {
      let minDist = Infinity
      let best = 0
      for (let c = 0; c < centroids.length; c++) {
        const cent = centroids[c]!
        const d = distSq(p.lat, p.lng, cent.lat, cent.lng)
        if (d < minDist) {
          minDist = d
          best = c
        }
      }
      return best
    })

    // Проверка сходимости
    const converged = newAssignments.every((a, i) => a === assignments[i])
    assignments = newAssignments

    // Шаг 2: пересчитать центроиды
    for (let c = 0; c < k; c++) {
      let sumLat = 0
      let sumLng = 0
      let count = 0
      for (let i = 0; i < points.length; i++) {
        if (assignments[i] === c) {
          const pt = points[i]!
          sumLat += pt.lat
          sumLng += pt.lng
          count++
        }
      }
      if (count > 0) {
        centroids[c] = { lat: sumLat / count, lng: sumLng / count }
      }
    }

    if (converged) break
  }

  // Формирование кластеров
  const clusters: Cluster[] = centroids.map((c) => ({
    centroid: c,
    points: [],
    totalWeight: 0,
  }))

  for (let i = 0; i < points.length; i++) {
    const cluster = clusters[assignments[i]!]!
    const pt = points[i]!
    cluster.points.push(pt)
    cluster.totalWeight += pt.weight
  }

  // Балансировка нагрузки
  balanceClusters(clusters)

  return clusters
}

/** K-means++ инициализация центроидов */
function initCentroidsKMeansPlusPlus(
  points: GeoPoint[],
  k: number,
): { lat: number; lng: number }[] {
  const centroids: { lat: number; lng: number }[] = []

  // Первый центроид — случайная точка
  const first = points[Math.floor(Math.random() * points.length)]!
  centroids.push({ lat: first.lat, lng: first.lng })

  for (let c = 1; c < k; c++) {
    // Для каждой точки найти минимальное расстояние до ближайшего центроида
    const distances = points.map((p) => {
      let minD = Infinity
      for (const cent of centroids) {
        const d = distSq(p.lat, p.lng, cent.lat, cent.lng)
        if (d < minD) minD = d
      }
      return minD
    })

    // Выбрать следующий центроид пропорционально D²
    const totalDist = distances.reduce((a, b) => a + b, 0)
    let r = Math.random() * totalDist
    let selected = 0
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i]!
      if (r <= 0) {
        selected = i
        break
      }
    }
    const sel = points[selected]!
    centroids.push({ lat: sel.lat, lng: sel.lng })
  }

  return centroids
}

/** Балансировка: перемещаем пограничные точки из перегруженных кластеров */
function balanceClusters(clusters: Cluster[]): void {
  if (clusters.length < 2) return

  const totalWeight = clusters.reduce((s, c) => s + c.totalWeight, 0)
  const avgWeight = totalWeight / clusters.length
  const threshold = avgWeight * 1.4 // 40% перегрузка

  // До 10 итераций балансировки
  for (let iter = 0; iter < 10; iter++) {
    let moved = false

    for (const cluster of clusters) {
      if (cluster.totalWeight <= threshold || cluster.points.length <= 1) continue

      // Найти точку, наиболее близкую к другому кластеру
      let bestPoint: GeoPoint | null = null
      let bestTarget: Cluster | null = null
      let bestDist = Infinity

      for (const point of cluster.points) {
        for (const other of clusters) {
          if (other === cluster) continue
          if (other.totalWeight >= threshold) continue // не перемещаем в перегруженный

          const d = distSq(point.lat, point.lng, other.centroid.lat, other.centroid.lng)
          if (d < bestDist) {
            bestDist = d
            bestPoint = point
            bestTarget = other
          }
        }
      }

      if (bestPoint && bestTarget) {
        // Перемещаем
        cluster.points = cluster.points.filter((p) => p.id !== bestPoint!.id)
        cluster.totalWeight -= bestPoint.weight
        bestTarget.points.push(bestPoint)
        bestTarget.totalWeight += bestPoint.weight
        moved = true
      }
    }

    if (!moved) break
  }

  // Обновить центроиды после балансировки
  for (const cluster of clusters) {
    if (cluster.points.length === 0) continue
    const sumLat = cluster.points.reduce((s, p) => s + p.lat, 0)
    const sumLng = cluster.points.reduce((s, p) => s + p.lng, 0)
    cluster.centroid = {
      lat: sumLat / cluster.points.length,
      lng: sumLng / cluster.points.length,
    }
  }
}

/** Квадрат евклидова расстояния (достаточно для сравнения) */
function distSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dlat = lat1 - lat2
  const dlng = lng1 - lng2
  return dlat * dlat + dlng * dlng
}
