"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  onDetected: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState("")
  const [scanning, setScanning] = useState(false)
  const readerRef = useRef<any>(null)

  useEffect(() => {
    startScan()
    return () => {
      stopScan()
    }
  }, [])

  const startScan = async () => {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser")
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      if (devices.length === 0) {
        setError("No camera found!")
        return
      }

      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      ) || devices[devices.length - 1]

      setScanning(true)

      reader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            onDetected(result.getText())
            stopScan()
          }
        }
      )
    } catch (err) {
      setError("Camera access denied! Please allow camera permission.")
    }
  }

  const stopScan = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch {}
    }
    setScanning(false)
  }

  const handleClose = () => {
    stopScan()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">

      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md px-4 mb-4">
        <h3 className="text-white font-bold">📷 Scan Barcode</h3>
        <button onClick={handleClose}
          className="text-slate-400 hover:text-white text-sm px-3 py-1 border border-slate-600 rounded-lg">
          Close ✕
        </button>
      </div>

      {/* Camera View */}
      <div className="relative w-full max-w-md px-4">
        <div className="relative rounded-2xl overflow-hidden bg-slate-900">
          <video
            ref={videoRef}
            className="w-full"
            style={{ maxHeight: "60vh", objectFit: "cover" }}
          />

          {/* Scan Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-32">
              {/* Corner guides */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />

              {/* Scan line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-blue-400/70 animate-pulse"
                style={{ top: "50%" }} />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 text-center">
            {error}
            <button onClick={startScan} className="block mx-auto mt-2 text-blue-400 text-xs underline">
              Try Again
            </button>
          </div>
        )}

        {/* Status */}
        {scanning && !error && (
          <p className="text-slate-400 text-xs text-center mt-3">
            Point camera at barcode...
          </p>
        )}
      </div>
    </div>
  )
}