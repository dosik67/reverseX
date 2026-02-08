import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Phone, MessageCircle, Mail, ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  specs: {
    gpu: string;
    cpu: string;
    motherboard: string;
    ram: string;
    psu: string;
  };
  images: string[];
  description?: string;
}

const products: Record<number, Product> = {
  1: {
    id: 1,
    name: 'RX 580 Gaming PC',
    price: 90000,
    specs: {
      gpu: 'RX 580 8GB',
      cpu: 'Xeon E5-2670v2',
      motherboard: 'X79',
      ram: '16GB DDR3',
      psu: '500W PC Cooler',
    },
    images: [
      '/video-for my success market/IMG_20260208_033311.jpg.jpeg',
      '/video-for my success market/IMG_20260208_033600.jpg.jpeg',
      '/video-for my success market/unnamed (1).jpg',
    ],
    description: 'Мощный игровой компьютер для современных игр и приложений',
  },
};

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState(0);
  const [mainImage, setMainImage] = useState(0);

  const productId = parseInt(id || '1');
  const product = products[productId];

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
        <Button onClick={() => navigate('/shop')}>Вернуться в магазин</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    setCart(cart + 1);
    alert(`✅ Добавлено в корзину! (${cart + 1} товаров)`);
  };

  const handlePhoneCall = () => {
    window.location.href = 'tel:+87752570646';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/87752570646', '_blank');
  };

  const handleEmail = () => {
    window.location.href = 'mailto:shop@reversex.kz';
  };

  const handleOrder = () => {
    alert('📦 Оформление заказа\n\nСкоро функция заказа будет доступна!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => navigate('/shop')}
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в магазин
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images Section */}
        <div className="flex flex-col gap-4">
          {/* Main Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
            <img
              src={product.images[mainImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setMainImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    mainImage === index
                      ? 'border-primary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground mb-2">{product.description}</p>
            )}
            <div className="inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold">
              ✓ В наличии
            </div>
          </div>

          {/* Price */}
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground mb-2">Цена:</p>
            <p className="text-4xl font-bold gradient-text">₸ {product.price.toLocaleString()}</p>
          </div>

          {/* Specs */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Характеристики:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">GPU</p>
                <p className="font-semibold">{product.specs.gpu}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="font-semibold">{product.specs.cpu}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Платформа</p>
                <p className="font-semibold">{product.specs.motherboard}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">ОЗУ</p>
                <p className="font-semibold">{product.specs.ram}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <p className="text-sm text-muted-foreground">БП</p>
                <p className="font-semibold">{product.specs.psu}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Способы оплаты:</h3>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 bg-accent/10 rounded-lg text-sm font-medium">
                💳 Kaspi Рассрочка
              </div>
              <div className="px-3 py-2 bg-accent/10 rounded-lg text-sm font-medium">
                🔴 Kaspi Red
              </div>
              <div className="px-3 py-2 bg-accent/10 rounded-lg text-sm font-medium">
                🏦 Кредит
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Добавить в корзину ({cart})
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full font-bold"
              onClick={handleOrder}
            >
              🛍️ Заказать сейчас
            </Button>
          </div>

          {/* Contact Section */}
          <div className="bg-card border border-border rounded-lg p-6 pt-4">
            <h3 className="text-lg font-semibold mb-4">📞 Свяжись с нами</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePhoneCall}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Phone className="w-5 h-5" />
                <span className="text-xs">Позвонить</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Mail className="w-5 h-5" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
