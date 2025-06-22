let stockCount = 1;
const stockTableBody = document.getElementById("stock-table-body");
const stockCountDisplay = document.getElementById("stock-count");
const cartItems = document.getElementById("cart-items");
const totalAmount = document.getElementById("total-amount");
const receiptItems = document.getElementById("receipt-items");
const receiptTotal = document.getElementById("receipt-total");
const receiptDate = document.getElementById("receipt-date");

let cartTotal = 0;

function updateStockCount() {
  stockCountDisplay.textContent = stockTableBody.children.length;
}

function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById("productName").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const stock = parseInt(document.getElementById("productStock").value);

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${stockTableBody.children.length + 1}</td>
    <td>${name}</td>
    <td>Rs. ${price.toFixed(2)}</td>
    <td>${stock}</td>
    <td>
      <button class="btn btn-sm btn-warning">Edit</button>
      <button class="btn btn-sm btn-danger" onclick="this.closest('tr').remove(); updateStockCount();">Delete</button>
    </td>
  `;
  stockTableBody.appendChild(row);
  updateStockCount();
  bootstrap.Modal.getInstance(document.getElementById("addProductModal")).hide();
}

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

function generateReceipt() {
  receiptItems.innerHTML = cartItems.innerHTML;
  receiptTotal.textContent = 'Rs. ' + cartTotal.toFixed(2);
  receiptDate.textContent = new Date().toLocaleString();
  new bootstrap.Modal(document.getElementById("receiptModal")).show();
}

// Initial count
updateStockCount();