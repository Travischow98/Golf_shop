const productContainer = document.getElementById('products');
const orderForm = document.getElementById('orderForm');
const result = document.getElementById('result');
const orderCount = document.getElementById('orderCount');
const bagCount = document.getElementById('bagCount');

function getSelectedProductIds() {
  return Array.from(document.querySelectorAll('input[name="products"]:checked')).map((element) => element.value);
}

function refreshBagCount() {
  bagCount.textContent = String(getSelectedProductIds().length);
}

async function loadProducts() {
  const response = await fetch('/api/products');
  const { products } = await response.json();

  productContainer.innerHTML = products
    .map((product) => `
      <article class="card">
        <h3>${product.name}</h3>
        <p class="price">$${product.price}</p>
        <div class="product-meta">
          <span>Pick item</span>
          <input class="add-toggle" type="checkbox" name="products" value="${product.id}" />
        </div>
      </article>
    `)
    .join('');

  document.querySelectorAll('input[name="products"]').forEach((checkbox) => {
    checkbox.addEventListener('change', refreshBagCount);
  });
}

async function refreshSummary() {
  const response = await fetch('/api/orders/summary');
  const summary = await response.json();
  orderCount.textContent = `Orders: ${summary.totalOrders}`;
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(orderForm);
  const payload = {
    customerName: formData.get('customerName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    products: getSelectedProductIds()
  };

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    result.textContent = data.error;
    return;
  }

  result.textContent = `${data.message} #${data.totalOrders}`;
  orderForm.reset();
  document.querySelectorAll('input[name="products"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  refreshBagCount();
  await refreshSummary();
});

loadProducts();
refreshSummary();
