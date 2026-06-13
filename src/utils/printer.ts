/// <reference types="@types/web-bluetooth" />

// WebUSB types
declare global {
  interface Navigator {
    usb: {
      requestDevice(options: { filters: { classCode?: number; vendorId?: number; productId?: number }[] }): Promise<any>
      getDevices(): Promise<any[]>
    }
  }
}

// ESC/POS Commands
const ESC = 0x1B
const GS = 0x1D

export const COMMANDS = {
  INIT: [ESC, 0x40],
  CASH_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xFA],
  CUT_PAPER: [GS, 0x56, 0x41, 0x10],
  FEED_LINE: [0x0A],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
}

// ─── BLUETOOTH ───────────────────────────────

let btDevice: BluetoothDevice | null = null
let btCharacteristic: BluetoothRemoteGATTCharacteristic | null = null

export const connectBluetooth = async (): Promise<boolean> => {
  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { namePrefix: "Printer" },
        { namePrefix: "RPP" },
        { namePrefix: "MTP" },
        { namePrefix: "BlueTooth Printer" },
        { namePrefix: "BT Printer" },
        { namePrefix: "POS" },
        { namePrefix: "Epson" },
        { namePrefix: "Star" },
        { namePrefix: "Xprinter" },
        { namePrefix: "XP-" },
        { namePrefix: "PT-" },
      ],
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      ],
    })

    btDevice = device
    const server = await device.gatt!.connect()

    const serviceUUIDs = [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
      "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    ]

    for (const uuid of serviceUUIDs) {
      try {
        const service = await server.getPrimaryService(uuid)
        const characteristics = await service.getCharacteristics()
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            btCharacteristic = char
            console.log("BT Printer connected! ✅")
            return true
          }
        }
      } catch {}
    }
    return false
  } catch (err) {
    console.error("BT connect failed:", err)
    return false
  }
}

export const disconnectBluetooth = async () => {
  if (btDevice?.gatt?.connected) {
    await btDevice.gatt.disconnect()
  }
  btDevice = null
  btCharacteristic = null
}

export const isBTConnected = (): boolean => {
  return !!(btDevice?.gatt?.connected && btCharacteristic)
}

const sendBluetooth = async (data: Uint8Array): Promise<boolean> => {
  if (!btCharacteristic) return false
  try {
    const CHUNK = 100
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK)
      if (btCharacteristic.properties.writeWithoutResponse) {
        await btCharacteristic.writeValueWithoutResponse(chunk)
      } else {
        await btCharacteristic.writeValue(chunk)
      }
      await new Promise(r => setTimeout(r, 50))
    }
    return true
  } catch (err) {
    console.error("BT send failed:", err)
    return false
  }
}

// ─── USB ─────────────────────────────────────

let usbDevice: any = null
let usbEndpoint: number = 1

export const connectUSB = async (): Promise<boolean> => {
  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: [{ classCode: 0x07 }]
    })

    await device.open()
    await device.selectConfiguration(1)
    await device.claimInterface(0)

    const iface = device.configuration?.interfaces[0]
    const endpoints = iface?.alternate?.endpoints || []
    for (const ep of endpoints) {
      if (ep.direction === "out" && ep.type === "bulk") {
        usbEndpoint = ep.endpointNumber
        break
      }
    }

    usbDevice = device
    console.log("USB Printer connected! ✅")
    return true
  } catch (err) {
    console.error("USB connect failed:", err)
    return false
  }
}

export const disconnectUSB = async () => {
  if (usbDevice) {
    try {
      await usbDevice.releaseInterface(0)
      await usbDevice.close()
    } catch {}
    usbDevice = null
  }
}

export const isUSBConnected = (): boolean => !!usbDevice

const sendUSB = async (data: Uint8Array): Promise<boolean> => {
  if (!usbDevice) return false
  try {
    await usbDevice.transferOut(usbEndpoint, data)
    return true
  } catch (err) {
    console.error("USB send failed:", err)
    return false
  }
}

// ─── UNIFIED SEND ────────────────────────────

const sendToPrinter = async (bytes: number[]): Promise<boolean> => {
  const data = new Uint8Array(bytes)
  if (isUSBConnected()) return sendUSB(data)
  if (isBTConnected()) return sendBluetooth(data)
  return false
}

// ─── CASH DRAWER ─────────────────────────────

export const openCashDrawer = async (): Promise<boolean> => {
  return sendToPrinter(COMMANDS.CASH_DRAWER)
}

// ─── TEXT ENCODING ───────────────────────────

const encodeText = (text: string): number[] => {
  return Array.from(new TextEncoder().encode(text))
}

// ─── PRINT RECEIPT ───────────────────────────

