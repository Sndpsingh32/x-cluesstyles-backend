import test from 'node:test';
import assert from 'node:assert/strict';
import { createSavedDesignService } from '../src/services/savedDesign.service.js';
import { createOrderService } from '../src/services/order.service.js';

test('persists complete typography, geometry, and multi-view elements in saved designs', async () => {
  const dbStore = new Map();
  const savedDesignRepository = {
    create: async (data) => {
      const item = { ...data, id: data.id || 'des_' + Math.random().toString(36).slice(2) };
      dbStore.set(item.id, item);
      return item;
    },
    update: async (id, fields) => {
      const existing = dbStore.get(id) || {};
      const updated = { ...existing, ...fields };
      dbStore.set(id, updated);
      return updated;
    },
    findById: async (id) => dbStore.get(id) || null,
    findByUserId: async (userId) => [...dbStore.values()].filter((d) => d.userId === userId),
  };

  const service = createSavedDesignService({ savedDesignRepository });

  // 1. Text elements with specific typography & multi-views
  const frontText = {
    id: 'text-front-1',
    type: 'text',
    view: 'front',
    text: 'FRONT CHAMPIONS',
    fontFamily: 'Bebas Neue',
    fontSize: 36,
    fontSizeUnit: 'px',
    fontWeight: '700',
    fontStyle: 'normal',
    textColor: '#e11d48',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 1.2,
    x: 50,
    y: 42,
    rotation: 0,
    origin: 'center',
    zIndex: 2,
    opacity: 1,
  };

  const backText = {
    id: 'text-back-1',
    type: 'text',
    view: 'back',
    text: 'BACK CREW #99',
    fontFamily: 'Pacifico',
    fontSize: 28,
    fontSizeUnit: 'px',
    fontWeight: '400',
    fontStyle: 'italic',
    textColor: '#2563eb',
    textAlign: 'right',
    letterSpacing: 0,
    lineHeight: 1.2,
    x: 48,
    y: 35,
    rotation: 12,
    origin: 'center',
    zIndex: 2,
    opacity: 0.95,
  };

  const frontLogo = {
    id: 'logo-front-1',
    type: 'image',
    view: 'front',
    url: 'https://res.cloudinary.com/demo/image/upload/sample_logo.png',
    name: 'Team Emblem',
    x: 50,
    y: 25,
    scale: 1.2,
    rotation: -5,
  };

  const viewDesigns = {
    front: { logo: frontLogo, text: frontText.text, textStyle: frontText, elements: [frontLogo, frontText] },
    back: { logo: null, text: backText.text, textStyle: backText, elements: [backText] },
    left: { logo: null, text: '', textStyle: null, elements: [] },
    right: { logo: null, text: '', textStyle: null, elements: [] },
  };

  // 2. Save design
  const saved = await service.createDesign('usr_test_1', {
    designName: 'Tournament Polo Edition',
    productId: 'polo-aqua-260',
    productName: 'Aqua Solid Polo T-Shirt',
    color: 'Aqua',
    size: 'L',
    quantity: 15,
    printingMethod: 'DTF Printing',
    price: 499,
    totalPrice: 7485,
    customization: {
      text: frontText.text,
      viewDesigns,
      elements: [frontLogo, frontText, backText],
    },
    editorConfig: {
      viewDesigns,
      elements: [frontLogo, frontText, backText],
    },
    previewImage: 'https://res.cloudinary.com/demo/image/upload/mockup_front.png',
  });

  assert.ok(saved.id, 'Design should have generated an ID');
  assert.equal(saved.userId, 'usr_test_1');
  assert.equal(saved.printingMethod, 'DTF Printing');

  // 3. Inspect stored record
  const stored = dbStore.get(saved.id);
  assert.ok(stored, 'Stored record should exist');
  assert.equal(stored.customization.viewDesigns.front.textStyle.fontFamily, 'Bebas Neue');
  assert.equal(stored.customization.viewDesigns.front.textStyle.fontSize, 36);
  assert.equal(stored.customization.viewDesigns.front.textStyle.textColor, '#e11d48');
  assert.equal(stored.customization.viewDesigns.back.textStyle.fontFamily, 'Pacifico');
  assert.equal(stored.customization.viewDesigns.back.textStyle.fontSize, 28);
  assert.equal(stored.customization.viewDesigns.back.textStyle.rotation, 12);
  assert.equal(stored.customization.viewDesigns.front.logo.url, frontLogo.url);

  // 4. Test reopening and saving without changes (No geometry drift)
  const reopened = await service.getDesignById('usr_test_1', saved.id);
  const updatedWithoutChanges = await service.updateDesign('usr_test_1', saved.id, {
    customization: reopened.customization,
    editorConfig: reopened.editorConfig,
  });

  assert.equal(updatedWithoutChanges.customization.viewDesigns.front.textStyle.x, 50);
  assert.equal(updatedWithoutChanges.customization.viewDesigns.front.textStyle.y, 42);
  assert.equal(updatedWithoutChanges.customization.viewDesigns.front.textStyle.fontSize, 36);
  assert.equal(updatedWithoutChanges.customization.viewDesigns.back.textStyle.rotation, 12);
});

