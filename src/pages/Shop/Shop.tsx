import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Phone, MessageCircle, Mail } from 'lucide-react';
import './Shop.css';

export default function Shop() {
  const [cart, setCart] = useState(0);

  const handleAddToCart = () => {
    setCart(cart + 1);
    alert(`✅ Добавлено в корзину! (${cart + 1} товаров)`);
  };

  const handlePhoneCall = () => {
    window.location.href = 'tel:+77771234567';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/77771234567', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:shop@reversex.kz';
  };

  const handleOrder = () => {
    alert('📦 Оформление заказа\n\nСкоро функция заказа будет доступна!');
  };

  return (
    <div className="shop-page">
      <div className="shop-wrapper">
        {/* Header */}
        <div className="shop-header-section">
          <h1 className="gradient-text">🛒 reverseX SHOP</h1>
          <p className="shop-subtitle">Мощные игровые ПК</p>
        </div>

        {/* Main Product */}
        <div className="product-section">
          <div className="product-card">
            {/* Images */}
            <div className="product-images">
              <img 
                src="/video-for my success market/IMG_20260208_033311.jpg.jpeg"
                alt="Gaming PC 1"
                className="product-image main-image"
              />
              <div className="product-thumbnails">
                <img 
                  src="/video-for my success market/IMG_20260208_033311.jpg.jpeg"
                  alt="thumb1"
                  className="thumbnail"
                />
                <img 
                  src="/video-for my success market/IMG_20260208_033600.jpg.jpeg"
                  alt="thumb2"
                  className="thumbnail"
                />
                <img 
                  src="/video-for my success market/unnamed (1).jpg"
                  alt="thumb3"
                  className="thumbnail"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="product-info">
              <div className="product-header">
                <h2>RX 580 Gaming PC</h2>
                <span className="badge-in-stock">✓ В наличии</span>
              </div>

              <div className="product-price-section">
                <span className="price-label">Цена:</span>
                <span className="price">₸ 150,000</span>
              </div>

              <div className="specs-container">
                <h3>Характеристики:</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-name">GPU</span>
                    <span className="spec-value">RX 580 8GB</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">CPU</span>
                    <span className="spec-value">Xeon E5-2670v2</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">Платформа</span>
                    <span className="spec-value">X79</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">ОЗУ</span>
                    <span className="spec-value">16GB DDR3</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">БП</span>
                    <span className="spec-value">500W PC Cooler</span>
                  </div>
                </div>
              </div>

              <div className="payment-methods">
                <h3>Способы оплаты:</h3>
                <div className="payment-badges">
                  <span className="payment-badge">💳 Kaspi Рассрочка</span>
                  <span className="payment-badge">🔴 Kaspi Red</span>
                  <span className="payment-badge">🏦 Кредит</span>
                </div>
              </div>

              <div className="actions">
                <Button 
                  size="lg"
                  onClick={handleAddToCart}
                  className="btn-add-cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Добавить в корзину ({cart})
                </Button>
                <Button 
                  size="lg"
                  onClick={handleOrder}
                  className="btn-order"
                >
                  🛍️ Заказать
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2>📞 Свяжись с нами</h2>
          <p className="contact-subtitle">Вопросы? Мы здесь, чтобы помочь!</p>
          
          <div className="contact-grid">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handlePhoneCall}
              className="contact-btn"
            >
              <Phone className="w-5 h-5" />
              <span>Позвонить</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleWhatsApp}
              className="contact-btn"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleEmail}
              className="contact-btn"
            >
              <Mail className="w-5 h-5" />
              <span>Email</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
