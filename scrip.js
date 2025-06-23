// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'; 
import { getDatabase, ref, onValue, push, remove, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js'; 

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyACehOi7n-dbdN00D4tJr2kD_-AVR6S-Vo",
  authDomain: "wr-smile-shop.firebaseapp.com",
  projectId: "wr-smile-shop",
  storageBucket: "wr-smile-shop.firebasestorage.app",
  messagingSenderId: "299864260187",
  appId: "1:299864260187:web:fa6af65ef95674aff1097e",
  measurementId: "G-3Z38G6MCYJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Reference to products
const productsRef = ref(db, 'products');

let cartTotal = 0;

// Load products from Firebase Realtime DB
onValue(productsRef, (snapshot) => {
  const products = [];
  snapshot.forEach((childSnapshot) => {
    products.push({ id: childSnapshot.key, ...childSnapshot.val() });
  });

  renderProducts(products);
});

// Add product
window.addProduct = function(e) {
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
};

// Delete product
window.deleteProduct = function(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  remove(ref(db, 'products/' + id));
};

// Sell product (update stock + add to bill)
window.sellProduct = function(productId, cell) {
  const quantity = 1;
  const productRef = ref(db, 'products/' + productId);

  onValue(productRef, (snapshot) => {
    const product = snapshot.val();
    if (!product) return;

    if (product.stock >= quantity) {
      const newStock = product.stock - quantity;
      update(productRef, { stock: newStock });

      // Add to cart
      const li = document.createElement("li");
      li.textContent = `${product.name} x${quantity} - Rs. ${product.price * quantity}`;
      document.getElementById("cart-items").appendChild(li);

      cartTotal += product.price * quantity;
      document.getElementById("total-amount").textContent = cartTotal.toFixed(2);
    } else {
      alert(`Only ${product.stock} in stock for ${product.name}`);
    }
  }, { onlyOnce: true });
};

// Generate receipt
window.generateReceipt = function () {
  const cartList = document.getElementById("cart-items");
  const receiptItems = document.getElementById("receipt-items");
  receiptItems.innerHTML = "";

  for (let i = 0; i < cartList.children.length; i++) {
    const item = cartList.children[i];
    const div = document.createElement("div");
    div.className = "receipt-item";
    div.innerHTML = item.outerHTML || item.textContent;
    receiptItems.appendChild(div);
  }

  document.getElementById("receipt-total").textContent = 'Rs. ' + cartTotal.toFixed(2);
  document.getElementById("receipt-date").textContent = new Date().toLocaleString();

  cartTotal = 0;
  cartList.innerHTML = "";
  document.getElementById("total-amount").textContent = "0";

  new bootstrap.Modal(document.getElementById("receiptModal")).show();
};

// Render products in table
function renderProducts(products) {
  const tbody = document.getElementById("stock-table-body");
  tbody.innerHTML = "";

  products.forEach((p) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.id}</td>
      <td><a href="#" onclick="sellProduct('${p.id}', this)">${p.name}</a></td>
      <td>Rs. ${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("stock-count").textContent = products.length;
}