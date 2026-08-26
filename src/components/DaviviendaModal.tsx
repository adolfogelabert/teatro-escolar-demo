import React, { useState, useEffect } from 'react';
import { Seat, Presentation, CustomerInfo, PurchaseReceipt } from '../types';
import { formatCOP } from '../data/theaterData';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DaviviendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeats: Seat[];
  presentation: Presentation;
  ticketPrice: number;
  onPaymentSuccess: (receipt: PurchaseReceipt) => void;
}

export const DaviviendaModal: React.FC<DaviviendaModalProps> = ({
  isOpen,
  onClose,
  selectedSeats,
  presentation,
  ticketPrice,
  onPaymentSuccess,
}) => {
  const totalAmount = selectedSeats.length * ticketPrice;

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<'daviplata' | 'pse' | 'tarjeta'>('daviplata');
  const [fullName, setFullName] = useState('Carlos Eduardo Gómez');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('1024567890');
  const [email, setEmail] = useState('carlos.gomez@gmail.com');
  const [phone, setPhone] = useState('3104567890');
  const [studentName, setStudentName] = useState('Sofía Gómez');
  const [studentGrade, setStudentGrade] = useState(presentation.grades.split(',')[0] || '1° Grado');
  const [selectedBank, setSelectedBank] = useState('Banco Davivienda');
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 6789');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('890');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes timer

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = () => {
    if (!fullName || !documentNumber || !email || !phone) {
      alert('Por favor completa todos los datos requeridos del comprador.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Iniciando conexión cifrada con Davivienda Gateway...');

    setTimeout(() => {
      setProcessingStep('Validando autorización bancaria y fondos con la entidad...');
    }, 1200);

    setTimeout(() => {
      setProcessingStep('Emitiendo boletas electrónicas con código QR único...');
    }, 2400);

    setTimeout(() => {
      setIsProcessing(false);

      // Lanzar confeti de celebración
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.log(e);
      }

      const transactionId = `DAV-${Math.floor(100000 + Math.random() * 900000)}`;
      const authorizationCode = `AUTH-${Math.floor(10000000 + Math.random() * 90000000)}`;

      const customer: CustomerInfo = {
        fullName,
        documentType,
        documentNumber,
        email,
        phone,
        studentName,
        studentGrade,
        paymentMethod,
        bankName: paymentMethod === 'pse' ? selectedBank : undefined,
      };

      const receipt: PurchaseReceipt = {
        transactionId,
        authorizationCode,
        date: new Date().toLocaleString('es-CO', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        presentationId: presentation.id,
        presentationTitle: presentation.title,
        presentationDate: presentation.date,
        presentationTime: presentation.time,
        seats: selectedSeats,
        unitPrice: ticketPrice,
        totalAmount,
        customer,
        paymentMethod:
          paymentMethod === 'daviplata'
            ? 'DaviPlata'
            : paymentMethod === 'pse'
            ? `PSE (${selectedBank})`
            : 'Tarjeta de Crédito / Débito Davivienda',
        status: 'Aprobada',
      };

      onPaymentSuccess(receipt);
    }, 3400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Davivienda Header */}
        <div className="bg-[#ED1C24] text-white p-4 sm:p-5 relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Casita roja emblem */}
            <div className="w-10 h-10 rounded-xl bg-white text-[#ED1C24] flex items-center justify-center font-black text-xl shadow-md">
              <span className="leading-none">🏠</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wide text-lg sm:text-xl">
                  DAVIVIENDA
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Pasarela Segura
                </span>
              </div>
              <p className="text-xs text-white/90">
                Pago Electrónico de Boletería • Colegio Mayor Teatro Escolar
              </p>
            </div>
          </div>

          {/* Timer bar */}
          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Tiempo para completar la transacción:
            </span>
            <span className="font-mono font-bold bg-black/20 px-2 py-0.5 rounded">
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        {isProcessing ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-[#ED1C24] border-2 border-rose-200 flex items-center justify-center animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Procesando Pago con Davivienda
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {processingStep}
              </p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
              <div className="bg-[#ED1C24] h-full animate-pulse w-3/4 rounded-full" />
            </div>
            <p className="text-[11px] text-slate-400">
              Por favor no cierres ni recargues esta ventana.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Purchase summary overview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Función seleccionada:</span>
                <div className="font-bold text-slate-900 text-sm">{presentation.title}</div>
                <div className="text-slate-600">
                  {presentation.date} • {presentation.time}
                </div>
              </div>

              <div className="text-right">
                <span className="text-slate-500 font-medium">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'asiento' : 'asientos'}:
                </span>
                <div className="font-extrabold text-base sm:text-lg text-rose-600">
                  {formatCOP(totalAmount)}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Selecciona tu medio de pago:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* DaviPlata */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('daviplata')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'daviplata'
                      ? 'border-[#ED1C24] bg-rose-50/50 ring-2 ring-[#ED1C24]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[#ED1C24] font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>DaviPlata</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Con tu número de celular
                  </p>
                </button>

                {/* PSE */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pse')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'pse'
                      ? 'border-[#ED1C24] bg-rose-50/50 ring-2 ring-[#ED1C24]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>PSE</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Débito desde cualquier banco
                  </p>
                </button>

                {/* Tarjeta */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'tarjeta'
                      ? 'border-[#ED1C24] bg-rose-50/50 ring-2 ring-[#ED1C24]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Tarjeta</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Crédito o Débito</p>
                </button>
              </div>
            </div>

            {/* Buyer Information Form */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Información del Acudiente / Comprador:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Nombre */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 font-medium"
                    placeholder="Ej. María Pérez"
                  />
                </div>

                {/* Documento */}
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label className="block text-slate-600 font-medium mb-1">Tipo</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] outline-none text-slate-900 font-medium bg-white"
                    >
                      <option value="CC">C.C.</option>
                      <option value="CE">C.E.</option>
                      <option value="PAS">Pasaporte</option>
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label className="block text-slate-600 font-medium mb-1">
                      No. Documento *
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 font-medium"
                      placeholder="1024..."
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Correo Electrónico (Para recibir Boletas) *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 font-medium"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Número Celular (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 font-medium"
                    placeholder="310..."
                  />
                </div>

                {/* Estudiante */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Nombre del Estudiante
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] outline-none text-slate-900 font-medium"
                    placeholder="Nombre del alumno"
                  />
                </div>

                {/* Grado */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Grado</label>
                  <input
                    type="text"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#ED1C24] outline-none text-slate-900 font-medium"
                    placeholder="Ej. Kínder / 3° A"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Specific Fields */}
            {paymentMethod === 'pse' && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
                <label className="block font-bold text-blue-900">
                  Selecciona tu Banco (PSE Colombia):
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-slate-900 font-semibold outline-none"
                >
                  <option value="Banco Davivienda">Banco Davivienda</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Banco de Bogotá">Banco de Bogotá</option>
                  <option value="BBVA Colombia">BBVA Colombia</option>
                  <option value="Nequi">Nequi</option>
                  <option value="DaviPlata">DaviPlata PSE</option>
                  <option value="Banco de Occidente">Banco de Occidente</option>
                  <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                </select>
              </div>
            )}

            {paymentMethod === 'tarjeta' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2.5">
                <div className="font-bold text-slate-800">Datos de la Tarjeta:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-slate-500 mb-0.5">Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">Vence (MM/AA)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-davivienda-pay"
                onClick={handleSimulatePayment}
                className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-[#ED1C24] hover:bg-[#D31920] text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Pagar {formatCOP(totalAmount)} con Davivienda</span>
              </button>
            </div>

            {/* Security Footer */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Cifrado SSL 256-bit
              </span>
              <span>•</span>
              <span>Vigilado Superintendencia Financiera</span>
              <span>•</span>
              <span>Redeban / ACH Colombia</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
