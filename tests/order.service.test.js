import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderService } from '../src/services/order.service.js';

test('creates an order with normalize payload and customization', async () => {
  const saved = [];
  const service = createOrderService({
    orderRepository: {
      create: async (input) => {
        saved.push(input);
        return { ...input, id: 'ord_123' };
      },
      findAll: async () => [],
      findById: async () => null,
    },
  });

  const created = await service.create({
    productId: 'prod_1',
    productName: 'Polo T-Shirt',
    color: 'Black',
    size: 'M',
    quantity: 2,
    orderType: 'customize',
    customization: {
      text: 'XCLUES',
      position: 'Front',
      placement: 'Chest',
    },
  });

  assert.equal(created.productName, 'Polo T-Shirt');
  assert.equal(created.orderType, 'customize');
  assert.equal(created.quantity, 2);
  assert.equal(saved[0].orderType, 'customize');
  assert.deepEqual(saved[0].customization, {
    text: 'XCLUES',
    position: 'Front',
    placement: 'Chest',
  });
});
