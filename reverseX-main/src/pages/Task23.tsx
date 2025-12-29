import React from "react";
import { Link } from "react-router-dom";

const Task22: React.FC = () => {
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
        <h1 className="text-4xl font-bold mb-2 text-black">Тапсырма 22. «Нұсқаулықпен жұмыс»</h1>
        <h2 className="text-xl text-gray-600 mb-12 font-medium uppercase tracking-wide">
          5-БӨЛІМ. ФУНКЦИОНАЛДЫҚ ОҚУ САУАТТЫЛЫҒЫ
        </h2>

        {/* Purpose Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-4 text-black">📌 Мақсаты:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>әрекет ретін түсіну;</li>
            <li>нұсқаулық мәтінін дұрыс оқып, қолдануға үйрету.</li>
          </ul>
        </div>

        {/* Process Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">📖 Өткізу барысы:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700 mb-8">
            <li>Мұғалім «Кітапты ұқыпты ұстау ережесі» сияқты қарапайым нұсқаулық мәтінін ұсынады.</li>
            <li>Оқушылар мәтінді дауыстап оқиды.</li>
          </ul>

          {/* Instructions Example */}
          <div className="my-8 p-6 bg-gray-200 border-l-4 border-gray-600 rounded">
            <strong className="block text-black text-lg mb-4">📋 Нұсқаулықтағы қадамдарды нөмірлеп жазады:</strong>
            <p className="text-gray-700 mt-3">1️⃣ Қадам 1</p>
            <p className="text-gray-700">2️⃣ Қадам 2</p>
            <p className="text-gray-700">3️⃣ Қадам 3</p>
          </div>

          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>«Қай қадам ең маңызды? Неге?» деген сұраққа жауап береді.</li>
          </ul>
        </div>

        {/* Expected Results Section */}
        <div className="mb-10 p-8 bg-gray-50 border-l-4 border-black shadow-sm rounded">
          <h3 className="text-2xl font-bold mb-6 text-black">✅ Күтілетін нәтиже:</h3>
          <ul className="list-disc list-inside space-y-3 text-gray-700">
            <li>нұсқаулықты рет-ретімен орындауға үйренеді;</li>
            <li>мәтіндегі әрекет тізбегін түсінеді.</li>
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

export default Task22;
