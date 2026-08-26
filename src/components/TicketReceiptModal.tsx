import React, { useEffect, useRef, useState } from 'react';
import { PurchaseReceipt, Seat } from '../types';
import { formatCOP } from '../data/theaterData';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Download,
  Printer,
  Share2,
  Mail,
  MessageSquare,
  Sparkles,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface TicketReceiptModalProps {
  receipt: PurchaseReceipt | null;
  onClose: () => void;
}

export const TicketReceiptModal: React.FC<TicketReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [notificationSent, setNotificationSent] = useState<{ email: boolean; whatsapp: boolean }>({
    email: true,
    whatsapp: true,
  });
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!receipt) return;
    const qrPayload = JSON.stringify({
      ref: receipt.transactionId,
      auth: receipt.authorizationCode,
      pres: receipt.presentationId,
      seats: receipt.seats.map((s) => `${s.row}-${s.number}`),
      customer: receipt.customer.fullName,
      total: receipt.totalAmount,
    });

    QRCode.toDataURL(qrPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [receipt]);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSimulatedDownload = () => {
    alert(
      `¡Descarga iniciada! Se ha generado el archivo PDF con las ${receipt.seats.length} boletas para ${receipt.customer.fullName}.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-200">
        {/* Top Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 relative print:hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold shadow-xs">
              <CheckCircle2 className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 bg-emerald-900/40 px-2.5 py-0.5 rounded-full">
                Transacción Aprobada • Davivienda
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                ¡Tus Boletas Están Listas!
              </h2>
              <p className="text-xs text-emerald-100">
                Referencia: <strong className="font-mono text-white">{receipt.transactionId}</strong> •{' '}
                Autorización: <strong className="font-mono text-white">{receipt.authorizationCode}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Notifications simulation alert */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-5 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex items-center gap-4 text-emerald-800">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              Enviado al correo: <strong>{receipt.customer.email}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp: <strong>{receipt.customer.phone}</strong>
            </span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
            Notificaciones Enviadas
          </span>
        </div>

        {/* Printable Ticket Area */}
        <div ref={printRef} className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Institution Header (Visible in print too) */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Colegio Mayor • Temporada de Teatro Escolar 2026
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {receipt.presentationTitle}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 mt-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {receipt.presentationDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {receipt.presentationTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Auditorio Principal & Teatro Mayor
              </span>
            </div>
          </div>

          {/* Cards for each digital ticket */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Boletas Adquiridas ({receipt.seats.length})</span>
              <span>Valor Unitario: {formatCOP(receipt.unitPrice)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {receipt.seats.map((seat, idx) => (
                <div
                  key={seat.id}
                  className="bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between shadow-xs"
                >
                  {/* Decorative notch */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200" />

                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Boleta Electrónica #{idx + 1}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {seat.sectionName}
                      </h4>
                      <p className="text-xs font-bold text-amber-700">
                        Fila {seat.row} • Asiento {seat.number}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-black text-sm flex items-center justify-center shadow-xs">
                      {seat.number}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Titular / Estudiante:</div>
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {receipt.customer.studentName || receipt.customer.fullName}
                      </div>
                    </div>

                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Código QR de Entrada"
                        className="w-12 h-12 rounded-lg border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-[8px]">
                        QR CODE
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment receipt recap details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Detalle de la Transacción Davivienda</span>
              <span className="text-emerald-700 font-mono">ESTADO: APROBADA</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Comprador:</span>
                <span className="font-semibold text-slate-800">{receipt.customer.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Documento:</span>
                <span className="font-semibold text-slate-800">
                  {receipt.customer.documentType} {receipt.customer.documentNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Medio de Pago:</span>
                <span className="font-semibold text-slate-800">{receipt.paymentMethod}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Fecha y Hora:</span>
                <span className="font-semibold text-slate-800">{receipt.date}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-sm">
              <span className="text-slate-800">Total Pagado:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {formatCOP(receipt.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Volver a la cartelera
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleSimulatedDownload}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Descargar Boletas (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
