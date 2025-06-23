// Firebase v8 SDK
if (typeof firebase === "undefined") {
  const firebaseScript = document.createElement("script");
  firebaseScript.src = "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"; 
  document.head.appendChild(firebaseScript);

  const databaseScript = document.createElement("script");
  databaseScript.src = "https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"; 
  document.head.appendChild(databaseScript);
}

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "wr-smile-shop.firebaseapp.com",
  projectId: "wr-smile-shop",
  storageBucket: "wr-smile-shop.appspot.com",
  messagingSenderId: "299864260187",
  appId: "1:299864260187:web:fa6af65ef95674aff1097e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let cartTotal = 0;
let currentBillNumber = 1;

// Theme Toggle
document.getElementById("themeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("bg-dark");
  document.body.classList.toggle("text-white");
});

// Load last bill number
db.ref('receipts').on("value", snapshot => {
  const receipts = [];
  snapshot.forEach(child => receipts.push(child.val()));
  if (receipts.length > 0) currentBillNumber = receipts.length + 1;
}, err => console.error(err));

// Load products
function loadProducts(callback) {
  db.ref('products').on("value", snapshot => {
    const products = [];
    snapshot.forEach(child => {
      products.push({ id: child.key, ...child.val() });
    });
    callback(products);
  }, err => console.error(err));
}

// Add product
function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("Please fill all fields correctly.");
    return;
  }

  db.ref('products').push({ name, price, stock }).then(() => {
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";
    bootstrap.Modal.getInstance(document.getElementById("addProductModal")).hide();
  });
}

// Delete product
function deleteProduct(id) {
  if (confirm("Are you sure?")) {
    db.ref('products').child(id).remove();
  }
}

// Sell product
function sellProduct(productId) {
  const cartItems = document.getElementById("cart-items");
  const totalAmount = document.getElementById("total-amount");

  db.ref('products').child(productId).once("value", snapshot => {
    const product = snapshot.val();
    const quantity = 1;

    if (product.stock >= quantity) {
      const newStock = product.stock - quantity;
      db.ref('products').child(productId).update({ stock: newStock });

      const li = document.createElement("li");
      li.textContent = `${product.name} x${quantity} - Rs. ${product.price}`;
      cartItems.appendChild(li);

      cartTotal += product.price;
      totalAmount.textContent = cartTotal.toFixed(2);
    } else {
      alert(`Only ${product.stock} in stock for ${product.name}`);
    }
  });
}

// Generate receipt
function generateReceipt() {
  const cartList = document.getElementById("cart-items");
  const receiptItems = document.getElementById("receipt-items");
  const receiptDate = document.getElementById("receipt-date");
  const receiptTotal = document.getElementById("receipt-total");

  receiptItems.innerHTML = "";
  let grandTotal = 0;

  for (let i = 0; i < cartList.children.length; i++) {
    const item = cartList.children[i];
    const div = document.createElement("div");
    div.className = "receipt-item";
    div.innerHTML = item.outerHTML || item.textContent;
    receiptItems.appendChild(div);

    const match = item.textContent.match(/Rs\. ([\d\.]+)/);
    if (match) grandTotal += parseFloat(match[1]);
  }

  const date = new Date().toLocaleString();
  receiptDate.textContent = date;
  receiptTotal.textContent = 'Rs. ' + grandTotal.toFixed(2);

  // Save receipt
  const receiptData = {
    billNo: `INV-${String(currentBillNumber).padStart(3, '0')}`,
    items: Array.from(cartList.children).map(li => li.textContent),
    total: grandTotal,
    date: date
  };

  db.ref('receipts').push(receiptData).then(() => {
    alert("Receipt saved!");
    cartTotal = 0;
    cartList.innerHTML = "";
    totalAmount.textContent = "0";
    currentBillNumber++;
  });
}

// Export monthly report
function exportMonthlyReport() {
  const ws_data = [];

  db.ref('receipts').once("value", snap => {
    const receipts = [];
    snap.forEach(child => receipts.push(child.val()));

    const salesByMonth = {};

    receipts.forEach(r => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!salesByMonth[monthKey]) salesByMonth[monthKey] = 0;
      salesByMonth[monthKey] += r.total;
    });

    const ws = XLSX.utils.aoa_to_sheet([["Month", "Total"]].concat(
      Object.entries(salesByMonth).map(([m, t]) => [m, t])
    ));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Sales");
    XLSX.writeFile(wb, "monthly_sales_report.xlsx");
  });
}

// Load products
if (document.getElementById("stock-table-body")) {
  loadProducts(products => {
    document.getElementById("stock-table-body").innerHTML = "";
    products.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.id}</td>
        <td><a href="#" onclick="sellProduct('${p.id}')">${p.name}</a></td>
        <td>Rs. ${p.price.toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      `;
      document.getElementById("stock-table-body").appendChild(row);
    });
  });
}

// Load monthly report
if (document.getElementById("monthly-report-table")) {
  db.ref('receipts').on("value", snap => {
    const tbody = document.getElementById("monthly-report-table").querySelector("tbody");
    const salesByMonth = {};

    snap.forEach(child => {
      const r = child.val();
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!salesByMonth[monthKey]) salesByMonth[monthKey] = 0;
      salesByMonth[monthKey] += r.total;
    });

    tbody.innerHTML = "";
    Object.entries(salesByMonth).forEach(([month, amount]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${month}</td><td>Rs. ${amount.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
  });
}

// WhatsApp send receipt
function sendReceiptViaWhatsApp() {
  const cartList = document.getElementById("cart-items");
  let msg = "*WR Smile and Supplies*\n\n";
  msg += "411/7, Kandy Road, Mollipothana\n";
  msg += "Tel: 076-495-0844\n\n";
  msg += "🧾 Bill Summary:\n";

  let grandTotal = 0;

  for (let i = 0; i < cartList.children.length; i++) {
    const itemText = cartList.children[i].textContent;
    msg += `- ${itemText}\n`;

    const match = itemText.match(/Rs\. ([\d\.]+)/);
    if (match) grandTotal += parseFloat(match[1]);
  }

  msg += `\n💰 Total: Rs. ${grandTotal.toFixed(2)}\n`;
  msg += "Thank you for shopping with us!";

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// Show WhatsApp messages
if (document.getElementById("whatsapp-messages")) {
  const inbox = document.getElementById("whatsapp-messages");
  db.ref('whatsapp_messages').on("value", snap => {
    inbox.innerHTML = "";
    snap.forEach(child => {
      const msg = child.val();
      const div = document.createElement("div");
      div.className = "list-group-item mb-2 p-2";
      div.innerHTML = `<strong>${msg.from}</strong><br/>${msg.text}<br/><small>${msg.timestamp}</small>`;
      inbox.appendChild(div);
    });
  });
}

// Hide loader
window.onload = () => {
  document.getElementById("page-loader")?.remove();
};