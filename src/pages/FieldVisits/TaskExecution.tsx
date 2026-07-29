import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

import { ArrowLeft, Camera, MapPin, CheckSquare, Save, Clock, Navigation, Info, AlertCircle, Upload, Check, RotateCcw } from 'lucide-react';

type FeedbackConfig = { id: string; label: string; actionType: string; };
type RescheduleReason = { id: string; name: string; };
type TimelineItem = { id: string; status: { name: string; isTerminal: boolean }; notes: string; createdAt: string; userId?: string; };

export default function TaskExecution() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<any>(null);
  const [feedbackConfigs, setFeedbackConfigs] = useState<FeedbackConfig[]>([]);
  const [rescheduleReasons, setRescheduleReasons] = useState<RescheduleReason[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  
  const [selectedFeedbackId, setSelectedFeedbackId] = useState('');
  const [selectedRescheduleReasonId, setSelectedRescheduleReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedFeedback = feedbackConfigs.find(c => c.id === selectedFeedbackId);
  const isCompleted = task?.status?.isTerminal;

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [taskRes, feedbackRes, reschedRes] = await Promise.all([
          apiClient.get(`/field-visits/tasks/${taskId}`),
          apiClient.get('/field-visits/configs/feedback'),
          apiClient.get('/field-visits/configs/reschedule-reasons'),
        ]);
        setTask(taskRes.data);
        setFeedbackConfigs(feedbackRes.data);
        setRescheduleReasons(reschedRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => setGpsError('GPS not available: ' + err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsError('Geolocation not supported by this browser');
    }
  }, [taskId]);

  const handleAccept = async () => {
    try {
      await apiClient.patch(`/field-visits/tasks/${taskId}/status`, { statusCode: 'ACCEPTED', notes: 'Task accepted by agent' });
      const res = await apiClient.get(`/field-visits/tasks/${taskId}`);
      setTask(res.data);
    } catch { alert('Error accepting task'); }
  };

  const handleStartVisit = async () => {
    try {
      await apiClient.patch(`/field-visits/tasks/${taskId}/status`, { statusCode: 'IN_PROGRESS', notes: 'Agent started the visit' });
      const res = await apiClient.get(`/field-visits/tasks/${taskId}`);
      setTask(res.data);
    } catch { alert('Error starting visit'); }
  };

  const startCamera = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      } catch (err) {
        // Fallback to any available camera if environment facing is not available (e.g. on laptops)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCapturing(true);
    } catch (e) {
      alert('Camera access denied or not available on this device/browser.');
    }
  };

  const capturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      alert("Camera is still initializing, please wait a second and try again.");
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    
    if (dataUrl === 'data:,') {
      alert("Failed to capture image. Please try again.");
      return;
    }
    
    setPhotos(prev => [...prev, dataUrl]);
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCapturing(false);
  };

  const removePhoto = (i: number) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedbackId) { alert('Please select a feedback outcome'); return; }
    if (task?.gpsRequired && !position) { alert('GPS location is required for this visit. Please enable location access.'); return; }
    if (selectedFeedback?.actionType === 'RESCHEDULE' && !nextVisitDate) { alert('Please select a next visit date for rescheduling'); return; }
    
    setSubmitting(true);
    try {
      await apiClient.post(`/field-visits/tasks/${taskId}/execute`, {

        feedbackConfigId: selectedFeedbackId,
        rescheduleReasonId: selectedRescheduleReasonId || undefined,
        latitude: position?.lat,
        longitude: position?.lng,
        address: position ? `GPS: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : null,
        photos,
        notes,
        nextVisitDate: nextVisitDate || undefined,
      });
      alert('Visit recorded successfully!');
      navigate('/field-visits/my-tasks');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to submit visit');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultChecklist = [
    'Confirmed customer identity with valid ID',
    'Verified the address matches records',
    'Checked premises/collateral',
    'Collected/verified required documents',
    'Discussed repayment schedule',
    'Obtained customer acknowledgment',
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
      Loading task details...
    </div>
  );

  if (!task) return (
    <div style={{ padding: '24px', color: '#D0021B' }}>Task not found</div>
  );

  const statusColors: Record<string, string> = {
    PENDING: '#F5A623', ACCEPTED: '#4A90E2', IN_PROGRESS: '#7B00D4',
    COMPLETED: '#7ED321', RESCHEDULED: '#F5A623', CANCELLED: '#D0021B'
  };
  const statusColor = statusColors[task.status?.code] || '#fff';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
      <button onClick={() => navigate('/field-visits/my-tasks')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', fontSize: '1.05rem' }}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{task.title}</h1>
            <span style={{ padding: '6px 14px', borderRadius: '20px', fontWeight: 600, backgroundColor: `${statusColor}22`, color: statusColor, fontSize: '0.95rem' }}>
              {task.status?.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>ID: <strong style={{ color: 'var(--text-primary)' }}>{task.taskNumber}</strong></span>
            <span>Type: <strong style={{ color: 'var(--text-primary)' }}>{task.taskType?.name}</strong></span>
            {task.priority && <span>Priority: <strong style={{ color: task.priority.color }}>{task.priority.name}</strong></span>}
            {task.riskLevel && <span>Risk: <strong style={{ color: task.riskLevel.color }}>{task.riskLevel.name}</strong></span>}
            {task.dueDate && <span>Due: <strong style={{ color: new Date(task.dueDate) < new Date() ? '#D0021B' : 'var(--text-primary)' }}>{new Date(task.dueDate).toLocaleDateString('en-IN')}</strong></span>}
          </div>
        </div>

        {/* Action buttons based on status */}
        {task.status?.code === 'PENDING' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleAccept} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={18} /> Accept Task
            </button>
          </div>
        )}
        {task.status?.code === 'ACCEPTED' && (
          <button className="btn btn-primary" onClick={handleStartVisit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} /> Start Visit
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Main Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Manager Notes */}
          {task.managerNotes && (
            <div style={{ padding: '16px', backgroundColor: 'rgba(0,112,243,0.08)', border: '1px solid rgba(0,112,243,0.25)', borderRadius: '12px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--accent-sapphire)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} /> Manager's Instructions
              </div>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.6 }}>{task.managerNotes}</p>
            </div>
          )}

          {/* GPS Status */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={24} color={position ? '#7ED321' : gpsError ? '#D0021B' : '#F5A623'} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>GPS Location {task.gpsRequired && <span style={{ color: '#D0021B' }}>*</span>}</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  {position
                    ? `✓ Location acquired: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
                    : gpsError
                    ? `⚠ ${gpsError}`
                    : '⏳ Acquiring GPS location...'}
                </div>
              </div>
              {!position && !gpsError && (
                <div style={{ marginLeft: 'auto', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-sapphire)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <CheckSquare size={22} color="var(--accent-sapphire)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Visit Checklist</h2>
              <div title="Complete each step before submitting. This is an audit record." style={{ cursor: 'help', color: 'var(--accent-sapphire)', marginLeft: 'auto' }}>
                <Info size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {defaultChecklist.map((item, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', backgroundColor: checklist[i] ? 'rgba(126,211,33,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checklist[i] ? 'rgba(126,211,33,0.3)' : 'var(--panel-border)'}`, transition: 'all 0.2s' }}>
                  <input
                    type="checkbox"
                    checked={!!checklist[i]}
                    onChange={e => setChecklist(prev => ({ ...prev, [i]: e.target.checked }))}
                    style={{ width: '20px', height: '20px', accentColor: '#7ED321', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '1.05rem', textDecoration: checklist[i] ? 'line-through' : 'none', color: checklist[i] ? 'var(--text-muted)' : 'var(--text-primary)' }}>{item}</span>
                  {checklist[i] && <Check size={18} color="#7ED321" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                </label>
              ))}
            </div>
          </div>

          {/* Photo Evidence */}
          <div className="panel" style={{ pointerEvents: isCompleted ? 'none' : 'auto', opacity: isCompleted ? 0.7 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Camera size={22} color="var(--accent-sapphire)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Photo Evidence</h2>
              <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{photos.length} photo(s) captured</span>
            </div>
            
            {isCapturing ? (
              <div style={{ position: 'relative' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }}></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ padding: '12px 24px', fontSize: '1.1rem' }}>📸 Capture</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: photos.length > 0 ? '16px' : 0 }}>
                  {photos.map((photo, i) => (
                    <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                      <img src={photo} alt={`Photo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(208,2,27,0.8)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>×</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} /> Take Photo
                </button>
              </div>
            )}
          </div>

          {/* Execution Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} id="execution-form">
            <div className="panel" style={{ pointerEvents: isCompleted ? 'none' : 'auto', opacity: isCompleted ? 0.7 : 1 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Visit Outcome</h2>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Feedback / Outcome * ({feedbackConfigs.length} options from DB)</label>
                <select
                  className="form-control"
                  style={{ fontSize: '1.05rem', padding: '12px' }}
                  value={selectedFeedbackId}
                  onChange={e => setSelectedFeedbackId(e.target.value)}
                  required
                >
                  <option value="">-- Select Visit Outcome --</option>
                  {feedbackConfigs.map(c => (
                    <option key={c.id} value={c.id}>{c.label} — [{c.actionType}]</option>
                  ))}
                </select>
              </div>

              {selectedFeedback?.actionType === 'RESCHEDULE' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '16px' }}>
                    <label className="form-label">Reschedule Reason * ({rescheduleReasons.length} from DB)</label>
                    <select className="form-control" value={selectedRescheduleReasonId} onChange={e => setSelectedRescheduleReasonId(e.target.value)}>
                      <option value="">-- Select Reason --</option>
                      {rescheduleReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '16px' }}>
                    <label className="form-label">Next Visit Date *</label>
                    <input type="date" className="form-control" value={nextVisitDate} onChange={e => setNextVisitDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: 0, marginTop: '16px' }}>
                <label className="form-label">Agent Notes</label>
                <textarea className="form-control" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe what happened during the visit..."></textarea>
              </div>

              {!isCompleted && (
                <button type="submit" form="execution-form" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.15rem', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                  <Save size={20} />
                  {submitting ? 'Submitting...' : 'Submit Visit Report'}
                </button>
              )}

              {isCompleted && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#7ED321', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  ✓ This visit has been completed. No further actions required.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Panel - Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Customer Info */}
          {task.customer && (
            <div className="panel">
              <h3 style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '1.1rem' }}>Customer Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>{task.customer.fullName}</strong></div>
                {task.customer.accountNumber && <div>Account: {task.customer.accountNumber}</div>}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="panel" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Clock size={20} color="var(--accent-sapphire)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Activity Timeline</h2>
            </div>
            
            <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--panel-border)' }}>
              {task.timeline?.map((event: TimelineItem, i: number) => (
                <div key={event.id} style={{ position: 'relative', marginBottom: i < task.timeline.length - 1 ? '24px' : 0 }}>
                  <div style={{ position: 'absolute', left: '-26px', top: '6px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: event.status?.isTerminal ? '#7ED321' : statusColors[event.status?.name?.toUpperCase()] || 'var(--accent-sapphire)', border: '2px solid var(--panel-bg)' }}></div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{event.status?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {new Date(event.createdAt).toLocaleString('en-IN')}
                  </div>
                  {event.notes && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{event.notes}"</div>}
                </div>
              ))}

              {(!task.timeline || task.timeline.length === 0) && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', paddingLeft: '8px' }}>No timeline events yet.</div>
              )}
            </div>
          </div>

          {/* Instructions */}
          {task.description && (
            <div className="panel" style={{ backgroundColor: 'rgba(245,166,35,0.05)', borderColor: 'rgba(245,166,35,0.2)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '8px', color: '#F5A623' }}>📋 Visit Instructions</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>{task.description}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
