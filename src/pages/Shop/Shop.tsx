import { useState } from 'react';
import { Button } from '@/components/ui/button';
import './Shop.css';

interface Computer {
  id: number;
  name: string;
  price: number;
  image: string;
  specs: {
    gpu: string;
    cpu: string;
    motherboard: string;
    ram: string;
    psu: string;
  };
  paymentOptions?: string[];
}

export default function Shop() {
  const [computers] = useState<Computer[]>([
    {
      id: 1,
      name: 'Gaming PC Premium',
      price: 150000,
      image: '/video-for my success market/IMG_20260208_033311.jpg.jpeg',
      specs: {
        gpu: 'RX 580 8GB',
        cpu: 'Xeon E5-2670 v2',
        motherboard: 'X79',
        ram: '16GB DDR3',
        psu: '500W PC Cooler',
      },
      paymentOptions: ['Kaspi Installment', 'Kaspi Red', 'Credit'],
    },
    {
      id: 2,
      name: 'Gaming PC Pro',
      price: 180000,
      image: '/video-for my success market/IMG_20260208_033600.jpg.jpeg',
      specs: {
        gpu: 'GTX 1660 6GB',
        cpu: 'Ryzen 5 3600',
        motherboard: 'B450',
        ram: '16GB DDR4',
        psu: '650W Gold',
      },
      paymentOptions: ['Kaspi Installment', 'Kaspi Red', 'Credit'],
    },
    {
      id: 3,
      name: 'Workstation PC',
      price: 220000,
      image: '/video-for my success market/unnamed (1).jpg',
      specs: {
        gpu: 'RTX 3060 12GB',
        cpu: 'Xeon W-2235',
        motherboard: 'W480 ProRS',
        ram: '32GB DDR4',
        psu: '750W Platinum',
      },
      paymentOptions: ['Kaspi Installment', 'Kaspi Red', 'Credit'],
    },
  ]);

  return (
    <div className="shop-container">
      {/* Header */}
      <div className="shop-header">
        <div className="logo-section">
          <h1>reverseX <span className="shop-badge">SHOP</span></h1>
        </div>
      </div>

      {/* Shop Content */}
      <div className="shop-content">
        {/* Featured Product */}
        <section className="featured-product">
          <div className="featured-card">
            <div className="featured-header">
              <h2>🎮 Мощный игровой ПК</h2>
              <span className="badge-sale">✓ В наличии</span>
            </div>

            <div className="featured-layout">
              <div className="featured-media">
                <img 
                  src={computers[0].image} 
                  alt={computers[0].name}
                  className="featured-image"
                />
              </div>

              <div className="featured-info">
                <div className="featured-specs">
                  <h3>Характеристики:</h3>
                  <ul>
                    <li><strong>GPU:</strong> {computers[0].specs.gpu}</li>
                    <li><strong>CPU:</strong> {computers[0].specs.cpu}</li>
                    <li><strong>Платформа:</strong> {computers[0].specs.motherboard}</li>
                    <li><strong>ОЗУ:</strong> {computers[0].specs.ram}</li>
                    <li><strong>БП:</strong> {computers[0].specs.psu}</li>
                  </ul>
                </div>

                <div className="price-section">
                  <div className="price-display">
                    <span className="price-label">Цена:</span>
                    <span className="price-value">₸ {computers[0].price.toLocaleString()}</span>
                  </div>

                  <div className="payment-options">
                    <div className="payment-badge">💳 Kaspi Рассрочка</div>
                    <div className="payment-badge">🔴 Kaspi Red</div>
                    <div className="payment-badge">🏦 Кредит</div>
                  </div>
                </div>

                <Button className="configure-btn" size="lg">
                  🛒 Заказать сейчас
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* All Products Grid */}
        <section className="products-section">
          <h2>📦 Все комплектации</h2>
          <div className="products-showcase">
            {computers.map((computer, idx) => (
              <div key={computer.id} className={`product-showcase ${idx % 2 === 0 ? 'image-left' : 'image-right'}`}>
                <div className="product-showcase-image">
                  <img 
                    src={computer.image} 
                    alt={computer.name}
                    className="showcase-image"
                  />
                </div>

                <div className="product-showcase-content">
                  <div className="product-showcase-header">
                    <h3>{computer.name}</h3>
                    <span className="badge-in-stock">✓ В наличии</span>
                  </div>

                  <div className="specs-list">
                    <h4>Характеристики:</h4>
                    <ul>
                      <li><span className="spec-label">GPU:</span> <span>{computer.specs.gpu}</span></li>
                      <li><span className="spec-label">CPU:</span> <span>{computer.specs.cpu}</span></li>
                      <li><span className="spec-label">Платформа:</span> <span>{computer.specs.motherboard}</span></li>
                      <li><span className="spec-label">ОЗУ:</span> <span>{computer.specs.ram}</span></li>
                      <li><span className="spec-label">БП:</span> <span>{computer.specs.psu}</span></li>
                    </ul>
                  </div>

                  <div className="product-showcase-footer">
                    <div className="price">
                      <span className="label">Цена:</span>
                      <span className="amount">₸ {computer.price.toLocaleString()}</span>
                    </div>
                    
                    <div className="payment-methods">
                      <span className="method">💳 Рассрочка</span>
                      <span className="method">🔴 Kaspi Red</span>
                      <span className="method">🏦 Кредит</span>
                    </div>

                    <Button className="order-btn" size="lg">
                      🛒 Заказать
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <h2>📞 Связаться с нами</h2>
          <div className="contact-methods">
            <Button variant="outline" className="contact-btn">
              📞 +7 (777) 123-45-67
            </Button>
            <Button variant="outline" className="contact-btn">
              💬 WhatsApp
            </Button>
            <Button variant="outline" className="contact-btn">
              📧 shop@reversex.kz
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
