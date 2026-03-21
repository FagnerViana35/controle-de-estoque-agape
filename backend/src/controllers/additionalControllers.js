import db from '../db/knex.js';
import { applyQueryParams } from '../utils/queryParams.js';

export const recipeController = {
  getAll: async (req, res) => {
    try {
      const recipes = await db('recipes').select('*');
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [recipe] = await db('recipes').insert(req.body).returning('*');
      res.status(201).json(recipe);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  patch: async (req, res) => {
    try {
      const [recipe] = await db('recipes')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await db('recipes').where({ id: req.params.id }).del();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const customerController = {
  getAll: async (req, res) => {
    try {
      const customers = await applyQueryParams(db('customers').select('*'), req);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [customer] = await db('customers').insert(req.body).returning('*');
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const [customer] = await db('customers')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  patch: async (req, res) => {
    try {
      const [customer] = await db('customers')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await db('customers').where({ id: req.params.id }).del();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const productionController = {
  getAll: async (req, res) => {
    try {
      const production = await applyQueryParams(db('production').select('*'), req);
      res.json(production);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [prod] = await db('production').insert(req.body).returning('*');
      res.status(201).json(prod);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const movementController = {
  getAll: async (req, res) => {
    try {
      const movements = await applyQueryParams(db('stock_movements').select('*'), req);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [mov] = await db('stock_movements').insert(req.body).returning('*');
      res.status(201).json(mov);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const saleController = {
  getAll: async (req, res) => {
    try {
      const sales = await applyQueryParams(db('sales').select('*'), req);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [sale] = await db('sales').insert(req.body).returning('*');
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await db('sales').where({ id: req.params.id }).del();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const saleItemController = {
  getAll: async (req, res) => {
    try {
      const items = await db('sale_items').select('*');
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [item] = await db('sale_items').insert(req.body).returning('*');
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await db('sale_items').where({ id: req.params.id }).del();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};