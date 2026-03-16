import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    product_id: '',
    quantity: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, prodRes, saleRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get('/sales?_sort=-sale_date')
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
      setSales(saleRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const addToCart = () => {
    if (!currentProduct.product_id) return alert('Selecione um produto.');
    const product = products.find(p => p.id === currentProduct.product_id);
    
    if (product.stock_quantity < currentProduct.quantity) {
      return alert(`Estoque insuficiente. Disponível: ${product.stock_quantity}`);
    }

    const existingItem = cart.find(item => item.product_id === currentProduct.product_id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === currentProduct.product_id 
          ? { ...item, quantity: item.quantity + currentProduct.quantity }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...currentProduct, 
        name: product.name, 
        price: product.price 
      }]);
    }
    setCurrentProduct({ product_id: '', quantity: 1 });
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return alert('Selecione um cliente.');
    if (cart.length === 0) return alert('O carrinho está vazio.');

    try {
      const saleId = String(Date.now());
      
      // 1. Criar a venda
      await api.post('/sales', {
        id: saleId,
        customer_id: selectedCustomer,
        sale_date: new Date().toISOString(),
        total_value: totalValue
      });

      // 2. Processar cada item
      for (const item of cart) {
        // Registrar item da venda
        await api.post('/sale-items', {
          id: String(Date.now() + Math.random()),
          sale_id: saleId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        });

        // Baixar estoque do produto
        const product = products.find(p => p.id === item.product_id);
        await api.patch(`/products/${item.product_id}`, {
          stock_quantity: product.stock_quantity - item.quantity
        });

        // Registrar movimentação de estoque
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'venda',
          product_id: item.product_id,
          quantity: -item.quantity,
          date: new Date().toISOString()
        });
      }

      alert('Venda realizada com sucesso!');
      setCart([]);
      setSelectedCustomer('');
      fetchData();
    } catch (error) {
      console.error('Erro ao realizar venda:', error);
      alert('Erro ao processar venda.');
    }
  };

  const deleteSale = async (saleId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta venda? O estoque dos produtos será estornado.')) {
      return;
    }

    try {
      // 1. Buscar os itens da venda para estornar o estoque
      const itemsRes = await api.get('/sale-items');
      const saleItems = itemsRes.data.filter(item => String(item.sale_id) === String(saleId));

      // 2. Estornar o estoque de cada produto
      for (const item of saleItems) {
        const prodRes = await api.get(`/products/${item.product_id}`);
        const currentStock = Number(prodRes.data.stock_quantity);
        const itemQty = Number(item.quantity);

        await api.patch(`/products/${item.product_id}`, {
          stock_quantity: currentStock + itemQty
        });

        // Registrar movimentação de estorno
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'estorno venda (exclusão)',
          product_id: item.product_id,
          quantity: itemQty,
          date: new Date().toISOString()
        });

        // Deletar o item da venda
        await api.delete(`/sale-items/${item.id}`);
      }

      // 3. Deletar a venda
      await api.delete(`/sales/${saleId}`);

      alert('Venda excluída e estoque estornado com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      alert('Erro ao excluir venda.');
    }
  };

  const getCustomerName = (id) => {
    const c = customers.find(cust => cust.id === id);
    return c ? c.name : 'Desconhecido';
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <h2>Nova Venda</h2>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Cliente</label>
          <select 
            value={selectedCustomer} 
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Selecione um cliente...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3>Adicionar Produtos</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Produto</label>
              <select 
                value={currentProduct.product_id} 
                onChange={(e) => setCurrentProduct({...currentProduct, product_id: e.target.value})}
              >
                <option value="">Selecione...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)}) - Estoque: {p.stock_quantity}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Qtd</label>
              <input 
                type="number" 
                value={currentProduct.quantity} 
                onChange={(e) => setCurrentProduct({...currentProduct, quantity: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <button className="btn btn-success" onClick={addToCart} style={{ height: '40px' }}>
              <Plus size={18} /> Add
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>Itens no Carrinho</h4>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Qtd</th>
                  <th>Subtotal</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>R$ {item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>R$ {(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-danger" onClick={() => removeFromCart(index)} style={{ padding: '5px' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3" style={{ textAlign: 'right' }}>Total:</th>
                  <th colSpan="2">R$ {totalValue.toFixed(2)}</th>
                </tr>
              </tfoot>
            </table>
            <button 
              className="btn btn-primary" 
              onClick={handleSale} 
              style={{ marginTop: '20px', width: '100%' }}
            >
              <ShoppingCart size={18} /> Finalizar Venda
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Histórico de Vendas</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.sale_date).toLocaleString()}</td>
                  <td>{getCustomerName(s.customer_id)}</td>
                  <td>R$ {s.total_value.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => deleteSale(s.id)} style={{ padding: '5px' }}>
                      <Trash2 size={16} /> Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
