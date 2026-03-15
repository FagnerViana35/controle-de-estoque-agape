import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Edit, Trash2, Save, X } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock_quantity' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/products/${editingId}`, {
          ...formData,
          updated_at: new Date().toISOString()
        });
      } else {
        await api.post('/products', {
          ...formData,
          id: String(Date.now()),
          created_at: new Date().toISOString()
        });
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity
    });
    setEditingId(product.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, stock_quantity: 0 });
    setIsEditing(false);
    setEditingId(null);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <h2>{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Nome do Produto</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
            />
          </div>
          <div className="form-group">
            <label>Preço de Venda (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              name="price" 
              value={formData.price} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Quantidade em Estoque</label>
            <input 
              type="number" 
              name="stock_quantity" 
              value={formData.stock_quantity} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> {isEditing ? 'Atualizar' : 'Salvar'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-warning" onClick={resetForm}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Lista de Produtos</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Valor Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.description}</td>
                <td>R$ {product.price.toFixed(2)}</td>
                <td>{product.stock_quantity}</td>
                <td>R$ {(product.stock_quantity * product.price).toFixed(2)}</td>
                <td>
                  <button className="btn btn-warning" onClick={() => handleEdit(product)} style={{ marginRight: '5px', padding: '5px' }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(product.id)} style={{ padding: '5px' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
