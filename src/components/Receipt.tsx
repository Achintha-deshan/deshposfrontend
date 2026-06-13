"use client"

import React from "react"
import Barcode from "react-barcode"

interface ReceiptProps {
  sale: any
  items: any[]
  business: any
  language?: "en" | "si"
}

const T = {
  en: {
    invoice: "Invoice No", cashier: "Cashier", customer: "Customer",
    date: "Date", product: "PRODUCT", price: "PRICE", disc: "DISC",
    amount: "AMOUNT", netTotal: "Net Total", billDisc: "Bill Discount",
    paid: "Paid Amount", change: "Change", itemCount: "Items Count",
    youSaved: "You Saved", thankYou: "Thank You!", poweredBy: "Powered by DESH TECH",
    save: "Save",
  },
  si: {
    invoice: "Invoice No", cashier: "Cashier", customer: "ගනුදෙනුකරු",
    date: "දිනය", product: "භාණ්ඩය", price: "මිල", disc: "වට්ටම",
    amount: "මුදල", netTotal: "මුළු මුදල", billDisc: "බිල් වට්ටම",
    paid: "ගෙවූ මුදල", change: "ඉතිරිය", itemCount: "භාණ්ඩ ගණන",
    youSaved: "ඔබ ඉතිරි කළේ", thankYou: "ස්තූතියි!", poweredBy: "Powered by DESH TECH",
    save: "ඉතිරිය",
  }
}

