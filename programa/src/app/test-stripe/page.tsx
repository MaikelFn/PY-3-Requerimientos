'use client';

import { PaymentForm } from '@/components/PaymentForm';
import { useState } from 'react';

export default function TestStripePage() {
  const [amount, setAmount] = useState(100);
  const [description, setDescription] = useState('Test Payment');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const handleSuccess = (id: string) => {
    setPaymentSuccess(true);
    setPaymentIntentId(id);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Test de Integración Stripe
        </h1>

        {!paymentSuccess ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">
              Configuración del Pago
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-700">
                Formulario de Pago
              </h3>
              <PaymentForm
                amount={amount}
                currency="usd"
                description={description}
                metadata={{
                  test: 'true',
                  source: 'test-page',
                }}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              ¡Pago Exitoso!
            </h2>
            <p className="text-gray-600 mb-2">
              ID del Payment Intent: <span className="font-mono text-sm">{paymentIntentId}</span>
            </p>
            <p className="text-gray-600 mb-6">
              Monto pagado: ${amount.toFixed(2)} USD
            </p>
            <button
              onClick={() => {
                setPaymentSuccess(false);
                setPaymentIntentId('');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Realizar otro pago
            </button>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Información de Prueba
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Esta es una página temporal para probar la integración con Stripe</li>
            <li>• Usa tarjetas de prueba de Stripe (ej: 4242 4242 4242 4242)</li>
            <li>• Asegúrate de tener las variables de entorno configuradas</li>
            <li>• Los pagos se procesan en modo de prueba</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
