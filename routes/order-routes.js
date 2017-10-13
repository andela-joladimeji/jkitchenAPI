const orderController = require('../controllers/order')

module.exports = (app) => {
  app.route('/api/v1/users/:userId([0-9]+)/orders')
    .post(orderController.create)
    .get(orderController.listOrderByUser);
  app.route('/api/v1/users/:userId([0-9]+)/admin/orders/pendingOrders')
    .get(orderController.listPendingOrders);
  app.route('/api/v1/users/:userId([0-9]+)/admin/orders/unassignedOrders')
    .get(orderController.listUnassignedOrders);
  app.route('/api/v1/users/:userId([0-9]+)/admin/orders/listAll')
    .get(orderController.listAll);
  app.route('/api/v1/users/:userId([0-9]+)/orders/:orderId([0-9]+)')
    .get(orderController.getOne)
    .put(orderController.update)
    .delete(orderController.destroy);
}


