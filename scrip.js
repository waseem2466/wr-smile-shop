// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'; 
import {
  getDatabase, ref, onValue, push, update, remove
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js'; 
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js'; 

const firebaseConfig = {
  apiKey: "AIzaSyACehOi7n-dbdN00D4tJr2kD_-AVR6S-Vo",
  authDomain: "wr-smile-shop.firebaseapp.com",
  projectId: "wr-smile-shop",
  storageBucket: "wr-smile-shop.appspot.com",
  messagingSenderId: "299864260187",
  appId: "1:299864260187:web:fa6af65ef95674aff1097e",
  databaseURL: "https://wr-smile-shop-default-rtdb.firebaseio.com/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let cartTotal = 0;
let currentBillNumber = 1;

const productsRef = ref(db, 'products');
const receiptsRef = ref(db, 'receipts');

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("page-loader")?.remove();

  // Load last bill number
  onValue(receiptsRef, snap => {
    const receipts = [];
    snap.forEach(child => receipts.push(child.val()));
    if (receipts.length > 0) currentBillNumber = receipts.length + 1;
  }, { onlyOnce: true });

  // Theme toggle
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
    document.querySelectorAll(".card").forEach(c => c.classList.toggle("bg-dark"));
    document.querySelectorAll(".card").forEach(c => c.classList.toggle("text-white"));
  });
});

// Load products
export function loadProducts(callback) {
  onValue(productsRef, (snapshot) => {
    const products = [];
    snapshot.forEach(childSnapshot => {
      products.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
    callback(products);
  });
}

// Add product
export function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const newProduct = { name, price, stock };
  push(productsRef, newProduct).then(() => {
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";
    bootstrap.Modal.getInstance(document.getElementById("addProductModal")).hide();
  });
}

// Delete product
export function deleteProduct(id) {
  if (!confirm("Are you sure?")) return;
  remove(ref(db, 'products/' + id));
}

// Sell product
export function sellProduct(productId) {
  const productRef = ref(db, 'products/' + productId);
  const cartItems = document.getElementById("cart-items");
  const totalAmount = document.getElementById("total-amount");

  onValue(productRef, (snapshot) => {
    const product = snapshot.val();
    if (!product) return;

    const quantity = 1;
    if (product.stock >= quantity) {
      const newStock = product.stock - quantity;
      update(productRef, { stock: newStock });

      const li = document.createElement("li");
      li.textContent = `${product.name} x${quantity} - Rs. ${product.price * quantity}`;
      cartItems.appendChild(li);

      cartTotal += product.price * quantity;
      totalAmount.textContent = cartTotal.toFixed(2);
    } else {
      alert(`Only ${product.stock} in stock for ${product.name}`);
    }
  }, { onlyOnce: true });
}

// Generate receipt
export async function generateReceipt() {
  const cartList = document.getElementById("cart-items");
  const receiptItems = document.getElementById("receipt-items");
  const receiptDate = document.getElementById("receipt-date");
  const receiptTotal = document.getElementById("receipt-total");

  receiptItems.innerHTML = "";
  let grandTotal = 0;

  for (let i = 0; i < cartList.children.length; i++) {
    const itemText = cartList.children[i].textContent;
    const div = document.createElement("div");
    div.className = "receipt-item";
    const [name, price] = itemText.split(" - ");
    div.innerHTML = `<span>${name}</span><span>${price}</span>`;
    receiptItems.appendChild(div);

    const match = price.match(/Rs\. ([\d\.]+)/);
    if (match) grandTotal += parseFloat(match[1]);
  }

  receiptDate.textContent = new Date().toLocaleString();
  receiptTotal.textContent = 'Rs. ' + grandTotal.toFixed(2);
  new bootstrap.Modal(document.getElementById("receiptModal")).show();

  // Save receipt
  const receiptData = {
    billNo: `INV-${String(currentBillNumber).padStart(3, '0')}`,
    items: Array.from(cartList.children).map(li => li.textContent),
    total: grandTotal,
    date: new Date().toISOString()
  };

  push(receiptsRef, receiptData).then(() => {
    currentBillNumber++;
    cartList.innerHTML = "";
    totalAmount.textContent = "0";
  });
}

// Export monthly sales to Excel
export function exportMonthlyReport() {
  const { utils, writeFile } = XLSX;
  onValue(receiptsRef, snap => {
    const receipts = [];
    snap.forEach(child => receipts.push(child.val()));

    const ws = utils.json_to_sheet(receipts.map(r => ({
      "Bill No": r.billNo,
      "Date": new Date(r.date).toLocaleString(),
      "Total": r.total.toFixed(2)
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Monthly Sales");
    writeFile(wb, "monthly_sales_report.xlsx");
  }, { onlyOnce: true });
}

// Render products
export function renderProducts(products) {
  const tbody = document.getElementById("stock-table-body");
  tbody.innerHTML = "";

  products.forEach((p) => {
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
    tbody.appendChild(row);
  });

  document.getElementById("report-total-products").textContent = products.length;
}

if (document.getElementById("stock-table-body")) {
  loadProducts(renderProducts);
}

if (document.getElementById("monthly-report-table")) {
  loadMonthlyReport();
}

function loadMonthlyReport() {
  const tbody = document.getElementById("monthly-report-table").querySelector("tbody");
  const salesByMonth = {};

  onValue(receiptsRef, snap => {
    const receipts = [];
    snap.forEach(child => receipts.push(child.val()));

    receipts.forEach(r => {
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

// WhatsApp messages
const instanceId = "YOUR_INSTANCE_ID";
const instanceToken = "YOUR_INSTANCE_TOKEN";

async function fetchWhatsAppMessages() {
  const response = await fetch(`https://api.greenapi.com/waInstance${instanceId}/receiveNotification/${instanceToken}`,  {
    method: "GET"
  });

  const data = await response.json();

  if (data && data.senderName && data.textMessage) {
    const msgData = {
      from: data.senderName,
      number: data.senderData.phoneNumber,
      text: data.textMessage,
      timestamp: new Date().toLocaleString()
    };

    push(ref(db, 'whatsapp_messages'), msgData);
  }

  setTimeout(fetchWhatsAppMessages, 5000);
}

if (document.getElementById("whatsapp-messages")) {
  const inbox = document.getElementById("whatsapp-messages");
  onValue(ref(db, 'whatsapp_messages'), snap => {
    inbox.innerHTML = "";
    const messages = [];
    snap.forEach(child => messages.push(child.val()));
    messages.reverse().forEach(msg => {
      const div = document.createElement("div");
      div.className = "list-group-item mb-2 p-2";
      div.innerHTML = `
        <strong>${msg.from}</strong><br/>
        ${msg.text}<br/>
        <small class="text-muted">${msg.timestamp}</small>
      `;
      inbox.appendChild(div);
    });
  });
}