<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WR Smile Billing</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
  <style>
    body { background: #f8f9fa; font-family: 'Segoe UI', sans-serif; }
    .container { max-width: 900px; margin-top: 40px; }
    .cart-box { border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin-top: 20px; background: #fff; }
    #search-results { position: relative; z-index: 10; max-height: 200px; overflow-y: auto; margin-top: 5px; }
    .list-group-item { cursor: pointer; }
    .cart-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .cart-item span { flex: 1; }
    .cart-item button { margin-left: 5px; }
    @media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } }
  </style>
</head>
<body>
<div class="container">
  <div class="text-center mb-4">
    <img src="logo.png" alt="WR Smile Logo" style="max-height: 100px;" />
  </div>
  <h2 class="mb-4 text-center">🧾 WR Smile - Create Bill</h2>
  <div class="mb-3">
    <label for="invoice-number" class="form-label">Invoice Number</label>
    <input type="text" id="invoice-number" class="form-control" readonly>
  </div>
  <div class="mb-3">
    <label for="customer-name" class="form-label">Customer Name</label>
    <input type="text" id="customer-name" class="form-control" placeholder="Enter customer's name...">
  </div>
  <div class="mb-3">
    <label for="customer-phone" class="form-label">Customer WhatsApp Number</label>
    <input type="tel" id="customer-phone" class="form-control" placeholder="Ex: 94771234567">
  </div>
  <div class="mb-3">
    <label for="product-search" class="form-label">Search Product</label>
    <input type="text" id="product-search" class="form-control" placeholder="Type product name...">
    <div id="search-results" class="list-group"></div>
  </div>
  <div class="mb-3">
    <h5>➕ Add Product Manually</h5>
    <div class="row g-2">
      <div class="col-md-4">
        <input type="text" id="manual-product-name" class="form-control" placeholder="Product Name">
      </div>
      <div class="col-md-3">
        <input type="number" id="manual-product-price" class="form-control" placeholder="Price (Rs.)" step="0.01">
      </div>
      <div class="col-md-2">
        <input type="number" id="manual-product-qty" class="form-control" placeholder="Qty" min="1">
      </div>
      <div class="col-md-3">
        <button class="btn btn-secondary w-100" onclick="addManualProduct()">Add to Cart</button>
      </div>
    </div>
  </div>
  <div class="mb-3">
    <label for="discount" class="form-label">Discount (Rs.)</label>
    <input type="number" id="discount" class="form-control" value="0" min="0">
  </div>
  <div class="cart-box">
    <h5>Cart:</h5>
    <div id="cart-items"></div>
    <h5 class="mt-3">Total: Rs. <span id="total-amount">0.00</span></h5>
    <button class="btn btn-success mt-3" onclick="sendWhatsAppBill()">📲 Send Bill via WhatsApp</button>
    <button class="btn btn-outline-primary mt-3 ms-2" onclick="printReceipt()">🖨️ Print Receipt</button>
    <button class="btn btn-outline-danger mt-3 ms-2" onclick="downloadPDF()">⬇️ Export PDF</button>
  </div>
  <div class="print-area d-none">
    <div class="text-center mb-2">
      <img src="logo.png" alt="WR Smile Logo" style="max-height: 80px;" />
    </div>
    <h4 class="text-center">WR Smile & Supplies</h4>
    <p class="text-center">411/7, Kandy Road, Mollipothana, Tel: 076-495-0844</p>
    <p class="text-center">Invoice No: <span id="print-invoice"></span></p>
    <hr>
    <p><strong>Customer:</strong> <span id="print-customer-name"></span></p>
    <p><strong>Phone:</strong> <span id="print-customer-phone"></span></p>
    <div id="print-items"></div>
    <hr>
    <p><strong>Discount:</strong> Rs. <span id="print-discount"></span></p>
    <p><strong>Total:</strong> Rs. <span id="print-total"></span></p>
    <p class="text-end">Printed on: <span id="print-date"></span></p>
  </div>
</div>
<script>
  const firebaseConfig = {
    apiKey: "AIzaSyACehOi7n-dbdN00D4tJr2kD_-AVR6S-Vo",
    authDomain: "wr-smile-shop.firebaseapp.com",
    projectId: "wr-smile-shop",
    storageBucket: "wr-smile-shop.appspot.com",
    messagingSenderId: "299864260187",
    appId: "1:299864260187:web:fa6af65ef95674aff1097e"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  let invoiceNumber = 'INV-' + Date.now();
  document.getElementById('invoice-number').value = invoiceNumber;

  function printReceipt() {
    document.querySelector('.print-area').classList.remove('d-none');
    document.getElementById('print-customer-name').textContent = document.getElementById('customer-name').value;
    document.getElementById('print-customer-phone').textContent = document.getElementById('customer-phone').value;
    document.getElementById('print-discount').textContent = document.getElementById('discount').value;
    document.getElementById('print-total').textContent = document.getElementById('total-amount').textContent;
    document.getElementById('print-date').textContent = new Date().toLocaleString();
    document.getElementById('print-invoice').textContent = invoiceNumber;

    const printItems = document.getElementById('print-items');
    printItems.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.textContent = `${item.name} x${item.qty} = Rs. ${(item.qty * item.price).toFixed(2)}`;
      printItems.appendChild(div);
    });

    db.ref('bills/' + invoiceNumber).set({
      invoice: invoiceNumber,
      customer: document.getElementById('customer-name').value,
      phone: document.getElementById('customer-phone').value,
      discount: parseFloat(document.getElementById('discount').value),
      total: parseFloat(document.getElementById('total-amount').textContent),
      items: cart,
      date: new Date().toISOString()
    });

    window.print();
    document.querySelector('.print-area').classList.add('d-none');
  }

  function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("WR Smile & Supplies", 10, 10);
    doc.text("Invoice: " + invoiceNumber, 10, 20);
    doc.text("Customer: " + document.getElementById('customer-name').value, 10, 30);
    doc.text("Phone: " + document.getElementById('customer-phone').value, 10, 40);
    let y = 50;
    cart.forEach(item => {
      doc.text(`${item.name} x${item.qty} = Rs. ${(item.qty * item.price).toFixed(2)}`, 10, y);
      y += 10;
    });
    doc.text("Discount: Rs. " + document.getElementById('discount').value, 10, y);
    y += 10;
    doc.text("Total: Rs. " + document.getElementById('total-amount').textContent, 10, y);
    doc.save(`${invoiceNumber}.pdf`);
  }

  function sendWhatsAppBill() {
    const customerName = document.getElementById('customer-name').value || 'Customer';
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const total = document.getElementById('total-amount').textContent;
    const discount = document.getElementById('discount').value;
    const invoice = invoiceNumber;

    if (!customerPhone) {
      alert("Please enter customer's WhatsApp number.");
      return;
    }

    let message = `*WR Smile & Supplies*%0AInvoice: ${invoice}%0AName: ${customerName}%0A`;
    cart.forEach(item => {
      message += `• ${item.name} x${item.qty} = Rs.${(item.qty * item.price).toFixed(2)}%0A`;
    });
    message += `----------------------------%0ADiscount: Rs.${discount}%0ATotal: Rs.${total}%0AThank you!`;

    const whatsappURL = `https://wa.me/${customerPhone}?text=${message}`;
    window.open(whatsappURL, '_blank');
  }
</script>
</body>
</html>
