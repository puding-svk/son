import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import jsQR from 'jsqr';
import { QRCodeSVG } from 'qrcode.react';
import {
  type VehicleData,
  compressVehicleData,
  decompressVehicleData,
  saveVehicleTemplate,
  getAllVehicleTemplates,
  getVehicleTemplate,
  deleteVehicleTemplate,
  type VehicleTemplate,
  splitVehicleDataIntoQRs,
  reconstructFromQRParts,
} from '../utils/storage';
import './VehicleModal.css';

interface VehicleModalProps {
  isOpen: boolean;
  mode: 'save' | 'load' | 'qr';
  vehicleData: VehicleData;
  vehicleLabel: 'vehicleA' | 'vehicleB';
  onClose: () => void;
  onLoadData: (data: VehicleData) => void;
  initialMode?: 'qr' | 'save';
}

type SubView = 'main' | 'qr' | 'template';

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  mode,
  vehicleData,
  vehicleLabel,
  onClose,
  onLoadData,
  initialMode,
}) => {
  const { t } = useTranslation();
  const [subView, setSubView] = useState<SubView>('main');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrInfo, setQrInfo] = useState<string | null>(null);
  const [qrInfoFading, setQrInfoFading] = useState<boolean>(false);
  const qrInfoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [qrPartCount, setQrPartCount] = useState<number>(1);
  const [qrParts, setQrParts] = useState<string[]>([]);
  const [currentPartIndex, setCurrentPartIndex] = useState<number>(0);
  const [scannedParts, setScannedParts] = useState<Map<number, string>>(new Map());
  const [expectedPartCount, setExpectedPartCount] = useState<number | null>(null);
  const [isManualSplit, setIsManualSplit] = useState<boolean>(false);
  const [scannedPartTotal, setScannedPartTotal] = useState<number | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [scanSuccessFading, setScanSuccessFading] = useState<boolean>(false);
  const scanSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);
  const [scanErrorFading, setScanErrorFading] = useState<boolean>(false);
  const scanErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [invalidPartIndex, setInvalidPartIndex] = useState<number | null>(null);
  const [templates, setTemplates] = useState<VehicleTemplate[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  
  // Refs for persistent scanning state (not affected by closure issues)
  const scannedPartsRef = useRef<Map<number, string>>(new Map());
  const expectedPartCountRef = useRef<number | null>(null);
  
  // Ref for swipe gesture tracking
  const swipeStartXRef = useRef<number | null>(null);
  
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef<boolean>(false);
  const performScanRef = useRef<() => void>(() => {});

  // Error boundary for QR code rendering
  class QRCodeErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
      console.error('QRCodeErrorBoundary caught error:', error);
    }

    render() {
      if (this.state.hasError) {
        return (
          <p style={{ color: '#d9534f' }}>
            Error rendering QR code: {this.state.error?.message}
          </p>
        );
      }

      return this.props.children;
    }
  }

  // Safe QR Code wrapper component - validates data before rendering
  const SafeQRCodeSVG = ({ value, size }: { value: string; size: number }) => {
    // Triple check data length before rendering
    if (!value || value.length === 0) {
      console.warn('SafeQRCodeSVG: Empty value');
      return null;
    }
    if (value.length > 2500) {
      console.error('SafeQRCodeSVG: Data too long:', value.length);
      return <p style={{ color: '#d9534f' }}>Error: QR data is too large ({value.length} chars)</p>;
    }
    
    // Check if it's a split part (has [N/M] marker)
    const splitMatch = value.match(/^\[(\d+)\/(\d+)\]/);
    if (splitMatch) {
      // Split part - validate but don't log
    }
    

    try {
      return (
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={true}
        />
      );
    } catch (error) {
      console.error('SafeQRCodeSVG: Render error:', error);
      return <p style={{ color: '#d9534f' }}>Error rendering QR code: {String(error)}</p>;
    }
  };

  // Helper function to calculate if minimum QR size reached (150 chars minimum per part)
  const isMinimumQRSizeReached = (): boolean => {
    const compressed = compressVehicleData(vehicleData);
    const MIN_CHARS_PER_PART = 150;
    const charsPerPart = compressed.length / qrPartCount;
    return charsPerPart <= MIN_CHARS_PER_PART;
  };

  // Define handleStopCamera early so it can be referenced in performScan
  const handleStopCamera = () => {
    scanningRef.current = false;
    // Stop all media tracks from stream state
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    // Stop all media tracks from video ref
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStream(null);
  };

  // Define performScan function (extracted scan logic)
  const performScan = () => {
    // Check if camera is still active before continuing scan
    if (!scanningRef.current) return;
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(performScan);
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      requestAnimationFrame(performScan);
      return;
    }

    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      try {
        const qrData = code.data;
        
        // Check if this is a split QR part
        const splitMatch = qrData.match(/^\[(\d+)\/(\d+)\](.*)$/);
        
        if (splitMatch) {
          // Handle split QR part
          const partIndex = parseInt(splitMatch[1]);
          const totalParts = parseInt(splitMatch[2]);
          const partData = splitMatch[3];
          

          
          // Check if this is a different session (different totalParts)
          if (expectedPartCountRef.current !== null && expectedPartCountRef.current !== totalParts) {
            // Different Y - reset and start new session, show red message

            scannedPartsRef.current = new Map();
            expectedPartCountRef.current = totalParts;
            setScannedParts(new Map());
            setExpectedPartCount(totalParts);
            setScannedPartTotal(null);
            setInvalidPartIndex(null);
            setScanErrorMessage(t('message.newQRSession', { parts: totalParts }) || `New QR code session with ${totalParts} parts. Scanning part 1 of ${totalParts}.`);
            setScanErrorFading(false);
            requestAnimationFrame(performScan);
            return;
          }
          
          // Initialize expected part count on first split QR
          if (expectedPartCountRef.current === null) {

            expectedPartCountRef.current = totalParts;
            setExpectedPartCount(totalParts);
          }
          
          // Check if this part was already scanned with the same content
          const previousPartData = scannedPartsRef.current.get(partIndex);
          const isNewPart = previousPartData !== partData;
          
          // Store the part in ref (persistent storage)
          scannedPartsRef.current.set(partIndex, partData);
          
          // Also update state for UI rendering
          setScannedParts(new Map(scannedPartsRef.current));
          
          // Show success feedback - update visual indicators only if new part or different content
          setScannedPartTotal(totalParts);
          setInvalidPartIndex(null);
          setScanErrorMessage(null);
          setScanSuccessFading(false);
          
          if (isNewPart) {
            setScanSuccessMessage(t('message.partScanned', { part: partIndex, total: totalParts }) || `✓ Part ${partIndex} of ${totalParts} scanned successfully!`);
          }
          
          
          const partsCollected = scannedPartsRef.current.size;
          
          if (partsCollected === totalParts) {
            // All parts collected - show final success before reconstructing
            setScanSuccessMessage(t('message.allPartsScanned') || '✓ All parts scanned successfully! Processing...');
            setScanSuccessFading(false);
            
            // Delay to show the final indicators in green before processing
            // Need longer delay so user can see the green indicators
            setTimeout(() => {
              try {
                const sortedParts: string[] = [];
                for (let i = 1; i <= totalParts; i++) {
                  const part = scannedPartsRef.current.get(i);
                  if (!part) throw new Error(`Missing part ${i}`);
                  sortedParts.push(`[${i}/${totalParts}]${part}`);
                }
                

                const reconstructedData = reconstructFromQRParts(sortedParts);
                if (!reconstructedData) {
                  throw new Error('Failed to reconstruct data from parts');
                }
                
                // Ensure nested structure is set
                const safeData: VehicleData = {
                  policyholder: reconstructedData.policyholder || {
                    surname: '',
                    firstname: '',
                    address: '',
                    postalCode: '',
                    country: '',
                    phoneEmail: '',
                  },
                  vehicle: reconstructedData.vehicle || {
                    vehicleType: 'vehicle',
                    make: '',
                    model: '',
                    registrationNumber: '',
                    countryOfRegistration: '',
                  },
                  insurance: reconstructedData.insurance || {
                    insuranceCompanyName: '',
                    policyNumber: '',
                    greenCardNumber: '',
                    greenCardValidFrom: '',
                    greenCardValidTo: '',
                    branch: '',
                    branchAddress: '',
                    branchCountry: '',
                    branchPhone: '',
                    comprehensiveInsurance: '',
                  },
                  driver: reconstructedData.driver || {
                    surname: '',
                    firstname: '',
                    dateOfBirth: '',
                    address: '',
                    country: '',
                    phone: '',
                    licenceNumber: '',
                    licenceCategory: '',
                    licenceValidUntil: '',
                  },
                  impactMarkers: reconstructedData.impactMarkers || [],
                  visibleDamage: reconstructedData.visibleDamage || '',
                  circumstances: reconstructedData.circumstances || {
                    parked: false,
                    stopped: false,
                    openedDoor: false,
                    parking: false,
                    leavingParkingArea: false,
                    enteringParkingArea: false,
                    enteringRoundabout: false,
                    drivingRoundabout: false,
                    rearEndCollision: false,
                    drivingParallel: false,
                    changingLanes: false,
                    overtaking: false,
                    turningRight: false,
                    turningLeft: false,
                    reversing: false,
                    enteredOppositeLane: false,
                    comingFromRight: false,
                    failedToYield: false,
                  },
                  additionalNotes: reconstructedData.additionalNotes || '',
                };
                
                onLoadData(safeData);
                handleStopCamera();
                // Clear scanning session refs
                scannedPartsRef.current = new Map();
                expectedPartCountRef.current = null;
                setScannedParts(new Map());
                setExpectedPartCount(null);
                setScannedPartTotal(null);
                setScanSuccessMessage(null);
                onClose();
              } catch (reconstructError) {
                console.error('Failed to reconstruct from parts:', reconstructError);
                setScanErrorMessage(t('error.failedReconstructParts') || 'Failed to reconstruct data. Try scanning again.');
                setScanErrorFading(false);
                // Stop scanning on error to prevent continuous attempts
                scanningRef.current = false;
              }
            }, 1500);
            // Stop scanning while we process
            scanningRef.current = false;
          } else {
            // Still waiting for more parts
            requestAnimationFrame(performScan);
          }
        } else if (qrData.startsWith('SDON')) {
          // Handle normal single QR code
          const data = decompressVehicleData(qrData);
          // Ensure nested structure is set
          const safeData: VehicleData = {
            policyholder: data.policyholder || {
              surname: '',
              firstname: '',
              address: '',
              postalCode: '',
              country: '',
              phoneEmail: '',
            },
            vehicle: data.vehicle || {
              vehicleType: 'vehicle',
              make: '',
              model: '',
              registrationNumber: '',
              countryOfRegistration: '',
            },
            insurance: data.insurance || {
              insuranceCompanyName: '',
              policyNumber: '',
              greenCardNumber: '',
              greenCardValidFrom: '',
              greenCardValidTo: '',
              branch: '',
              branchAddress: '',
              branchCountry: '',
              branchPhone: '',
              comprehensiveInsurance: '',
            },
            driver: data.driver || {
              surname: '',
              firstname: '',
              dateOfBirth: '',
              address: '',
              country: '',
              phone: '',
              licenceNumber: '',
              licenceCategory: '',
              licenceValidUntil: '',
            },
            impactMarkers: data.impactMarkers || [],
            visibleDamage: data.visibleDamage || '',
            circumstances: data.circumstances || {
              parked: false,
              stopped: false,
              openedDoor: false,
              parking: false,
              leavingParkingArea: false,
              enteringParkingArea: false,
              enteringRoundabout: false,
              drivingRoundabout: false,
              rearEndCollision: false,
              drivingParallel: false,
              changingLanes: false,
              overtaking: false,
              turningRight: false,
              turningLeft: false,
              reversing: false,
              enteredOppositeLane: false,
              comingFromRight: false,
              failedToYield: false,
            },
            additionalNotes: data.additionalNotes || '',
          };
          onLoadData(safeData);
          handleStopCamera();
          onClose();
        } else {
          // Invalid QR code format
          throw new Error('Invalid QR code format');
        }
      } catch (error) {
        // Invalid QR code - show error in UI and continue scanning
        console.error('Invalid QR code scanned:', error);
        
        // If we're in a split QR session, mark the invalid part in red but don't reset
        if (expectedPartCount !== null) {
          setInvalidPartIndex(-1); // Mark as invalid
          setScanErrorMessage(t('error.invalidQR') || 'Invalid QR code. Please scan a valid part.');
          setScanErrorFading(false);
          // Clear invalid marker after 3 seconds
          setTimeout(() => {
            setInvalidPartIndex(null);
          }, 3000);
        } else {
          // Not in a split session, just show error
          setScanErrorMessage(t('error.invalidQR') || 'Invalid QR code. Please scan a QR code generated by this app.');
          setScanErrorFading(false);
        }
        
        requestAnimationFrame(performScan);
      }
    } else {
      // No QR code detected - continue scanning
      requestAnimationFrame(performScan);
    }
  };

  // Auto-dismiss qrInfo after 6 seconds
  useEffect(() => {
    if (qrInfo) {
      // Clear any existing timeout
      if (qrInfoTimeoutRef.current) {
        clearTimeout(qrInfoTimeoutRef.current);
      }
      
      // Set new timeout to fade out after 6 seconds
      qrInfoTimeoutRef.current = setTimeout(() => {
        setQrInfoFading(true);
        // After fade animation, clear the message
        setTimeout(() => {
          setQrInfo(null);
          setQrInfoFading(false);
        }, 300);
      }, 6000);
    }
    
    return () => {
      if (qrInfoTimeoutRef.current) {
        clearTimeout(qrInfoTimeoutRef.current);
      }
    };
  }, [qrInfo]);

  // Auto-dismiss scanSuccessMessage after 3 seconds
  useEffect(() => {
    if (scanSuccessMessage) {
      // Clear any existing timeout
      if (scanSuccessTimeoutRef.current) {
        clearTimeout(scanSuccessTimeoutRef.current);
      }
      
      // Set new timeout to fade out after 3 seconds
      scanSuccessTimeoutRef.current = setTimeout(() => {
        setScanSuccessFading(true);
        // After fade animation, clear the message
        setTimeout(() => {
          setScanSuccessMessage(null);
          setScanSuccessFading(false);
        }, 300);
      }, 3000);
    }
    
    return () => {
      if (scanSuccessTimeoutRef.current) {
        clearTimeout(scanSuccessTimeoutRef.current);
      }
    };
  }, [scanSuccessMessage]);

  // Auto-dismiss scanErrorMessage after 3 seconds
  useEffect(() => {
    if (scanErrorMessage) {
      // Clear any existing timeout
      if (scanErrorTimeoutRef.current) {
        clearTimeout(scanErrorTimeoutRef.current);
      }
      
      // Set new timeout to fade out after 3 seconds
      scanErrorTimeoutRef.current = setTimeout(() => {
        setScanErrorFading(true);
        // After fade animation, clear the message
        setTimeout(() => {
          setScanErrorMessage(null);
          setScanErrorFading(false);
        }, 300);
      }, 3000);
    }
    
    return () => {
      if (scanErrorTimeoutRef.current) {
        clearTimeout(scanErrorTimeoutRef.current);
      }
    };
  }, [scanErrorMessage]);

  // Store the scan function reference for use in useEffect
  useEffect(() => {
    performScanRef.current = performScan;
  }, [performScan]);

  // Reset to main view when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // If initialMode is 'qr', go directly to QR generation
      if (initialMode === 'qr') {
        setSubView('qr');
        // Generate QR code immediately with auto-split if needed
        try {
          setQrError(null);
          setQrInfo(null);
          const qrData = compressVehicleData(vehicleData);
          const MAX_SAFE_QR_SIZE = 1500;
          
          if (qrData.length > MAX_SAFE_QR_SIZE) {
            // Auto-split: calculate optimal number of parts
            const optimalParts = Math.ceil(qrData.length / MAX_SAFE_QR_SIZE);
            
            // Generate split QR codes
            const parts = splitVehicleDataIntoQRs(vehicleData, optimalParts);
            
            setQrPartCount(optimalParts);
            setQrParts(parts);
            setCurrentPartIndex(0);
            setQrCode(null);
            setQrInfo(t('message.qrAutoSplit', { parts: optimalParts }) || `QR code was automatically split into ${optimalParts} parts due to data size`);
          } else {
            setQrCode(qrData);
            setQrParts([]);
            setQrPartCount(1);
          }
        } catch (error) {
          setQrError(t('error.qrGeneration') || 'Error generating QR code');
          setQrCode(null);
        }
      } else {
        setSubView('main');
      }
      setCameraActive(false);
      setTemplates([]);
      setTemplateName('');
      setStream(null);
    } else {
      // Modal is closing - clean up camera
      scanningRef.current = false;
      // Stop all media tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setStream(null);
    }
  }, [isOpen, initialMode, vehicleData, t]);

  // Handle stream attachment when camera is activated
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      
      // Force play after a small delay to ensure element is ready
      const playTimer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.error('Play error:', err);
          });
          // Start scanning after video is playing
          const scanTimer = setTimeout(() => {
            scanningRef.current = true;
            // Trigger scan loop via the stored ref
            if (scanningRef.current && performScanRef.current) {
              // Schedule the first frame in next tick
              requestAnimationFrame(performScanRef.current);
            }
          }, 500);
          return () => clearTimeout(scanTimer);
        }
      }, 100);
      
      return () => clearTimeout(playTimer);
    } else if (!cameraActive) {
      scanningRef.current = false;
    }
  }, [cameraActive, stream]);

  // Sync qrCode with current part when index changes
  useEffect(() => {
    if (qrParts.length > 0 && currentPartIndex < qrParts.length) {
      setQrCode(qrParts[currentPartIndex]);
    }
  }, [currentPartIndex, qrParts]);

  // Helper to get current display QR code
  const getCurrentQRCode = (): string | null => {
    const MAX_QR_SIZE = 1500; // Conservative limit - actual QR capacity varies by encoding
    
    if (qrParts.length > 0 && currentPartIndex < qrParts.length) {
      const part = qrParts[currentPartIndex];
      // Validate part is safe size
      if (part && part.length > 0 && part.length <= MAX_QR_SIZE) {
        return part;
      }
      console.warn('Part size invalid:', part?.length);
      return null;
    }
    // Make sure we never return oversized data
    if (qrCode && qrCode.length > 0 && qrCode.length <= MAX_QR_SIZE) {
      return qrCode;
    }
    if (qrCode && qrCode.length > MAX_QR_SIZE) {
      console.warn('QR code data too large:', qrCode.length, 'max:', MAX_QR_SIZE);
    }
    return null;
  };

  // Memoize the QR code to prevent re-renders with bad data
  const safeQRCode = React.useMemo(() => {
    const code = getCurrentQRCode();
    return code;
  }, [qrCode, qrParts, currentPartIndex]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      onClose();
    }
  };

  // ============ JSON Functions ============
  const handleExportJSON = () => {
    const defaultName = `vehicle_${vehicleLabel}_${new Date().getTime()}`;
    const fileName = prompt(t('message.enterFileName') || 'Enter file name:', defaultName);
    if (fileName) {
      const dataStr = JSON.stringify(vehicleData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        // Ensure nested structure is set
        const safeData: VehicleData = {
          policyholder: data.policyholder || {
            surname: '',
            firstname: '',
            address: '',
            postalCode: '',
            country: '',
            phoneEmail: '',
          },
          vehicle: data.vehicle || {
            vehicleType: 'vehicle',
            make: '',
            model: '',
            registrationNumber: '',
            countryOfRegistration: '',
          },
          insurance: data.insurance || {
            insuranceCompanyName: '',
            policyNumber: '',
            greenCardNumber: '',
            greenCardValidFrom: '',
            greenCardValidTo: '',
            branch: '',
            branchAddress: '',
            branchCountry: '',
            branchPhone: '',
            comprehensiveInsurance: '',
          },
          driver: data.driver || {
            surname: '',
            firstname: '',
            dateOfBirth: '',
            address: '',
            country: '',
            phone: '',
            licenceNumber: '',
            licenceCategory: '',
            licenceValidUntil: '',
          },
          impactMarkers: data.impactMarkers || [],
          visibleDamage: data.visibleDamage || '',
          circumstances: data.circumstances || {
            parked: false,
            stopped: false,
            openedDoor: false,
            parking: false,
            leavingParkingArea: false,
            enteringParkingArea: false,
            enteringRoundabout: false,
            drivingRoundabout: false,
            rearEndCollision: false,
            drivingParallel: false,
            changingLanes: false,
            overtaking: false,
            turningRight: false,
            turningLeft: false,
            reversing: false,
            enteredOppositeLane: false,
            comingFromRight: false,
            failedToYield: false,
          },
          additionalNotes: data.additionalNotes || '',
        };
        onLoadData(safeData);
        onClose();
      } catch (error) {
        alert(t('error.invalidJSON') || 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  // ============ QR Functions ============
  const handleGenerateQR = async () => {
    try {
      setQrError(null);
      setQrInfo(null);
      const compressed = compressVehicleData(vehicleData);
      
      // QR code safe rendering limit - use conservative 1500 chars to ensure compatibility
      const MAX_SAFE_QR_SIZE = 1500;
      
      if (compressed.length > MAX_SAFE_QR_SIZE) {
        // Auto-split: calculate optimal number of parts
        const optimalParts = Math.ceil(compressed.length / MAX_SAFE_QR_SIZE);
        
        // Generate split QR codes
        const parts = splitVehicleDataIntoQRs(vehicleData, optimalParts);
        
        setQrPartCount(optimalParts);
        setQrParts(parts);
        setCurrentPartIndex(0);
        setQrCode(null);
        setQrInfo(t('message.qrAutoSplit', { parts: optimalParts }) || `QR code was automatically split into ${optimalParts} parts due to data size`);
        return;
      }
      
      setQrCode(compressed);
      setQrParts([]);
      setQrPartCount(1);
      setCurrentPartIndex(0);
    } catch (error) {
      setQrError(t('error.qrGeneration') || 'Error generating QR code');
      setQrCode(null);
    }
  };

  const handleCannotScan = () => {
    // Check if we've reached the minimum size
    if (isMinimumQRSizeReached()) {
      return; // Button should be disabled, but prevent action just in case
    }
    
    try {
      setQrError(null);
      setQrInfo(null); // Clear the auto-split info message when user manually splits
      const newPartCount = qrPartCount + 1;
      const parts = splitVehicleDataIntoQRs(vehicleData, newPartCount);
      
      setQrPartCount(newPartCount);
      setQrParts(parts);
      setCurrentPartIndex(0);
      setQrCode(null);
      setIsManualSplit(true); // Mark this as manual split
    } catch (error) {
      setQrError(t('error.qrGeneration') || 'Error generating QR code');
      setQrCode(null);
    }
  };

  const handleCancelSplit = () => {
    // Reset to initial QR view - regenerate based on data size
    try {
      const compressed = compressVehicleData(vehicleData);
      const MAX_SAFE_QR_SIZE = 1500;
      
      setQrError(null);
      setCurrentPartIndex(0);
      setIsManualSplit(false); // Reset manual split flag
      
      if (compressed.length > MAX_SAFE_QR_SIZE) {
        // Show auto-split info again
        const optimalParts = Math.ceil(compressed.length / MAX_SAFE_QR_SIZE);
        const parts = splitVehicleDataIntoQRs(vehicleData, optimalParts);
        
        setQrPartCount(optimalParts);
        setQrParts(parts);
        setQrCode(null);
        setQrInfo(t('message.qrAutoSplit', { parts: optimalParts }) || `QR code was automatically split into ${optimalParts} parts due to data size`);
      } else {
        // Single QR code
        setQrCode(compressed);
        setQrParts([]);
        setQrPartCount(1);
        setQrInfo(null);
      }
    } catch (error) {
      setQrError(t('error.qrGeneration') || 'Error generating QR code');
      setQrCode(null);
    }
  };

  // Handle swipe gestures on QR code
  const handleQRTouchStart = (e: React.TouchEvent) => {
    if (qrPartCount <= 1) return; // Only for split QR codes
    swipeStartXRef.current = e.touches[0].clientX;
  };

  const handleQRTouchEnd = (e: React.TouchEvent) => {
    if (qrPartCount <= 1 || swipeStartXRef.current === null) return;
    
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeDelta = swipeStartXRef.current - swipeEndX;
    const swipeThreshold = 50; // Minimum distance to trigger swipe
    
    if (Math.abs(swipeDelta) < swipeThreshold) {
      swipeStartXRef.current = null;
      return;
    }
    
    // Swipe right (positive delta) = next part
    if (swipeDelta > swipeThreshold) {
      if (currentPartIndex < qrPartCount - 1) {
        setCurrentPartIndex(currentPartIndex + 1);
      } else {
        // Wrap around to first part
        setCurrentPartIndex(0);
      }
    }
    // Swipe left (negative delta) = previous part
    else if (swipeDelta < -swipeThreshold) {
      if (currentPartIndex > 0) {
        setCurrentPartIndex(currentPartIndex - 1);
      } else {
        // Wrap around to last part
        setCurrentPartIndex(qrPartCount - 1);
      }
    }
    
    swipeStartXRef.current = null;
  };

  // Helper to enhance image contrast for better QR detection
  const enhanceImage = (imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate local brightness to handle varied lighting
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      // Use adaptive threshold instead of fixed 128
      const threshold = 100;
      const val = brightness > threshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    
    return new ImageData(data, width, height);
  };

  const handleStartCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Request autofocus and other quality improvements
          focusMode: { ideal: 'continuous' },
          zoom: { ideal: 1 },
          brightness: { ideal: 0 },
          contrast: { ideal: 1 },
          sharpness: { ideal: 1 },
          resizeMode: { ideal: 'none' as any },
          frameRate: { ideal: 30 },
        } as any,
      });
      
      // Store stream and trigger camera active
      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraActive(false);
      alert(t('error.cameraAccess') || 'Cannot access camera');
    }
  };

  const handleToggleTorch = async () => {
    try {
      if (!stream) return;
      
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      const capabilities = videoTrack.getCapabilities?.() as any;
      if (!capabilities?.torch) {
        alert('Flashlight not supported on this device');
        return;
      }
      
      await videoTrack.applyConstraints({
        advanced: [{ torch: !torchEnabled }] as any,
      });
      
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error('Torch error:', error);
      alert('Could not toggle flashlight');
    }
  };

  const handleLoadImageQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
      alert(t('error.loadingImage') || 'Error loading image');
    };
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          alert(t('error.invalidImage') || 'Invalid image file');
          return;
        }

        const img = new Image();
        let loadTimeout: ReturnType<typeof setTimeout>;
        
        img.onerror = () => {
          clearTimeout(loadTimeout);
          alert(t('error.invalidImage') || 'Invalid image file');
        };
        
        img.onload = () => {
          clearTimeout(loadTimeout);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              alert(t('error.canvasError') || 'Canvas error');
              return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            if (!imageData || !imageData.data) {
              alert(t('error.imageDataError') || 'Could not read image data');
              return;
            }

            // Stage 1: Try normal detection
            let code = jsQR(imageData.data, imageData.width, imageData.height);

            // Stage 2: Try enhanced (black/white threshold) detection
            if (!code) {
              const enhancedImageData = enhanceImage(imageData);
              code = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height);
            }

            // Stage 3: Try inverted colors detection
            if (!code) {
              const invertedData = new Uint8ClampedArray(imageData.data);
              for (let i = 0; i < invertedData.length; i += 4) {
                invertedData[i] = 255 - invertedData[i];        // R
                invertedData[i + 1] = 255 - invertedData[i + 1]; // G
                invertedData[i + 2] = 255 - invertedData[i + 2]; // B
                // Keep alpha unchanged (i+3)
              }
              const invertedImageData = new ImageData(invertedData, imageData.width, imageData.height);
              code = jsQR(invertedImageData.data, invertedImageData.width, invertedImageData.height);
            }

            if (code) {
              try {
                const data = decompressVehicleData(code.data);
                // Ensure nested structure is set
                const safeData: VehicleData = {
                  policyholder: data.policyholder || {
                    surname: '',
                    firstname: '',
                    address: '',
                    postalCode: '',
                    country: '',
                    phoneEmail: '',
                  },
                  vehicle: data.vehicle || {
                    vehicleType: 'vehicle',
                    make: '',
                    model: '',
                    registrationNumber: '',
                    countryOfRegistration: '',
                  },
                  insurance: data.insurance || {
                    insuranceCompanyName: '',
                    policyNumber: '',
                    greenCardNumber: '',
                    greenCardValidFrom: '',
                    greenCardValidTo: '',
                    branch: '',
                    branchAddress: '',
                    branchCountry: '',
                    branchPhone: '',
                    comprehensiveInsurance: '',
                  },
                  driver: data.driver || {
                    surname: '',
                    firstname: '',
                    dateOfBirth: '',
                    address: '',
                    country: '',
                    phone: '',
                    licenceNumber: '',
                    licenceCategory: '',
                    licenceValidUntil: '',
                  },
                  impactMarkers: data.impactMarkers || [],
                  visibleDamage: data.visibleDamage || '',
                  circumstances: data.circumstances || {
                    parked: false,
                    stopped: false,
                    openedDoor: false,
                    parking: false,
                    leavingParkingArea: false,
                    enteringParkingArea: false,
                    enteringRoundabout: false,
                    drivingRoundabout: false,
                    rearEndCollision: false,
                    drivingParallel: false,
                    changingLanes: false,
                    overtaking: false,
                    turningRight: false,
                    turningLeft: false,
                    reversing: false,
                    enteredOppositeLane: false,
                    comingFromRight: false,
                    failedToYield: false,
                  },
                  additionalNotes: data.additionalNotes || '',
                };
                onLoadData(safeData);
                onClose();
              } catch (error) {
                alert(t('error.invalidQR') || 'Invalid QR code data');
              }
            } else {
              alert(t('error.noQRFound') || 'No QR code found in image. Try a clearer image with better lighting.');
            }
          } catch (error) {
            alert(t('error.processingImage') || 'Error processing image');
          }
        };
        
        // Add timeout for image loading
        loadTimeout = setTimeout(() => {
          alert(t('error.imageLoadTimeout') || 'Image loading timeout');
        }, 5000);
        
        img.src = result;
      } catch (error) {
        alert(t('error.unexpectedError') || 'Unexpected error');
      }
    };
    reader.readAsDataURL(file);
  };

  // ============ Template Functions ============
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert(t('modal.templateName') || 'Please enter a template name');
      return;
    }

    try {
      // Check if template with this name already exists
      const existingTemplate = templates.find(
        (tmpl) => tmpl.name.toLowerCase() === templateName.toLowerCase()
      );

      if (existingTemplate && existingTemplate.id) {
        // Overwrite existing template
        if (!confirm(t('confirm.overwriteTemplate') || `Overwrite existing template "${templateName}"?`)) {
          return;
        }
        await deleteVehicleTemplate(existingTemplate.id);
      }

      await saveVehicleTemplate({
        name: templateName,
        vehicleLabel: vehicleLabel,
        data: vehicleData,
        createdAt: new Date().toISOString(),
      });
      alert(t('message.templateSaved') || 'Template saved successfully');
      onClose();
    } catch (error) {
      alert(t('error.savingTemplate') || 'Error saving template');
    }
  };

  const handleInitiateSaveTemplate = async () => {
    try {
      const allTemplates = await getAllVehicleTemplates();

      setTemplates(allTemplates);
      setTemplateName('');
      setSubView('template');
    } catch (error) {
      console.error('Error loading templates:', error);
      alert(t('error.loadingTemplates') || 'Error loading templates');
    }
  };

  const handleLoadTemplates = async () => {
    try {
      const allTemplates = await getAllVehicleTemplates();
      setTemplates(allTemplates);
      setSubView('template');
    } catch (error) {
      alert(t('error.loadingTemplates') || 'Error loading templates');
    }
  };

  const handleLoadTemplate = async (templateId: number | undefined) => {
    if (!templateId) return;
    try {
      const template = await getVehicleTemplate(templateId);
      if (template) {
        // Ensure nested structure is set
        const safeData: VehicleData = {
          policyholder: template.data.policyholder || {
            surname: '',
            firstname: '',
            address: '',
            postalCode: '',
            country: '',
            phoneEmail: '',
          },
          vehicle: template.data.vehicle || {
            vehicleType: 'vehicle',
            make: '',
            model: '',
            registrationNumber: '',
            countryOfRegistration: '',
          },
          insurance: template.data.insurance || {
            insuranceCompanyName: '',
            policyNumber: '',
            greenCardNumber: '',
            greenCardValidFrom: '',
            greenCardValidTo: '',
            branch: '',
            branchAddress: '',
            branchCountry: '',
            branchPhone: '',
            comprehensiveInsurance: '',
          },
          driver: template.data.driver || {
            surname: '',
            firstname: '',
            dateOfBirth: '',
            address: '',
            country: '',
            phone: '',
            licenceNumber: '',
            licenceCategory: '',
            licenceValidUntil: '',
          },
          impactMarkers: template.data.impactMarkers || [],
          visibleDamage: template.data.visibleDamage || '',
          circumstances: template.data.circumstances || {
            parked: false,
            stopped: false,
            openedDoor: false,
            parking: false,
            leavingParkingArea: false,
            enteringParkingArea: false,
            enteringRoundabout: false,
            drivingRoundabout: false,
            rearEndCollision: false,
            drivingParallel: false,
            changingLanes: false,
            overtaking: false,
            turningRight: false,
            turningLeft: false,
            reversing: false,
            enteredOppositeLane: false,
            comingFromRight: false,
            failedToYield: false,
          },
          additionalNotes: template.data.additionalNotes || '',
        };
        onLoadData(safeData);
        onClose();
      }
    } catch (error) {
      alert(t('error.loadingTemplate') || 'Error loading template');
    }
  };

  const handleDeleteTemplate = async (templateId: number | undefined) => {
    if (!templateId) return;
    if (!confirm(t('confirm.deleteTemplate') || 'Delete this template?')) return;

    try {
      await deleteVehicleTemplate(templateId);
      const allTemplates = await getAllVehicleTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      alert(t('error.deletingTemplate') || 'Error deleting template');
    }
  };

  // ============ Render Functions ============
  const renderMainView = () => (
    <>
      <h2>{mode === 'save' ? t('modal.saveVehicle') : t('modal.loadVehicle')}</h2>
      <div className="modal-main-buttons">
        <button
          className="action-btn"
          onClick={mode === 'save' ? handleExportJSON : () => jsonInputRef.current?.click()}
          type="button"
        >
          {mode === 'save' ? t('modal.exportJSON') : t('modal.importJSON')}
        </button>
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJSON}
          style={{ display: 'none' }}
        />

        <button
          className="action-btn"
          onClick={() => {
            if (mode === 'save') {
              handleGenerateQR();
              setSubView('qr');
            } else {
              // In load mode, start camera immediately and go to QR view
              handleStartCamera();
              setSubView('qr');
            }
          }}
          type="button"
        >
          {mode === 'save' ? t('modal.generateQR') : t('modal.scanQR')}
        </button>

        <button
          className="action-btn"
          onClick={mode === 'save' ? handleInitiateSaveTemplate : handleLoadTemplates}
          type="button"
        >
          {mode === 'save' ? t('modal.saveAsTemplate') : t('modal.loadTemplate')}
        </button>
      </div>
    </>
  );

  const renderQRView = () => (
    <>
      <div className="modal-view-header">
        <h3>{mode === 'save' ? t('modal.generateQR') : t('modal.scanQR')}</h3>
      </div>
      <div className="modal-view-content">
        {mode === 'save' ? (
          <>
            {qrInfo && (
              <div className={`qr-info ${qrInfoFading ? 'fade-out' : ''}`}>
                <p>ℹ️ {qrInfo}</p>
              </div>
            )}
            {qrError ? (
              <div className="qr-error">
                <p style={{ color: '#d9534f', marginBottom: '16px' }}>⚠️ {qrError}</p>
                <button
                  className="action-btn"
                  onClick={handleGenerateQR}
                  type="button"
                >
                  {t('modal.generateQR') || 'Try Again'}
                </button>
              </div>
            ) : safeQRCode ? (
              <>
                <div className="qr-display">
                  {qrPartCount > 1 && (
                    <div style={{ marginBottom: '-14px', marginTop: '-8px', textAlign: 'center' , zIndex: 1}}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {Array.from({ length: qrPartCount }).map((_, index) => {
                          // Calculate dynamic width based on number of parts
                          // qr-display padding removed, so: overlay 20px + modal 30px = 50px each side = 100px total
                          // On wide screens: modal max-width 500px leaves ~400px for indicators
                          // On narrow screens: use viewport minus 100px total for all padding
                          const totalGaps = (qrPartCount - 1) * 8;
                          const maxAvailableWidth = 400;
                          const viewportAvailable = typeof window !== 'undefined' ? window.innerWidth - 100 : 320;
                          const availableWidth = Math.min(maxAvailableWidth, viewportAvailable);
                          const idealWidth = (availableWidth - totalGaps) / qrPartCount;
                          // Clamp between 8px (minimum) and 50px (maximum)
                          const rectWidth = Math.max(8, Math.min(50, idealWidth));
                          
                          return (
                            <div
                              key={index}
                              style={{
                                width: `${rectWidth}px`,
                                minWidth: `${rectWidth}px`,
                                height: '8px',
                                borderRadius: '3px',
                                backgroundColor: index === currentPartIndex ? '#007bff' : '#e0e0e0',
                                transition: 'background-color 0.3s ease',
                                cursor: 'pointer',
                                flexShrink: 0,
                                flexGrow: 0
                              }}
                              onClick={() => setCurrentPartIndex(index)}
                              title={`QR Part ${index + 1} of ${qrPartCount}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div 
                    className="qr-code-container"
                    onClick={() => setQrFullscreen(true)}
                    onTouchStart={handleQRTouchStart}
                    onTouchEnd={handleQRTouchEnd}
                    style={{ cursor: 'pointer', touchAction: 'none' }}
                    title="Click to expand"
                  >
                    {safeQRCode && (
                      <QRCodeErrorBoundary>
                        <SafeQRCodeSVG value={safeQRCode} size={512} />
                      </QRCodeErrorBoundary>
                    )}
                  </div>
                  
                {qrPartCount > 1 && (
                  <div style={{ marginTop: '-14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="action-btn secondary"
                        onClick={() => {
                          setCurrentPartIndex(currentPartIndex === 0 ? qrPartCount - 1 : currentPartIndex - 1);
                        }}
                        type="button"
                        style={{ 
                          maxWidth: '80px',
                          padding: '5px 24px'
                        }}
                      >
                        &lt;&lt;
                      </button>
                      <button
                        className="action-btn secondary"
                        onClick={handleCancelSplit}
                        type="button"
                        disabled={!isManualSplit}
                        style={{ 
                          maxWidth: '100px',
                          padding: '5px 24px',
                          opacity: !isManualSplit ? 0.5 : 1,
                          cursor: !isManualSplit ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {t('common.cancel') || 'Cancel'}
                      </button>
                      <button
                        className="action-btn secondary"
                        onClick={() => {
                          setCurrentPartIndex(currentPartIndex === qrPartCount - 1 ? 0 : currentPartIndex + 1);
                        }}
                        type="button"
                        style={{ 
                          maxWidth: '80px',
                          padding: '5px 24px'
                        }}
                      >
                        &gt;&gt;
                      </button>
                    </div>
                  </div>
                )}

                  <p>{t('message.qrGenerated') || 'Scan this QR code to load vehicle data'}</p>
                
                <button
                  className="action-btn"
                  onClick={handleCannotScan}
                  type="button"
                  disabled={isMinimumQRSizeReached()}
                  style={{ 
                    marginTop: '16px', 
                    backgroundColor: isMinimumQRSizeReached() ? '#ccc' : '#ff9800',
                    cursor: isMinimumQRSizeReached() ? 'not-allowed' : 'pointer',
                    opacity: isMinimumQRSizeReached() ? 0.6 : 1
                  }}
                >
                  {isMinimumQRSizeReached() 
                    ? t('modal.qrMinimumReached') || 'Minimum QR data size reached'
                    : t('modal.cannotScan') || 'Cannot Scan? Split QR'}
                </button>

                <button
                  className="action-btn secondary"
                  onClick={() => {
                    const defaultName = `vehicle_qr_${vehicleLabel}_${Date.now()}`;
                    const fileName = prompt(t('message.enterFileName') || 'Enter file name:', defaultName);
                    if (!fileName) return;
                    
                    const svg = document.querySelector('svg');
                    if (svg) {
                      const size = 1800; // 1800x1800 resolution for high quality export
                      const canvas = document.createElement('canvas');
                      canvas.width = size;
                      canvas.height = size;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        const svgString = new XMLSerializer().serializeToString(svg);
                        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(svgBlob);
                        const img = new Image();
                        img.onload = () => {
                          ctx.fillStyle = 'white';
                          ctx.fillRect(0, 0, size, size);
                          ctx.drawImage(img, 0, 0, size, size);
                          canvas.toBlob((blob: Blob | null) => {
                            if (blob) {
                              const downloadUrl = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = downloadUrl;
                              a.download = `${fileName}.png`;
                              a.click();
                              URL.revokeObjectURL(downloadUrl);
                            }
                            URL.revokeObjectURL(url);
                          }, 'image/png');
                        };
                        img.src = url;
                      }
                    }
                  }}
                  type="button"
                >
                  {t('modal.downloadQR') || 'Download QR Code'}
                </button>
              </div>

                {qrFullscreen && (
                  <div className="qr-fullscreen-overlay" onClick={() => setQrFullscreen(false)}>
                    <div 
                      className="qr-fullscreen-container" 
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={handleQRTouchStart}
                      onTouchEnd={handleQRTouchEnd}
                      style={{ touchAction: 'none' }}
                    >
                      <button 
                        className="qr-fullscreen-close"
                        onClick={() => setQrFullscreen(false)}
                        type="button"
                      >
                        ✕
                      </button>
                      {safeQRCode && (
                        <QRCodeErrorBoundary>
                          <SafeQRCodeSVG 
                            value={safeQRCode} 
                            size={Math.min(window.innerWidth, window.innerHeight) - 60}
                          />
                        </QRCodeErrorBoundary>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p>{t('message.loading') || 'Generating QR code...'}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {!cameraActive ? null : (
              <div className="qr-camera-view">
                {scanSuccessMessage && (
                  <div className={`scan-success-message ${scanSuccessFading ? 'fade-out' : ''}`}>
                    <p style={{ color: '#4caf50' }}>✓ {scanSuccessMessage}</p>
                  </div>
                )}
                {scanErrorMessage && (
                  <div className={`scan-error-message ${scanErrorFading ? 'fade-out' : ''}`}>
                    <p style={{ color: '#f44336' }}>⚠️ {scanErrorMessage}</p>
                  </div>
                )}
                {scannedPartTotal && scannedPartTotal > 1 && (
                  <div style={{ marginBottom: '-4px', marginTop: '-18px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {Array.from({ length: scannedPartTotal }).map((_, index) => {
                        // Make indicators responsive - shrink down to minimum 8px before wrapping
                        // Padding breakdown: overlay 20px + modal 30px = 50px each side (qr-camera-view has no padding)
                        // On wide screens: modal max-width 500px leaves ~400px for indicators
                        // On narrow screens: use viewport minus 100px total for overlay and modal padding
                        const totalGaps = (scannedPartTotal - 1) * 8;
                        const maxAvailableWidth = 400;
                        const viewportAvailable = typeof window !== 'undefined' ? window.innerWidth - 100 : 340;
                        const availableWidth = Math.min(maxAvailableWidth, viewportAvailable);
                        const idealWidth = (availableWidth - totalGaps) / scannedPartTotal;
                        // Clamp between 8px (minimum for thin line) and 50px (maximum for wide view)
                        const rectWidth = Math.max(8, Math.min(50, idealWidth));
                        
                        let bgColor = '#e0e0e0'; // Gray - not scanned
                        if (invalidPartIndex === -1) {
                          // Invalid QR in session
                          bgColor = '#f44336'; // Red - invalid
                        } else if (scannedParts.has(index + 1)) {
                          // This part was successfully scanned
                          bgColor = '#4caf50'; // Green - scanned
                        }
                        
                        return (
                          <div
                            key={index}
                            style={{
                              flex: `0 0 ${rectWidth}px`,
                              width: `${rectWidth}px`,
                              minWidth: `${rectWidth}px`,
                              maxWidth: `${rectWidth}px`,
                              height: '8px',
                              borderRadius: '3px',
                              backgroundColor: bgColor,
                              transition: 'background-color 0.3s ease',
                              flexShrink: 0,
                              flexGrow: 0
                            }}
                            title={`QR Part ${index + 1} of ${scannedPartTotal}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="qr-scanning-message">
                  <p>{t('modal.scanning') || 'Scanning'}<span className="dot dot-1">.</span><span className="dot dot-2">.</span><span className="dot dot-3">.</span></p>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="qr-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="qr-camera-buttons">
                  <button
                    className={`action-btn ${torchEnabled ? 'torch-on' : 'secondary'}`}
                    onClick={handleToggleTorch}
                    type="button"
                    title="Toggle flashlight"
                  >
                    {torchEnabled ? '💡 Flashlight ON' : '🔦 Flashlight'}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLoadImageQR}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="action-btn secondary"
                    onClick={() => imageInputRef.current?.click()}
                    type="button"
                  >
                    {t('modal.loadFromImage') || 'Load from Image'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const renderTemplateView = () => (
    <>
      <div className="modal-view-header">
        <h3>{mode === 'save' ? t('modal.saveAsTemplate') : t('modal.loadTemplate')}</h3>
      </div>
      <div className="modal-view-content">
        {mode === 'save' ? (
          <div className="template-save-form">
            <div className="form-group">
              <label>{t('modal.templateName') || 'Template name:'}</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate();
                  }
                }}
              />
            </div>

            {templates.length > 0 && (
              <div className="existing-templates">
                <h4>{t('modal.existingTemplates') || 'Existing templates:'}</h4>
                <div className="templates-list">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      className="template-item"
                      onClick={async () => {
                        setTemplateName(template.name);
                        // Trigger save immediately with overwrite confirmation
                        if (!confirm(t('confirm.overwriteTemplate') || `Overwrite existing template "${template.name}"?`)) {
                          return;
                        }
                        try {
                          if (template.id) {
                            await deleteVehicleTemplate(template.id);
                          }
                          await saveVehicleTemplate({
                            name: template.name,
                            vehicleLabel: vehicleLabel,
                            data: vehicleData,
                            createdAt: new Date().toISOString(),
                          });
                          alert(t('message.templateSaved') || 'Template saved successfully');
                          onClose();
                        } catch (error) {
                          alert(t('error.savingTemplate') || 'Error saving template');
                        }
                      }}
                      type="button"
                    >
                      <div className="template-info">
                        <h5>{template.name}</h5>
                        <p>{new Date(template.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="template-actions">
                        <div
                          className="btn-small btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }
                          }}
                        >
                          {t('modal.delete')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="action-btn"
              onClick={handleSaveTemplate}
              type="button"
              style={{ marginTop: '16px' }}
            >
              {t('common.save')}
            </button>
          </div>
        ) : (
          <>
            {templates.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center' }}>
                {t('modal.noTemplates') || 'No saved templates'}
              </p>
            ) : (
              <div className="templates-list">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    className="template-item"
                    onClick={() => handleLoadTemplate(template.id)}
                    type="button"
                  >
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{new Date(template.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="template-actions">
                      <div
                        className="btn-small btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }
                        }}
                      >
                        {t('modal.delete')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="vehicle-modal-overlay" onClick={handleOverlayClick}>
      <div className={`vehicle-modal ${vehicleLabel === 'vehicleB' ? 'vehicle-modal-yellow' : ''}`}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {subView === 'main' && renderMainView()}
        {subView === 'qr' && renderQRView()}
        {subView === 'template' && renderTemplateView()}
      </div>
    </div>
  );
};
