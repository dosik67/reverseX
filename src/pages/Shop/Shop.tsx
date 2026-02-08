import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import supabase from '@/lib/supabase';
import './Shop.css';

export default function Shop() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admindosik180907') {
      setAdminMode(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('❌ Неправильный пароль');
    }
  };

  return (
    <div className="shop-container">
      {/* Header */}
      <div className="shop-header">
        <div className="logo-section">
          <h1>reverseX <span className="shop-badge">SHOP</span></h1>
        </div>
        <div className="header-actions">
          {!isLoggedIn && <Button variant="outline">Вход</Button>}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdminLogin(!showAdminLogin)}
          >
            ⚙️ Admin
          </Button>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminLogin && !adminMode && (
        <div className="admin-login-modal">
          <Card className="admin-login-card">
            <h2>Вход в админ панель</h2>
            <form onSubmit={handleAdminLogin}>
              <input
                type="password"
                placeholder="Пароль"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="admin-password-input"
              />
              <Button type="submit" className="admin-submit-btn">Вход</Button>
            </form>
          </Card>
        </div>
      )}

      {/* Admin Panel */}
      {adminMode && (
        <AdminPanel onLogout={() => setAdminMode(false)} />
      )}

      {/* Shop Content */}
      {!adminMode && (
        <div className="shop-content">
          {/* Featured Product */}
          <section className="featured-product">
            <Card className="featured-card">
              <div className="featured-header">
                <h2>Мощный игровой ПК</h2>
                <span className="badge-sale">В наличии</span>
              </div>

              <div className="featured-media">
                {/* Видео */}
                <video 
                  width="100%" 
                  controls 
                  className="featured-video"
                  poster="/default-pc.jpg"
                >
                  <source src="/api/videos/gaming-pc-demo.mp4" type="video/mp4" />
                </video>
              </div>

              <div className="featured-specs">
                <h3>Характеристики:</h3>
                <ul>
                  <li><strong>GPU:</strong> RX 580 8GB</li>
                  <li><strong>CPU:</strong> Xeon E5-2670v2</li>
                  <li><strong>Платформа:</strong> X79</li>
                  <li><strong>ОЗУ:</strong> 16GB DDR3</li>
                  <li><strong>БП:</strong> 500W PC Cooler 80+</li>
                </ul>
              </div>

              <div className="price-section">
                <div className="price-display">
                  <span className="price-label">Цена от:</span>
                  <span className="price-value">₸ 150 000</span>
                </div>

                <div className="payment-options">
                  <div className="payment-badge">💳 Kaspi Рассрочка</div>
                  <div className="payment-badge">🔴 Kaspi Red</div>
                  <div className="payment-badge">🏦 Кредит</div>
                </div>
              </div>

              <Button className="configure-btn" size="lg">
                🔧 Собрать компьютер на заказ
              </Button>
            </Card>
          </section>

          {/* Available Products */}
          <section className="products-section">
            <h2>Доступные товары</h2>
            <div className="products-grid">
              <Card className="product-card">
                <div className="product-image">
                  <span className="placeholder">📦</span>
                </div>
                <h3>RX 580 8GB</h3>
                <p className="product-price">₸ 35 000</p>
                <Button variant="outline" size="sm">Добавить</Button>
              </Card>

              <Card className="product-card">
                <div className="product-image">
                  <span className="placeholder">📦</span>
                </div>
                <h3>Xeon E5-2670v2</h3>
                <p className="product-price">₸ 25 000</p>
                <Button variant="outline" size="sm">Добавить</Button>
              </Card>

              <Card className="product-card">
                <div className="product-image">
                  <span className="placeholder">📦</span>
                </div>
                <h3>16GB DDR3 RAM</h3>
                <p className="product-price">₸ 18 000</p>
                <Button variant="outline" size="sm">Добавить</Button>
              </Card>

              <Card className="product-card">
                <div className="product-image">
                  <span className="placeholder">📦</span>
                </div>
                <h3>500W PSU</h3>
                <p className="product-price">₸ 12 000</p>
                <Button variant="outline" size="sm">Добавить</Button>
              </Card>
            </div>
          </section>

          {/* Contact Section */}
          <section className="contact-section">
            <h2>Связаться с нами</h2>
            <div className="contact-methods">
              <Button variant="outline" className="contact-btn">
                📞 Позвонить
              </Button>
              <Button variant="outline" className="contact-btn">
                💬 WhatsApp
              </Button>
              <Button variant="outline" className="contact-btn">
                📧 Email
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// Admin Panel Component
function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'orders'>('calls');
  const [calls, setCalls] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    // Load calls
    const { data: callsData } = await supabase
      .from('admin_events')
      .select('*')
      .eq('type', 'phone_call')
      .order('created_at', { ascending: false });
    setCalls(callsData || []);

    // Load messages
    const { data: messagesData } = await supabase
      .from('admin_events')
      .select('*')
      .eq('type', 'whatsapp_message')
      .order('created_at', { ascending: false });
    setMessages(messagesData || []);

    // Load orders
    const { data: ordersData } = await supabase
      .from('shop_orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(ordersData || []);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>⚙️ Админ панель</h1>
        <Button variant="outline" onClick={onLogout}>Выход</Button>
      </div>

      <div className="admin-tabs">
        <Button 
          variant={activeTab === 'calls' ? 'default' : 'outline'}
          onClick={() => setActiveTab('calls')}
        >
          📞 Звонки ({calls.length})
        </Button>
        <Button 
          variant={activeTab === 'messages' ? 'default' : 'outline'}
          onClick={() => setActiveTab('messages')}
        >
          💬 Сообщения ({messages.length})
        </Button>
        <Button 
          variant={activeTab === 'orders' ? 'default' : 'outline'}
          onClick={() => setActiveTab('orders')}
        >
          📦 Заказы ({orders.length})
        </Button>
      </div>

      <div className="admin-content">
        {activeTab === 'calls' && (
          <div className="admin-list">
            <h2>Звонки</h2>
            {calls.length === 0 ? (
              <p>Нет звонков</p>
            ) : (
              calls.map((call, idx) => (
                <Card key={idx} className="admin-item">
                  <p><strong>Номер:</strong> {call.phone_number}</p>
                  <p><strong>Раз:</strong> {call.count}</p>
                  <p><strong>Время:</strong> {new Date(call.created_at).toLocaleString()}</p>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="admin-list">
            <h2>WhatsApp сообщения</h2>
            {messages.length === 0 ? (
              <p>Нет сообщений</p>
            ) : (
              messages.map((msg, idx) => (
                <Card key={idx} className="admin-item">
                  <p><strong>Номер:</strong> {msg.phone_number}</p>
                  <p><strong>Раз:</strong> {msg.count}</p>
                  <p><strong>Время:</strong> {new Date(msg.created_at).toLocaleString()}</p>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="admin-list">
            <h2>Заказы</h2>
            {orders.length === 0 ? (
              <p>Нет заказов</p>
            ) : (
              orders.map((order, idx) => (
                <Card key={idx} className="admin-item">
                  <p><strong>ID:</strong> {order.id}</p>
                  <p><strong>Сумма:</strong> ₸{order.total_price}</p>
                  <p><strong>Статус:</strong> {order.status}</p>
                  <p><strong>Дата:</strong> {new Date(order.created_at).toLocaleString()}</p>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
