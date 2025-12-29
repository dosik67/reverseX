import React from "react";
import { Link } from "react-router-dom";

const Task23: React.FC = () => {
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
        <h1 className="text-4xl font-bold mb-2 text-black">Тапсырма 23. «Диаграмма сөйлейді»</h1>
        <h2 className="text-xl text-gray-600 mb-12 font-medium uppercase tracking-wide">
          5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
        </h2>

        {/* Purpose Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-4 text-black">📌 Мақсаты:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>визуалды ақпаратты (диаграмма, кесте) оқи білу;</li>
            <li>қорытынды жасау дағдысын дамыту.</li>
          </ul>
        </div>

        {/* Process Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">📊 Өткізу барысы:</h3>

          <p className="text-gray-700 mb-8">Оқушылар диаграммадағы мәліметті оқиды.</p>

          {/* Diagram Placeholder */}
          <div className="my-8 p-16 bg-gray-300 border-2 border-dashed border-gray-400 text-center rounded text-gray-600 italic">
            📈 Диаграмма немесе график орналасады
          </div>

          {/* Conclusion Box */}
          <div className="my-8 p-6 bg-gray-200 border border-gray-400 rounded">
            <strong className="block text-black text-lg mb-4">💭 Оқушылар 3 қорытынды айтады:</strong>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Қай пән ең көп таңдалған?</li>
              <li>Ең аз қандай пән?</li>
              <li>Нені байқадың?</li>
            </ul>
          </div>
        </div>

        {/* Expected Results Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">✅ Күтілетін нәтиже:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>оқушылар ақпаратты тек мәтіннен ғана емес, диаграммадан да оқи алады;</li>
            <li>сандық деректі сөзбен жеткізуді үйренеді.</li>
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

export default Task23;
