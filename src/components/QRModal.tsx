import React, { useRef, useState } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import jsQR from 'jsqr';
import { useTranslation } from 'react-i18next';
import type { AccidentReport } from '../utils/storage';
import { compressReport, decompressReport } from '../utils/storage';
import './QRModal.css';

interface QRModalProps {
  isOpen: boolean;
  mode: 'generate' | 'scan';
  report: AccidentReport | null;
  onLoadData: (report: AccidentReport) => void;
  onClose: () => void;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, mode, report, onLoadData, onClose }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        scanQR();
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsScanning(false);
    }
  };

  const scanQR = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const scan = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const decoded = decompressReport(code.data);
            onLoadData(decoded);
            stopCamera();
            onClose();
          } catch (err) {
            setError('Invalid QR code format');
          }
        }
      }

      if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const decoded = decompressReport(code.data);
            onLoadData(decoded);
            onClose();
          } catch (err) {
            setError('Invalid QR code in image');
          }
        } else {
          setError('No QR code found in image');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{mode === 'generate' ? t('form.generateQR') : t('form.scanQR')}</h2>

        {mode === 'generate' && report ? (
          <div className="qr-generate-container">
            <div className="qr-code-wrapper">
              <QRCode
                value={compressReport(report)}
                level="H"
                size={256}
                includeMargin={true}
              />
            </div>
            <p className="qr-info">{t('form.save')} {t('form.generateQR')}</p>
            <button
              className="btn-primary"
              onClick={() => {
                const element = document.querySelector('.qr-code-wrapper canvas') as HTMLCanvasElement;
                if (element) {
                  const link = document.createElement('a');
                  link.href = element.toDataURL('image/png');
                  link.download = `accident_report_${new Date().getTime()}.png`;
                  link.click();
                }
              }}
            >
              {t('common.save')}
            </button>
          </div>
        ) : (
          <div className="qr-scan-container">
            <video ref={videoRef} autoPlay playsInline className="qr-video" />
            <canvas ref={canvasRef} className="qr-canvas hidden" />

            <div className="qr-scan-controls">
              {!isScanning ? (
                <>
                  <button className="btn-primary" onClick={startCamera}>
                    {t('form.scanQR')}
                  </button>
                  <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                    {t('form.loadFromFile')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </>
              ) : (
                <button className="btn-danger" onClick={stopCamera}>
                  Stop Scanning
                </button>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRModal;
