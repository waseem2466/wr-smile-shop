async function generateReport(startDate, endDate) {
  const snapshot = await firebase.database().ref('sales').once('value');
  const sales = [];
  snapshot.forEach(child => {
    const sale = child.val();
    const saleDate = new Date(sale.date);
    if (saleDate >= startDate && saleDate <= endDate) {
      sales.push(sale);
    }
  });

  let totalSales = 0;
  let totalCost = 0;

  sales.forEach(sale => {
    sale.items.forEach(item => {
      totalSales += item.price * item.qty;
      totalCost += item.costPrice * item.qty;
    });
  });

  const profit = totalSales - totalCost;

  console.log(`Report from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  console.log(`Total Sales: Rs. ${totalSales.toFixed(2)}`);
  console.log(`Total Cost: Rs. ${totalCost.toFixed(2)}`);
  console.log(`Profit: Rs. ${profit.toFixed(2)}`);

  return { totalSales, totalCost, profit };
}

// Example usage:
// let now = new Date();
// let weekAgo = new Date();
// weekAgo.setDate(now.getDate() - 7);
// generateReport(weekAgo, now);