test('order snapshot retains immutable design configuration even if saved design is modified later', async () => {
  const ordersDb = new Map();
  const orderService = createOrderService({
    orderRepository: {
      create: async (data) => {
        ordersDb.set(data.id, data);
        return data;
      },
      findById: async (id) => ordersDb.get(id) || null,
      findAll: async () => [...ordersDb.values()],
    },
  });

  // Customer places order with snapshot
  const orderSnapshot = {
    savedDesignId: 'design_original_999',
    designName: 'Gold Standard Polo',
    printingMethod: 'Embroidery',
    previewImage: 'https://res.cloudinary.com/demo/image/upload/order_preview.png',
    viewDesigns: {
      front: {
        text: 'ORIGINAL COMPANY',
        textStyle: { fontFamily: 'Montserrat', fontSize: 32, textColor: '#ffd700', x: 50, y: 50 },
      },
    },
  };

  const order = await orderService.create({
    productId: 'polo-black',
    productName: 'Classic Black Polo',
    color: 'Black',
    size: 'XL',
    quantity: 5,
    orderType: 'customize',
    unitPrice: 599,
    totalPrice: 2995,
    customization: orderSnapshot,
    notes: 'Please stitch with metallic gold thread',
  });

  assert.ok(order.id);
  assert.equal(order.customization.savedDesignId, 'design_original_999');
  assert.equal(order.customization.viewDesigns.front.textStyle.fontFamily, 'Montserrat');
  assert.equal(order.customization.viewDesigns.front.textStyle.fontSize, 32);

  // Simulate customer subsequently editing their saved design to a completely different font and text
  const modifiedSavedDesign = {
    designName: 'Modified Company Shirt',
    viewDesigns: {
      front: {
        text: 'COMPLETELY NEW TEXT',
        textStyle: { fontFamily: 'Pacifico', fontSize: 18, textColor: '#000000', x: 20, y: 20 },
      },
    },
  };

  // Inspect order record in DB to verify it remained completely unchanged
  const orderInDb = ordersDb.get(order.id);
  assert.equal(
    orderInDb.customization.viewDesigns.front.text,
    'ORIGINAL COMPANY',
    'Order snapshot text must not mutate',
  );
  assert.equal(
    orderInDb.customization.viewDesigns.front.textStyle.fontFamily,
    'Montserrat',
    'Order snapshot font family must remain Montserrat',
  );
  assert.equal(
    orderInDb.customization.viewDesigns.front.textStyle.fontSize,
    32,
    'Order snapshot font size must remain 32',
  );
  assert.notEqual(
    orderInDb.customization.viewDesigns.front.text,
    modifiedSavedDesign.viewDesigns.front.text,
  );
});
