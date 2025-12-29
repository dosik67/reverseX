import React from "react";
import { Link } from "react-router-dom";

const Task21: React.FC = () => {
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
        <h1 className="text-4xl font-bold mb-2 text-black">Тапсырма 21. «Жарнама мәтіні»</h1>
        <h2 className="text-xl text-gray-600 mb-12 font-medium uppercase tracking-wide">
          5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
        </h2>

        {/* Purpose Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-4 text-black">📌 Мақсаты:</h3>
          <p className="text-gray-700 leading-relaxed">
            <strong>қысқа ақпараттық мәтіннен маңызды мәліметті бөліп алу.</strong>
          </p>
        </div>

        {/* Process Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">📖 Өткізу барысы:</h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Мұғалім қысқа жарнама немесе хабарландыру мәтінін береді (мысалы, «Кітап көрмесі», «Спорттық жарыс» туралы).
          </p>

          <p className="font-bold text-black mb-6 text-lg">Оқушылар жарнамадан 4 ақпаратты табады:</p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-white border border-gray-300 rounded">
              <strong className="block text-black mb-2">1️⃣ Не туралы?</strong>
              <span className="text-gray-600">Жарнаманың тақырыбы</span>
            </div>
            <div className="p-4 bg-white border border-gray-300 rounded">
              <strong className="block text-black mb-2">2️⃣ Қайда?</strong>
              <span className="text-gray-600">Орын/адрес</span>
            </div>
            <div className="p-4 bg-white border border-gray-300 rounded">
              <strong className="block text-black mb-2">3️⃣ Қашан?</strong>
              <span className="text-gray-600">Уақыт/күн</span>
            </div>
            <div className="p-4 bg-white border border-gray-300 rounded">
              <strong className="block text-black mb-2">4️⃣ Кім үшін?</strong>
              <span className="text-gray-600">Аудитория</span>
            </div>
          </div>

          <p className="text-gray-700">Жауаптарын ауызша немесе дәптерге жазады.</p>
        </div>

        {/* Expected Results Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">✅ Күтілетін нәтиже:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>оқушылар нақты ақпаратты тез табады;</li>
            <li>мәтіннің мақсатын түсінеді.</li>
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

export default Task21;
