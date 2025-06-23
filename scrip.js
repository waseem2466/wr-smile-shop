// Firebase reference (must be defined globally)
let db = null;
let useFirebase = false;

// Initialize Firebase or fallback to localStorage
function initDatabase() {
  if (typeof firebase !== "undefined" && firebase?.app) {
    db = firebase.database();
    useFirebase = true;
    loadProductsFromFirebase();
  } else {
    loadProductsFromLocalStorage();
  }
}

// Load from Firebase
function loadProductsFromFirebase() {
  db.ref('products').on('value', (snapshot) => {
    stockTableBody.innerHTML = "";
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const product = childSnapshot.val();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${key}</td>
        <td>${product.name}</td>
        <td>Rs. ${product.price.toFixed(2)}</td>
        <td>${product.stock}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${key}')">Delete</button>
        </td>
      `;
      stockTableBody.appendChild(row);
    });
    updateStockCount();
  });
}

// Load from localStorage
function loadProductsFromLocalStorage() {
  const saved = localStorage.getItem("products");
  if (saved) {
    products = JSON.parse(saved);
    renderProducts();
  }
}

// Add Product
function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const product = { id: Date.now(), name, price, stock };

  if (useFirebase) {
    db.ref('products').push(product)
      .then(() => {
        alert("Product added successfully!");
        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productStock").value = "";
        loadProductsFromFirebase();
      })
      .catch((error) => {
        alert("Error adding product: " + error.message);
      });
  } else {
    products.push(product);
    localStorage.setItem("products", JSON.stringify(products));
    renderProducts();
  }

  bootstrap.Modal.getInstance(document.getElementById("addProductModal")).hide();
}

// Render Products (localStorage version)
let products = [];
function renderProducts() {
  stockTableBody.innerHTML = "";
  products.forEach((p, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${p.name}</td>
      <td>Rs. ${p.price.toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
      </td>
    `;
    stockTableBody.appendChild(row);
  });
  updateStockCount();
}

// Delete Product
function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  if (useFirebase) {
    db.ref('products').child(id).remove()
      .then(() => {
        alert("Product deleted");
        loadProductsFromFirebase();
      })
      .catch((error) => {
        alert("Error deleting product: " + error.message);
      });
  } else {
    products = products.filter(p => p.id !== id);
    localStorage.setItem("products", JSON.stringify(products));
    renderProducts();
  }
}

// Cart logic
let cartTotal = 0;
const stockTableBody = document.getElementById("stock-table-body");
const stockCountDisplay = document.getElementById("stock-count");
const cartItems = document.getElementById("cart-items");
const totalAmount = document.getElementById("total-amount");
const receiptItems = document.getElementById("receipt-items");
const receiptTotal = document.getElementById("receipt-total");
const receiptDate = document.getElementById("receipt-date");

document.getElementById("product-search").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    const productName = this.value.trim();
    if (!productName) return;

    const li = document.createElement("li");
    const itemPrice = (Math.random() * 100 + 50).toFixed(2); // dummy price
    li.textContent = `${productName} - Rs. ${itemPrice}`;
    cartItems.appendChild(li);

    cartTotal += parseFloat(itemPrice);
    totalAmount.textContent = cartTotal.toFixed(2);

    this.value = "";
  }
});

// Generate Receipt
function generateReceipt() {
  if (cartItems.children.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  receiptItems.innerHTML = "";
  for (let i = 0; i < cartItems.children.length; i++) {
    const item = cartItems.children[i];
    const div = document.createElement("div");
    div.className = "receipt-item";
    const [name, price] = item.textContent.split(" - ");
    div.innerHTML = `<span>${name}</span><span>${price}</span>`;
    receiptItems.appendChild(div);
  }

  receiptTotal.textContent = 'Rs. ' + cartTotal.toFixed(2);
  receiptDate.textContent = new Date().toLocaleString();

  cartTotal = 0;
  cartItems.innerHTML = "";
  totalAmount.textContent = "0";

  new bootstrap.Modal(document.getElementById("receiptModal")).show();
}

// Update stock count
function updateStockCount() {
  stockCountDisplay.textContent = stockTableBody.children.length;
}

// Init on page load
window.onload = () => {
  initDatabase();
};