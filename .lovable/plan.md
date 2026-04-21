

## সমস্যা

Customer যদি Udhari তে **extra টাকা** দেয় (যেমন ₹500 udhari ছিল, দিল ₹700 → ₹200 advance), তখন সেটা negative amount হিসেবে save হয়। কিন্তু পরে যখন সেই customer **নতুন product নেয়** (Billing page থেকে), তখন advance balance থেকে automatically minus হয় না।

## Current System (যা আছে)

- ✅ `payUdhari` already extra payment handle করে → entry এর `amount` negative হয়ে advance হিসেবে থাকে
- ✅ `addUdhari` negative amount support করে (নতুন udhari থেকে advance বাদ যায়)
- ❌ **Cash/UPI bill এ advance auto-deduct নাই** — শুধু udhari mode এ merge হয়

## সমাধান Plan

### 1. Billing page এ "Customer Select" feature যোগ করা

যখন user **যেকোনো payment mode** (cash/UPI/mixed/udhari) select করবে, একটা optional "Existing Customer" picker দেখাবে যেখানে advance থাকা customer-দের list আসবে (negative amount entries)।

```text
Payment Section
├─ Customer name input (existing)
├─ [NEW] "Use advance balance?" toggle
│   └─ If ON: dropdown of customers with advance
│       Shows: "Rahim — ₹200 advance available"
└─ Adjusted total preview:
    Bill: ₹500
    Advance used: -₹200
    To pay: ₹300
```

### 2. Auto-deduct logic

User customer select করলে:
- Bill total থেকে advance amount বাদ যাবে (যতটুকু advance আছে অথবা যতটুকু bill, যেটা ছোট)
- Final payable = bill_total − advance_used
- Udhari entry update হবে: `amount += advance_used` (negative + positive = closer to 0 or positive remaining udhari)
- যদি advance > bill → বাকি advance customer এর entry তে থাকবে
- যদি advance = bill exactly → entry "Paid Off" এ চলে যাবে
- যদি bill > advance এবং mode = udhari → বাকিটা new udhari হবে same entry তে

### 3. Bill record এ track রাখা

CompletedBill এ নতুন optional field:
- `advanceUsed?: number` — কত advance ব্যবহার হয়েছে
- `advanceCustomerId?: string` — কোন customer এর

যাতে bill slip এ দেখাতে পারি: "Advance applied: ₹200"

### 4. Udhari page এ advance display improve

Negative amount entries এর জন্য green badge: **"₹200 Advance"** (এখন শুধু minus number দেখায়)। Total Pending calculation থেকে advance বাদ যাবে অথবা separately দেখাবে।

## Files to Modify

```text
1. src/pages/Billing.tsx
   - Add "Use Customer Advance" UI section
   - Customer picker (only customers with negative amount)
   - Show adjusted total
   - On pay: call payUdhari/addUdhari with advance_used
   - Save advanceUsed in bill

2. src/lib/store.tsx
   - Extend CompletedBill type: advanceUsed, advanceCustomerId
   - New helper: applyAdvanceToBill(customerId, billAmount)
     → returns { advanceUsed, remainingBill }
     → updates udhari entry amount

3. src/pages/Udhari.tsx
   - Show "Advance" badge for negative amount entries
   - Total Pending excludes advance amounts
   - New summary card: "Total Advance Held: ₹X"

4. Bill slip HTML (in Billing.tsx generateBillSlipHTML)
   - If advanceUsed > 0, show line: "Advance Applied: -₹X"
```

## User Flow Example

```text
Rahim's Udhari: -₹200 (advance)

New Bill: 
  Items total = ₹500
  
At payment:
  ☑ Use customer advance
  Select: Rahim (₹200 advance)
  
Display:
  Bill total:      ₹500
  Advance used:   −₹200
  ─────────────────────
  Payable now:     ₹300
  
[Pay Cash] → Bill saved with advanceUsed=200
            → Rahim's udhari amount: -200 + 200 = 0 → Paid Off
```

## Edge Cases Handled

- Advance > Bill amount → partial use, rest stays as advance
- Multiple customers with advance → user picks one
- Mixed payment mode → advance applied first, rest split between cash/upi
- Udhari mode + advance → advance reduces new udhari amount

