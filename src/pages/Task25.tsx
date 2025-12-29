import React from "react";
import { Link } from "react-router-dom";

const Task25: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-100 text-center py-5 bg-gray-100 border-b border-gray-300">
        <Link to="/tasks/20" className="mx-4 text-gray-900 font-medium hover:text-gray-600 hover:border-b-2 hover:border-gray-900">
          Тапсырма 20
        </Link>
        <span className="mx-2">|</span>
        <Link to="/tasks/21" className="mx-4 text-gray-900 font-medium hover:text-gray-600 hover:border-b-2 hover:border-gray-900">
          Тапсырма 21
        </Link>
        <span className="mx-2">|</span>
        <Link to="/tasks/22" className="mx-4 text-gray-900 font-medium hover:text-gray-600 hover:border-b-2 hover:border-gray-900">
          Тапсырма 22
        </Link>
        <span className="mx-2">|</span>
        <Link to="/tasks/23" className="mx-4 text-gray-900 font-medium hover:text-gray-600 hover:border-b-2 hover:border-gray-900">
          Тапсырма 23
        </Link>
        <span className="mx-2">|</span>
        <Link to="/tasks/24" className="mx-4 text-gray-900 font-medium hover:text-gray-600 hover:border-b-2 hover:border-gray-900">
          Тапсырма 24
        </Link>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-5 py-10">
        <h1 className="text-4xl font-bold mb-2 text-black">Тапсырма 24. «Сәйкестендір»</h1>
        <h2 className="text-xl text-gray-600 mb-12 font-medium uppercase tracking-wide">
          5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
        </h2>

        {/* Purpose Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-4 text-black">📌 Мақсаты:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>мәтін бөліктерін логикалық байланыстыру;</li>
            <li>себеп–салдар, шарт–нәтиже байланысын түсіну.</li>
          </ul>
        </div>

        {/* Examples Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">📝 Мысалдар:</h3>
          <div className="bg-gray-200 p-6 rounded border border-gray-400">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-400">
              <div className="flex-1 italic text-gray-700">«Жазда күн ыстық…»</div>
              <div className="font-bold text-gray-600">→</div>
              <div className="flex-1 text-gray-700">«Сондықтан балалар суға шомылады»</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 italic text-gray-700">«Бала күнде кітап оқыды…»</div>
              <div className="font-bold text-gray-600">→</div>
              <div className="flex-1 text-gray-700">«Сол себепті оның тілі дамыды»</div>
            </div>
          </div>
        </div>

        {/* Process Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">📖 Өткізу барысы:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700 mb-8">
            <li>Мұғалім сол жақ бағанға бастапқы сөйлемдерді, оң жақ бағанға жалғасын жазады.</li>
            <li>Оқушылар дұрыс жұпты сызықпен қосады және дауыстап оқып береді.</li>
          </ul>

          {/* Matching Task */}
          <div className="my-8 p-6 bg-gray-200 border border-gray-400 rounded">
            <strong className="block text-black text-lg mb-4">🔗 Қайсысын қайсысына сәйкестендіру керек?</strong>
            <p className="text-gray-700 mt-3">
              Сол бағанда сөйлемдердің басталуы, оң бағанда оның аяқталуы орналасады. Оқушылар логикалық байланысты табып, сызықпен қосады.
            </p>
          </div>
        </div>

        {/* Expected Results Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">✅ Күтілетін нәтиже:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>сөйлемдер арасындағы логикалық байланысты сезінеді;</li>
            <li>мәтінді тұтастай түсіну дағдысы дамиды.</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 px-5 mt-16 border-t border-gray-300 bg-gray-100 text-gray-600">
        5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ © 2025
      </footer>
    </div>
  );
};

export default Task25;