export default function Receipt({ sale, items, business, language = "en" }: ReceiptProps) {
  const t = T[language]
  const total = Number(sale.total || sale.total_amount)
  const paid = Number(sale.paid_amount)
  const change = Number(sale.change || sale.change_amount)
  const discount = Number(sale.cart_discount || sale.discount || 0)
  const subtotal = Number(sale.subtotal || total + discount)

  const totalSavings = items.reduce((sum, item: any) => {
    const qty = Number(item.quantity)
    const printPrice = Number(item.print_price) || 0
    const sellPrice = Number(item.unit_price)
    const itemDisc = Number(item.discount || 0)
    const wouldPay = printPrice * qty
    const actualPay = (sellPrice * qty) - itemDisc
    const saving = wouldPay - actualPay
    return sum + (saving > 0 ? saving : 0)
  }, 0)

  return (
    <div id="receipt" style={{
      width: "80mm",
      fontFamily: language === "si" ? "'Noto Sans Sinhala', monospace" : "monospace",
      fontSize: "11px",
      color: "#000",
      background: "#fff",
      padding: "8px",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#555" }}>━━━━━━━━━━━━━━━━━━━━━━</div>
        <div style={{ fontWeight: "bold", fontSize: "11px", letterSpacing: "3px", color: "#000" }}>DESH TECH</div>
        <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#555" }}>━━━━━━━━━━━━━━━━━━━━━━</div>
      </div>

      {/* Logo */}
      {business?.logo && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
          <img src={business.logo} alt="logo" style={{
            width: "60px", height: "60px", objectFit: "contain",
            filter: "grayscale(100%) contrast(1.3)",
            mixBlendMode: "multiply", display: "block",
          }} />
        </div>
      )}

      {/* Business Info */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
          {business?.business_name || "DeshPos"}
        </div>
        {business?.address && (
          <div style={{ fontSize: "10px", color: "#555" }}>{business.address}</div>
        )}
        {business?.phone && (
          <div style={{ fontSize: "10px" }}>Tel: {business.phone}</div>
        )}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }} />

      {/* Invoice Info */}
      <div style={{ fontSize: "10px", marginBottom: "4px" }}>
        {[
          [t.invoice, sale.sale_number],
          sale.staff_name ? [t.cashier, sale.staff_name] : null,
          sale.customer_name ? [t.customer, sale.customer_name] : null,
          [t.date, new Date(sale.created_at || Date.now()).toLocaleString(
            language === "si" ? "si-LK" : "en-LK"
          )],
        ].filter(Boolean).map((row: any, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#555" }}>{row[0]}</span>
            <span style={{ fontWeight: "bold", textAlign: "right", maxWidth: "55%" }}>{row[1]}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }} />

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th style={{ textAlign: "left", paddingBottom: "3px", fontWeight: "bold" }}>{t.product}</th>
            <th style={{ textAlign: "right", paddingBottom: "3px", fontWeight: "bold" }}>{t.price}</th>
            <th style={{ textAlign: "right", paddingBottom: "3px", fontWeight: "bold" }}>{t.disc}</th>
            <th style={{ textAlign: "right", paddingBottom: "3px", fontWeight: "bold" }}>{t.amount}</th>
          </tr>
        </thead>
        <tbody>{items.map((item: any, i: number) => {
          const qty = Number(item.quantity)
          const printPrice = Number(item.print_price) || 0
          const sellPrice = Number(item.unit_price)
          const itemDisc = Number(item.discount || 0)
          const itemTotal = (sellPrice * qty) - itemDisc
          const wouldPay = printPrice * qty
          const actualPay = (sellPrice * qty) - itemDisc
          const itemSaving = wouldPay > actualPay && printPrice > 0 ? wouldPay - actualPay : 0

          return (
            <React.Fragment key={i}>
              <tr>
                <td colSpan={4} style={{ paddingTop: "4px", fontWeight: "bold", fontSize: "11px" }}>
                  {item.product_name}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px dashed #ddd" }}>
                <td style={{ paddingBottom: "3px", color: "#444", fontSize: "10px" }}>
                  {qty % 1 === 0 ? qty : qty.toFixed(2)} {item.unit_type}
                </td>
                <td style={{ textAlign: "right", paddingBottom: "3px" }}>
                  {printPrice > sellPrice && (
                    <span style={{ textDecoration: "line-through", color: "#999", fontSize: "9px", marginRight: "2px" }}>
                      {printPrice.toFixed(2)}
                    </span>
                  )}
                  {sellPrice.toFixed(2)}
                </td>
                <td style={{ textAlign: "right", paddingBottom: "3px" }}>
                  {itemDisc > 0 ? itemDisc.toFixed(2) : "0.00"}
                </td>
                <td style={{ textAlign: "right", paddingBottom: "3px", fontWeight: "bold" }}>
                  {itemTotal.toFixed(2)}
                </td>
              </tr>
              {itemSaving > 0 && (
                <tr>
                  <td colSpan={4} style={{ fontSize: "9px", color: "#666", paddingBottom: "2px" }}>
                    💚 {t.save}: Rs.{itemSaving.toFixed(2)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          )
        })}</tbody>
      </table>

      <div style={{ borderTop: "1px dashed #000", margin: "5px 0" }} />

      {/* Totals */}
      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
          <span style={{ color: "#555" }}>{t.netTotal}</span>
          <span style={{ fontWeight: "bold" }}>{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
            <span style={{ color: "#555" }}>{t.billDisc}</span>
            <span>-Rs.{discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontWeight: "bold", fontSize: "13px",
          borderTop: "1px solid #000", paddingTop: "3px", marginTop: "3px"
        }}>
          <span>{t.paid}</span>
          <span>{paid.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "16px" }}>
          <span>{t.change}</span>
          <span>{change.toFixed(2)}</span>
        </div>
      </div>

      {/* Items Count */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: "10px", marginTop: "5px",
        borderTop: "1px dashed #000", paddingTop: "3px"
      }}>
        <span style={{ color: "#555" }}>{t.itemCount}</span>
        <span style={{ fontWeight: "bold" }}>{items.length}</span>
      </div>

      {/* You Saved */}
      {totalSavings > 0 && (
        <div style={{
          textAlign: "center", border: "2px dashed #000",
          padding: "6px", margin: "8px 0", background: "#f9f9f9",
        }}>
          <div style={{ fontSize: "10px", color: "#555" }}>💚 {t.youSaved}</div>
          <div style={{ fontWeight: "bold", fontSize: "20px" }}>Rs.{totalSavings.toFixed(2)}</div>
        </div>
      )}

      {/* Barcode */}
      <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
        <Barcode
          value={sale.sale_number}
          format="CODE128"
          width={1.2} height={40}
          fontSize={10} displayValue={true}
          background="#ffffff" lineColor="#000000"
        />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "10px", color: "#555", marginTop: "4px" }}>
        <div style={{ fontWeight: "bold", fontSize: "13px", color: "#000" }}>{t.thankYou}</div>
        <div style={{ marginTop: "2px", letterSpacing: "1px" }}>{t.poweredBy}</div>
      </div>
    </div>
  )
}