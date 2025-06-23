
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
let cart = [];

function updateCart() {
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = \`
      <span>\${item.name}</span>
      <span>x\${item.qty}</span>
      <span>Rs. \${(item.price * item.qty).toFixed(2)}</span>
      <button class="btn btn-sm btn-danger" onclick="removeItem(\${i})">🗑️</button>
    \`;
    cartItems.appendChild(row);
    total += item.price * item.qty;
  });
  total -= parseFloat(document.getElementById('discount').value || 0);
  document.getElementById('total-amount').textContent = total.toFixed(2);
}

function addManualProduct() {
  const name = document.getElementById('manual-product-name').value;
  const price = parseFloat(document.getElementById('manual-product-price').value);
  const qty = parseInt(document.getElementById('manual-product-qty').value);
  if (!name || isNaN(price) || isNaN(qty)) return alert("Fill all product fields!");
  cart.push({ name, price, qty });
  updateCart();
}

function removeItem(i) {
  cart.splice(i, 1);
  updateCart();
}

function sendWhatsAppBill() {
  const phone = document.getElementById('customer-phone').value.trim();
  if (!phone) return alert("Enter customer's WhatsApp number.");
  let msg = "*WR Smile & Supplies*\nInvoice: " + invoiceNumber + "\n";
  cart.forEach(item => {
    msg += \`\${item.name} x\${item.qty} = Rs. \${(item.qty * item.price).toFixed(2)}\n\`;
  });
  msg += "Discount: Rs. " + document.getElementById('discount').value + "\n";
  msg += "*Total: Rs. " + document.getElementById('total-amount').textContent + "*";
  window.open(\`https://wa.me/\${phone}?text=\${encodeURIComponent(msg)}\`, '_blank');
}

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
    div.textContent = \`\${item.name} x\${item.qty} = Rs. \${(item.qty * item.price).toFixed(2)}\`;
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
    doc.text(\`\${item.name} x\${item.qty} = Rs. \${(item.qty * item.price).toFixed(2)}\`, 10, y);
    y += 10;
  });
  doc.text("Discount: Rs. " + document.getElementById('discount').value, 10, y);
  y += 10;
  doc.text("Total: Rs. " + document.getElementById('total-amount').textContent, 10, y);
  doc.save(invoiceNumber + ".pdf");
}
