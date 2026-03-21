import express from 'express';
import { 
  userController, 
  materialController, 
  productController 
} from '../controllers/mainControllers.js';
import { 
  recipeController, 
  customerController, 
  productionController, 
  movementController, 
  saleController,
  saleItemController
} from '../controllers/additionalControllers.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Users
router.get('/users', userController.getAll);
router.get('/users/:id', userController.getById);
router.post('/users/login', userController.login);
router.put('/users/:id', userController.update);
router.patch('/users/:id', userController.update);

// Raw Materials
router.get('/raw-materials', materialController.getAll);
router.get('/raw-materials/:id', materialController.getById);
router.post('/raw-materials', materialController.create);
router.put('/raw-materials/:id', materialController.update);
router.patch('/raw-materials/:id', materialController.patch);
router.delete('/raw-materials/:id', materialController.delete);

// Products
router.get('/products', productController.getAll);
router.get('/products/:id', productController.getById);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.patch('/products/:id', productController.patch);
router.delete('/products/:id', productController.delete);

// Recipes
router.get('/recipes', recipeController.getAll);
router.post('/recipes', recipeController.create);
router.delete('/recipes/:id', recipeController.delete);

// Customers
router.get('/customers', customerController.getAll);
router.post('/customers', customerController.create);
router.put('/customers/:id', customerController.update);
router.patch('/customers/:id', customerController.patch);
router.delete('/customers/:id', customerController.delete);

// Production
router.get('/production', productionController.getAll);
router.post('/production', productionController.create);
router.delete('/production/:id', productionController.delete);

// Stock Movements
router.get('/stock-movements', movementController.getAll);
router.post('/stock-movements', movementController.create);

// Sales
router.get('/sales', saleController.getAll);
router.post('/sales', saleController.create);
router.delete('/sales/:id', saleController.delete);

// Sale Items
router.get('/sale-items', saleItemController.getAll);
router.post('/sale-items', saleItemController.create);
router.delete('/sale-items/:id', saleItemController.delete);

export default router;
