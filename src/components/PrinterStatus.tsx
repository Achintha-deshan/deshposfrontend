"use client"

import { useState, useEffect } from "react"
import {
  connectBluetooth, connectUSB,
  disconnectBluetooth, disconnectUSB,
  isBTConnected, isUSBConnected, openCashDrawer,
} from "../utils/printer"

export default function PrinterStatus() {
  const [btConnected, setBtConnected] = useState(false)
  const [usbConnected, setUsbConnected] = useState(false)
  const [connecting, setConnecting] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setBtConnected(isBTConnected())
      setUsbConnected(isUSBConnected())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const isConnected = btConnected || usbConnected

  const showMsg = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(""), 2500)
  }

  const handleBT = async () => {
    if (btConnected) {
      await disconnectBluetooth()
      setBtConnected(false)
      showMsg("Bluetooth disconnected")
      return
    }
    setConnecting("bt")
    const ok = await connectBluetooth()
    setBtConnected(ok)
    showMsg(ok ? "✅ Bluetooth connected!" : "❌ BT failed!")
    setConnecting("")
  }

  const handleUSB = async () => {
    if (usbConnected) {
      await disconnectUSB()
      setUsbConnected(false)
      showMsg("USB disconnected")
      return
    }
    setConnecting("usb")
    const ok = await connectUSB()
    setUsbConnected(ok)
    showMsg(ok ? "✅ USB connected!" : "❌ USB failed!")
    setConnecting("")
  }

  const handleDrawer = async () => {
    const ok = await openCashDrawer()
    showMsg(ok ? "💰 Drawer opened!" : "❌ No printer!")
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Message */}
      {message && (
        <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
          {message}
        </span>
      )}

      {/* Status dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        isConnected ? "bg-green-400 animate-pulse" : "bg-slate-600"
      }`} />

      {/* BT */}
      <button
        onClick={handleBT}
        disabled={connecting === "bt"}
        title={btConnected ? "Disconnect Bluetooth" : "Connect Bluetooth Printer"}
        className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
          btConnected
            ? "bg-blue-600 text-white"
            : connecting === "bt"
              ? "bg-slate-700 text-blue-400 animate-pulse"
              : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
        }`}>
        🔵 {connecting === "bt" ? "..." : btConnected ? "BT ✓" : "BT"}
      </button>

      {/* USB */}
      <button
        onClick={handleUSB}
        disabled={connecting === "usb"}
        title={usbConnected ? "Disconnect USB" : "Connect USB Printer"}
        className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
          usbConnected
            ? "bg-green-600 text-white"
            : connecting === "usb"
              ? "bg-slate-700 text-green-400 animate-pulse"
              : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
        }`}>
        🔌 {connecting === "usb" ? "..." : usbConnected ? "USB ✓" : "USB"}
      </button>

      {/* Cash Drawer */}
      {isConnected && (
        <button
          onClick={handleDrawer}
          title="Open Cash Drawer"
          className="px-2 py-1 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs hover:bg-yellow-600/30 transition">
          💰
        </button>
      )}
    </div>
  )
}