export const printReceipt = async (
  sale: any,
  items: any[],
  business: any,
  language: "en" | "si" = "en",
  change: number = 0
): Promise<boolean> => {

  const T = language === "si" ? {
    invoice: "ඉන්වොයිස්", cashier: "මුදල් අරින්නා",
    customer: "ගනුදෙනුකරු", date: "දිනය",
    netTotal: "මුළු මුදල", billDisc: "බිල් වට්ටම",
    paid: "ගෙවූ මුදල", changeLabel: "ඉතිරිය",
    itemCount: "භාණ්ඩ ගණන", youSaved: "ඔබ ඉතිරි කළේ",
    thankYou: "ස්තූතියි!",
  } : {
    invoice: "Invoice No", cashier: "Cashier",
    customer: "Customer", date: "Date",
    netTotal: "Net Total", billDisc: "Bill Discount",
    paid: "Paid Amount", changeLabel: "Change",
    itemCount: "Items Count", youSaved: "You Saved",
    thankYou: "Thank You!",
  }

  const line = (char = "-", len = 32) => char.repeat(len)
  const leftRight = (left: string, right: string, width = 32) => {
    const space = Math.max(1, width - left.length - right.length)
    return left + " ".repeat(space) + right
  }

  const bytes: number[] = []
  const add = (arr: number[]) => bytes.push(...arr)
  const text = (str: string) => add(encodeText(str + "\n"))

  // Init
  add(COMMANDS.INIT)
  add(COMMANDS.ALIGN_CENTER)

  // Header — DESH TECH
  text("DESH TECH")
  text(line("─"))
  add(COMMANDS.BOLD_ON)
  text(business?.business_name || "DeshPos")
  add(COMMANDS.BOLD_OFF)
  if (business?.address) text(business.address)
  if (business?.phone) text(`Tel: ${business.phone}`)

  add(COMMANDS.ALIGN_LEFT)
  text(line())

  // Invoice info
  text(leftRight(T.invoice, sale.sale_number || ""))
  if (sale.staff_name) text(leftRight(T.cashier, sale.staff_name))
  if (sale.customer_name) text(leftRight(T.customer, sale.customer_name))
  text(leftRight(T.date, new Date(sale.created_at || Date.now()).toLocaleString()))
  text(line())

  // Items header
  text("PRODUCT          PRICE  DISC  AMT")
  text(line())

  // Items
  for (const item of items) {
    const qty = Number(item.quantity)
    const sellPrice = Number(item.unit_price)
    const itemDisc = Number(item.discount || 0)
    const itemTotal = (sellPrice * qty) - itemDisc
    const printPrice = Number(item.print_price) || 0
    const saving = printPrice > sellPrice
      ? (printPrice - sellPrice) * qty : 0

    add(COMMANDS.BOLD_ON)
    text(item.product_name.substring(0, 32))
    add(COMMANDS.BOLD_OFF)

    const qtyStr = `${qty % 1 === 0 ? qty : qty.toFixed(2)} ${item.unit_type}`
    const priceStr = sellPrice.toFixed(2)
    const discStr = itemDisc > 0 ? itemDisc.toFixed(2) : "0.00"
    const totalStr = itemTotal.toFixed(2)

    text(leftRight(qtyStr, `${priceStr} ${discStr} ${totalStr}`))
    if (saving > 0) text(`  Save: Rs.${saving.toFixed(2)}`)
    text(line("-"))
  }

  // Totals
  const total = Number(sale.total || sale.total_amount)
  const paid = Number(sale.paid_amount)
  const discount = Number(sale.cart_discount || sale.discount || 0)
  const subtotal = Number(sale.subtotal || total + discount)

  text(leftRight(T.netTotal, subtotal.toFixed(2)))
  if (discount > 0) text(leftRight(T.billDisc, `-Rs.${discount.toFixed(2)}`))
  text(line())

  add(COMMANDS.BOLD_ON)
  text(leftRight(T.paid, paid.toFixed(2)))
  text(leftRight(T.changeLabel, change.toFixed(2)))
  add(COMMANDS.BOLD_OFF)

  text(leftRight(T.itemCount, items.length.toString()))

  // You Saved
  const totalSavings = items.reduce((sum, item) => {
    const qty = Number(item.quantity)
    const printPrice = Number(item.print_price) || 0
    const sellPrice = Number(item.unit_price)
    const itemDisc = Number(item.discount || 0)
    const saving = (printPrice * qty) - ((sellPrice * qty) - itemDisc)
    return sum + (saving > 0 ? saving : 0)
  }, 0)

  if (totalSavings > 0) {
    text(line("="))
    add(COMMANDS.ALIGN_CENTER)
    add(COMMANDS.BOLD_ON)
    text(T.youSaved)
    text(`Rs.${totalSavings.toFixed(2)}`)
    add(COMMANDS.BOLD_OFF)
    add(COMMANDS.ALIGN_LEFT)
    text(line("="))
  }

  // Sale number + Barcode
  add(COMMANDS.ALIGN_CENTER)
  text(line())
  text(sale.sale_number || "")

  // Code128 barcode command
  if (sale.sale_number) {
    const barcodeData = encodeText(sale.sale_number)
    bytes.push(GS, 0x6B, 0x49, barcodeData.length, ...barcodeData)
  }

  // Footer
  add([0x0A, 0x0A])
  add(COMMANDS.BOLD_ON)
  text(T.thankYou)
  add(COMMANDS.BOLD_OFF)
  text("Powered by DESH TECH")
  add([0x0A, 0x0A, 0x0A])

  // Cut paper
  add(COMMANDS.CUT_PAPER)

  return sendToPrinter(bytes)
}

// printer.ts — add:
export const autoReconnect = async (): Promise<{bt: boolean, usb: boolean}> => {
  let bt = false
  let usb = false

  // USB — browser remembers permission!
  try {
    const devices = await (navigator as any).usb.getDevices()
    if (devices.length > 0) {
      const device = devices[0]
      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)

      const iface = device.configuration?.interfaces[0]
      const endpoints = iface?.alternate?.endpoints || []
      for (const ep of endpoints) {
        if (ep.direction === "out" && ep.type === "bulk") {
          usbEndpoint = ep.endpointNumber
          break
        }
      }
      usbDevice = device
      usb = true
      console.log("USB auto-reconnected! ✅")
    }
  } catch {}

  return { bt, usb }
}