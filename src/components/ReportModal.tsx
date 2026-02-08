import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AccidentReport,
  type SavedAccidentReport,
  saveAccidentReport,
  getAllAccidentReports,
  getAccidentReport,
  deleteAccidentReport,
  updateAccidentReport,
} from '../utils/storage';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  mode: 'save' | 'load';
  formData: AccidentReport;
  onClose: () => void;
  onLoadData: (data: AccidentReport) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  mode,
  formData,
  onClose,
  onLoadData,
}) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<SavedAccidentReport[]>([]);
  const [reportName, setReportName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && mode === 'save') {
      loadReports();
    } else if (isOpen && mode === 'load') {
      loadReports();
    }
  }, [isOpen, mode]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const allReports = await getAllAccidentReports();
      setReports(allReports);
    } catch (error) {
      console.error('Error loading accident reports:', error);
      alert(t('error.loadingReports') || 'Error loading reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      alert('Please enter a report name');
      return;
    }

    try {
      // Check if report with this name already exists
      const existingReport = reports.find(
        (rpt) => rpt.name.toLowerCase() === reportName.toLowerCase()
      );

      if (existingReport && existingReport.id) {
        // Overwrite existing report
        if (!confirm(t('confirm.overwriteReport') || `Overwrite existing report "${reportName}"?`)) {
          return;
        }
        await updateAccidentReport(existingReport.id, {
          name: reportName,
          data: formData,
          createdAt: existingReport.createdAt,
        });
      } else {
        // Save new report
        await saveAccidentReport({
          name: reportName,
          data: formData,
          createdAt: new Date().toISOString(),
        });
      }

      alert(t('message.reportSaved') || 'Report saved successfully');
      setReportName('');
      await loadReports();
      onClose();
    } catch (error) {
      console.error('Error saving report:', error);
      alert(t('error.savingReport') || 'Error saving report');
    }
  };

  const handleLoadReport = async (reportId: number | undefined) => {
    if (!reportId) return;
    try {
      const report = await getAccidentReport(reportId);
      if (report) {
        onLoadData(report.data);
        onClose();
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert(t('error.loadingReport') || 'Error loading report');
    }
  };

  const handleDeleteReport = async (reportId: number | undefined) => {
    if (!reportId) return;
    if (!confirm(t('confirm.deleteReport') || 'Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await deleteAccidentReport(reportId);
      await loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert(t('error.deletingReport') || 'Error deleting report');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>{mode === 'save' ? t('modal.saveReport') || 'Save Report' : t('modal.loadReport') || 'Load Report'}</h2>
          <button className="report-modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="report-modal-content">
          {mode === 'save' ? (
            <div className="report-save-form">
              <div className="form-group">
                <label>{t('modal.reportName') || 'Report name:'}</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder={t('modal.reportNamePlaceholder') || 'Enter report name'}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveReport();
                    }
                  }}
                />
              </div>

              {reports.length > 0 && (
                <div className="existing-reports">
                  <h4>{t('modal.existingReports') || 'Existing reports:'}</h4>
                  <div className="reports-list">
                    {reports.map((report) => (
                      <button
                        key={report.id}
                        className="report-item"
                        onClick={() => {
                          setReportName(report.name);
                          // Trigger save immediately with overwrite confirmation
                          if (!confirm(t('confirm.overwriteReport') || `Overwrite existing report "${report.name}"?`)) {
                            return;
                          }
                          (async () => {
                            try {
                              if (report.id) {
                                await updateAccidentReport(report.id, {
                                  name: report.name,
                                  data: formData,
                                  createdAt: report.createdAt,
                                });
                              }
                              alert(t('message.reportSaved') || 'Report saved successfully');
                              await loadReports();
                              onClose();
                            } catch (error) {
                              alert(t('error.savingReport') || 'Error saving report');
                            }
                          })();
                        }}
                        type="button"
                      >
                        <div className="report-info">
                          <h5>{report.name}</h5>
                          <p>{new Date(report.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="report-actions">
                          <div
                            className="btn-small btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                handleDeleteReport(report.id);
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
                onClick={handleSaveReport}
                type="button"
                style={{ marginTop: '16px' }}
              >
                {t('common.save')}
              </button>
            </div>
          ) : (
            <>
              {isLoading ? (
                <p>{t('modal.loading') || 'Loading...'}</p>
              ) : reports.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center' }}>
                  {t('modal.noReports') || 'No saved reports'}
                </p>
              ) : (
                <div className="reports-list">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      className="report-item"
                      onClick={() => handleLoadReport(report.id)}
                      type="button"
                    >
                      <div className="report-info">
                        <h5>{report.name}</h5>
                        <p>{new Date(report.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="report-actions">
                        <div
                          className="btn-small btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              handleDeleteReport(report.id);
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
      </div>
    </div>
  );
};
