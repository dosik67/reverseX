import React from 'react';

const ProfileCard: React.FC = () => {
  return (
    <html lang="ru">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Мой профиль</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@500&display=swap" rel="stylesheet" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            background: #000;
            color: #fff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            font-family: 'Inter', sans-serif;
          }
          
          .container {
            max-width: 700px;
            width: 100%;
            background: #111;
            border: 1px solid #444;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(255, 255, 255, 0.15);
          }
          
          .profile-section {
            text-align: center;
            padding: 50px 25px;
            background: linear-gradient(180deg, #222, #111);
            border-bottom: 1px solid #555;
          }
          
          .profile-img {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            margin-bottom: 20px;
            border: 4px solid #fff;
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.25);
            opacity: 0;
            transform: scale(0.8);
            animation: fadeInScale 0.8s ease forwards;
          }
          
          .profile-name {
            font-family: 'Poppins', sans-serif;
            font-size: 34px;
            font-weight: 500;
            margin-bottom: 12px;
            opacity: 0;
            transform: translateY(25px);
            animation: slideIn 0.8s ease 0.2s forwards;
          }
          
          .profile-bio {
            font-family: 'Inter', sans-serif;
            font-size: 18px;
            color: #ddd;
            opacity: 0;
            transform: translateY(25px);
            animation: slideIn 0.8s ease 0.4s forwards;
            line-height: 1.6;
            padding: 0 25px;
          }
          
          .links-section {
            padding: 25px;
          }
          
          .link-button {
            display: flex;
            align-items: center;
            background: linear-gradient(90deg, #333, #222);
            color: #fff;
            text-decoration: none;
            padding: 18px 20px;
            margin: 12px 0;
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 20px;
            border: 1px solid #555;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(-20px);
            box-shadow: 0 3px 12px rgba(255, 255, 255, 0.15);
          }
          
          .link-button:hover {
            background: linear-gradient(90deg, #fff, #eee);
            color: #000;
            border-color: #fff;
            transform: translateX(5px) scale(1.03);
            box-shadow: 0 6px 20px rgba(255, 255, 255, 0.35);
          }
          
          .link-button img {
            width: 28px;
            height: 28px;
            margin-right: 12px;
            filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
            transition: transform 0.3s ease;
          }
          
          .link-button:hover img {
            transform: scale(1.15);
          }
          
          @keyframes fadeInScale {
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes slideIn {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 480px) {
            .container {
              margin: 10px;
              border-radius: 16px;
            }
            .profile-section {
              padding: 30px 15px;
            }
            .profile-img {
              width: 100px;
              height: 100px;
              border-width: 3px;
            }
            .profile-name {
              font-size: 28px;
            }
            .profile-bio {
              font-size: 16px;
              padding: 0 15px;
            }
            .links-section {
              padding: 15px;
            }
            .link-button {
              padding: 14px 16px;
              font-size: 18px;
              margin: 10px 0;
            }
            .link-button img {
              width: 28px;
              height: 28px;
              margin-right: 10px;
            }
          }
          
          @media (max-width: 360px) {
            .profile-img {
              width: 80px;
              height: 80px;
            }
            .profile-name {
              font-size: 24px;
            }
            .profile-bio {
              font-size: 14px;
            }
            .link-button {
              font-size: 16px;
              padding: 12px 14px;
            }
            .link-button img {
              width: 28px;
              height: 28px;
            }
          }
        `}</style>
      </head>

      <body>
        <div className="container">
          <div className="profile-section">
            <img src="https://diservice.kz/image.jpg" alt="Profile" className="profile-img" />
            <div className="profile-name">dosikedit</div>
            <div className="profile-bio">Креатор, разработчик, исследователь. Связывайтесь</div>
          </div>
          <div className="links-section">
            <a href="https://t.me/dosikedit" target="_blank" rel="noopener noreferrer" className="link-button">
              <img src="https://diservice.kz/artage-io-thumb-e93a7e18a8ece5e144c0e949eb147cf1.png" alt="Telegram" /> Telegram
            </a>
            <a href="mailto:trabajzandos@gmail.com" className="link-button">
              <img src="https://diservice.kz/gmail-png-icon-12.jpg" alt="Email" /> Email
            </a>
            <a href="https://instagram.com/dosikte" target="_blank" rel="noopener noreferrer" className="link-button">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Instagram_simple_icon.svg/120px-Instagram_simple_icon.svg.png" alt="Instagram" /> Instagram
            </a>
            <a href="https://github.com/dosik67" target="_blank" rel="noopener noreferrer" className="link-button">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/120px-GitHub_Invertocat_Logo.svg.png" alt="GitHub" /> GitHub
            </a>
            <a href="https://wa.me/+87752570646" target="_blank" rel="noopener noreferrer" className="link-button">
              <img src="https://img.icons8.com/ios7/600/whatsapp.png" alt="WhatsApp" /> WhatsApp
            </a>
          </div>
        </div>

        <script>{`
          document.addEventListener('DOMContentLoaded', () => {
            const buttons = document.querySelectorAll('.link-button');
            buttons.forEach((button, index) => {
              setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'translateX(0)';
              }, 600 + index * 100);
            });
          });
        `}</script>
      </body>
    </html>
  );
};

export default ProfileCard;
