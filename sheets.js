export async function appendOrderToSheet(order, totalOrders) {
  const webhook = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK;

  if (!webhook) {
    return {
      synced: false,
      reason: 'GOOGLE_APPS_SCRIPT_WEBHOOK is not configured. Order stored locally only.'
    };
  }

  const payload = {
    orderId: order.id,
    orderCount: totalOrders,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    products: order.products,
    createdAt: order.createdAt
  };

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return { synced: false, reason: `Apps Script webhook failed (${response.status}).` };
    }

    return { synced: true };
  } catch (error) {
    return { synced: false, reason: error.message };
  }
}
