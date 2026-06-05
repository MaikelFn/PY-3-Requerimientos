'use client';

import { useEffect, useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Swal from 'sweetalert2';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface PaymentFormProps {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntentId: string) => void;
  reservaData?: {
    tourId: number;
    usuarioId: number;
    cantidadCupos: number;
    fecha: string;
    nombreTour?: string;
    destino?: string;
    nombreUsuario?: string;
    precio?: string;
  };
}

function CheckoutForm({ 
  clientSecret,
  onSuccess,
  onReset,
}: { 
  clientSecret: string;
  onSuccess?: (paymentIntentId: string) => void;
  onReset?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  const rollbackReservation = async (paymentIntentId: string) => {
    try {
      await fetch('/api/payments/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });
    } catch (rollbackError) {
      console.error('Error al restaurar reserva:', rollbackError);
    }
  };

  useEffect(() => {
    const confirmPaidIntent = async () => {
      if (!stripe || !clientSecret || alreadyConfirmed) return;

      const searchParams = new URL(window.location.href).searchParams;
      const isStripeReturn =
        searchParams.has('payment_intent') ||
        searchParams.has('payment_intent_client_secret') ||
        searchParams.has('redirect_status');

      if (!isStripeReturn) return;

      try {
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (paymentIntent?.status === 'succeeded') {
          const response = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
            }),
          });

          if (response.ok) {
            setAlreadyConfirmed(true);
            if (onReset) {
              onReset();
            }
            if (onSuccess) {
              onSuccess(paymentIntent.id);
            }
          }
        } else if (paymentIntent && ['canceled', 'requires_payment_method'].includes(paymentIntent.status)) {
          await rollbackReservation(paymentIntent.id);
          if (onReset) {
            onReset();
          }
        }
      } catch (error) {
        console.error('Error al recuperar PaymentIntent:', error);
      }
    };

    confirmPaidIntent();
  }, [stripe, clientSecret, alreadyConfirmed, onReset, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        Swal.fire({
          icon: 'error',
          title: 'Error en el pago',
          text: submitError.message,
        });
        setIsProcessing(false);
        return;
      }

      const result = await (stripe as any).confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      }) as any;

      if (result.error) {
        // Cuando hay error, SIEMPRE recuperar el estado actual del PaymentIntent
        // para asegurar rollback incluso si result.paymentIntent es undefined
        try {
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
          if (paymentIntent?.id) {
            console.log(`[handleSubmit] Error de pago, estado actual: ${paymentIntent.status}`);
            await rollbackReservation(paymentIntent.id);
          }
        } catch (retrieveError) {
          console.error('Error al recuperar PaymentIntent para rollback:', retrieveError);
        }

        if (onReset) {
          onReset();
        }

        Swal.fire({
          icon: 'error',
          title: 'Error en el pago',
          text: result.error.message,
        });
      } else if (result.paymentIntent?.status === 'succeeded') {
        try {
          const response = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: result.paymentIntent.id,
            }),
          });

          if (response.ok) {
            if (onReset) {
              onReset();
            }
            if (onSuccess) {
              onSuccess(result.paymentIntent.id);
            }
          }
        } catch (confirmError) {
          console.error('Error al confirmar pago:', confirmError);
        }
      } else if (result.paymentIntent && ['canceled', 'requires_payment_method'].includes(result.paymentIntent.status)) {
        await rollbackReservation(result.paymentIntent.id);
        if (onReset) {
          onReset();
        }
      }
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al procesar el pago',
      });
      if (onReset) {
        onReset();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <PaymentElement />
      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Procesando...' : 'Pagar'}
      </button>
    </form>
  );
}

export function PaymentForm({
  amount,
  currency = 'usd',
  description,
  metadata,
  onSuccess,
  reservaData,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedSecret = window.sessionStorage.getItem('stripe_client_secret');
    if (storedSecret) {
      setClientSecret(storedSecret);
    }
  }, []);

  const handleCreatePayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          metadata,
          reservaData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pago');
      }

      setClientSecret(data.clientSecret);
      window.sessionStorage.setItem('stripe_client_secret', data.clientSecret);
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Error al procesar la solicitud',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <p className="mb-4 text-gray-700">Monto a pagar: ${amount.toFixed(2)}</p>
        <button
          onClick={handleCreatePayment}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Preparando...' : 'Proceder al pago'}
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} onReset={() => {
          window.sessionStorage.removeItem('stripe_client_secret');
          setClientSecret('');
        }} />
    </Elements>
  );
}
