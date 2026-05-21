'use client'
import { useEffect, useRef } from 'react'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
)

export default function ChartWrapper({ type, data, options }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options: {
        ...options,
        animation: false,
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [type, data, options])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    />
  )
}
