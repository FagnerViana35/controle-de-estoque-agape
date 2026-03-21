import db from '../db/knex.js';
import { applyQueryParams } from '../utils/queryParams.js';

export const userController = {
  getAll: async (req, res) => {
    try {
      let query = db('users').select('*');
      if (req.query.username) {
        query = query.where({ username: req.query.username });
      }
      const users = await query;
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const user = await db('users').where({ id: req.params.id }).first();
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await db('users').where({ username, password }).first();
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      await db('users').where({ id: req.params.id }).update(req.body);
      const updatedUser = await db('users').where({ id: req.params.id }).first();
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  patch: async (req, res) => {
    try {
      const [user] = await db('users')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const materialController = {
  getAll: async (req, res) => {
    try {
      const materials = await applyQueryParams(db('raw_materials').select('*'), req);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [material] = await db('raw_materials').insert(req.body).returning('*');
      res.status(201).json(material);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const [material] = await db('raw_materials')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  patch: async (req, res) => {
    try {
      const [material] = await db('raw_materials')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await db('raw_materials').where({ id: req.params.id }).del();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export const productController = {
  getAll: async (req, res) => {
    try {
      const products = await applyQueryParams(db('products').select('*'), req);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const product = await db('products').where({ id: req.params.id }).first();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const [product] = await db('products').insert(req.body).returning('*');
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const [product] = await db('products')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  patch: async (req, res) => {
    try {
      const [product] = await db('products')
        .where({ id: req.params.id })
        .update(req.body)
        .returning('*');
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await db('products').where({ id: req.params.id }).del();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};