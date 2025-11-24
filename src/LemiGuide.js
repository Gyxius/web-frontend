import React, { useState } from 'react';

function LemiGuide({ onClose, currentUser }) {
  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#E5E7EB",
    border: "#D1D5DB",
    danger: "#EA2B2B",
    warning: "#F59E0B",
    success: "#10B981",
  };

  // Sample user context data - in production, this would come from the user's profile
  const userContext = {
    appStatus: "Lemi Guide",
    userStatus: "Renewing VLS-TS Residence Permit (Non-EU Student)",
    location: "Paris, Île-de-France",
    totalSteps: 16,
    stepsCompleted: 3,
    criticalDeadline: "2026-03-15",
    daysRemaining: 75,
  };

  const progressPercentage = Math.round((userContext.stepsCompleted / userContext.totalSteps) * 100);

  const tasks = [
    { id: 1, title: "Schedule Your Prefecture Appointment", status: "completed", description: "Book your appointment online through the prefecture website" },
    { id: 2, title: "Gather Required Documents", status: "completed", description: "Collect passport, current residence permit, proof of enrollment, and proof of residence" },
    { id: 3, title: "Get Your Passport Photos", status: "completed", description: "Take 2 recent ID photos that meet French requirements" },
    { id: 4, title: "Obtain Proof of Residence", status: "in-progress", description: "Get a utility bill or rent receipt dated within the last 3 months" },
    { id: 5, title: "Request Your Student Certificate", status: "pending", description: "Ask your university for an enrollment certificate (certificat de scolarité)" },
    { id: 6, title: "Prepare Financial Documents", status: "pending", description: "Bank statements showing sufficient funds for the past 3 months" },
    { id: 7, title: "Fill Out the Application Form", status: "pending", description: "Complete the CERFA form for residence permit renewal" },
    { id: 8, title: "Pay the Application Fee", status: "pending", description: "Purchase tax stamps (timbre fiscal) worth €225" },
    { id: 9, title: "Make Document Copies", status: "pending", description: "Photocopy all original documents for submission" },
    { id: 10, title: "Attend Prefecture Appointment", status: "pending", description: "Bring all documents to your scheduled appointment" },
    { id: 11, title: "Submit Biometric Data", status: "pending", description: "Provide fingerprints and photo at the prefecture" },
    { id: 12, title: "Receive Receipt (Récépissé)", status: "pending", description: "Get your temporary residence authorization" },
    { id: 13, title: "Wait for Processing", status: "pending", description: "Track your application status online (typically 2-3 months)" },
    { id: 14, title: "Receive Notification", status: "pending", description: "Check for SMS/email about your residence permit approval" },
    { id: 15, title: "Pick Up Your Residence Permit", status: "pending", description: "Collect your new residence card from the prefecture" },
    { id: 16, title: "Activate Your Permit Online", status: "pending", description: "Validate your residence permit on the government website" },
  ];

  const nextTask = tasks.find(t => t.status === "in-progress") || tasks.find(t => t.status === "pending");

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return theme.success;
      case "in-progress": return theme.warning;
      case "pending": return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return "✅";
      case "in-progress": return "🔄";
      case "pending": return "⏳";
      default: return "📝";
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      zIndex: 2000,
      overflowY: 'auto',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: theme.bg,
        borderRadius: 16,
        maxWidth: 600,
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
          padding: '20px 24px',
          borderRadius: '16px 16px 0 0',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>🧭 {userContext.appStatus}</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>Your Guide</div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: 24,
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>×</button>
          </div>
          
          {/* Progress Bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, opacity: 0.9 }}>
              <span>Progress</span>
              <span>{userContext.stepsCompleted} of {userContext.totalSteps} completed</span>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 999,
              height: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                background: 'white',
                width: `${progressPercentage}%`,
                height: '100%',
                borderRadius: 999,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>{progressPercentage}% complete</div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Welcome Card */}
          <div style={{
            background: theme.card,
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, marginBottom: 12 }}>
              👋 Hello, {currentUser?.name || 'Student'}!
            </div>
            <div style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.6, marginBottom: 12 }}>
              You're currently working on: <strong style={{ color: theme.text }}>{userContext.userStatus}</strong>
            </div>
            <div style={{
              background: '#FEF3C7',
              border: '2px solid #F59E0B',
              padding: 12,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Critical Deadline</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#92400E' }}>{userContext.criticalDeadline} ({userContext.daysRemaining} days remaining)</div>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              background: theme.card,
              padding: 16,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: theme.primary }}>{userContext.stepsCompleted}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Steps Done</div>
            </div>
            <div style={{
              background: theme.card,
              padding: 16,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: theme.warning }}>{userContext.totalSteps - userContext.stepsCompleted}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Steps Left</div>
            </div>
            <div style={{
              background: theme.card,
              padding: 16,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: theme.danger }}>{userContext.daysRemaining}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Days Left</div>
            </div>
          </div>

          {/* Next Action */}
          {nextTask && (
            <div style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              padding: 20,
              borderRadius: 12,
              color: 'white',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>🎯 Your Next Step</div>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{nextTask.title}</div>
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 16 }}>{nextTask.description}</div>
              <button style={{
                background: 'white',
                color: theme.primaryDark,
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                width: '100%',
              }}>
                Start This Step →
              </button>
            </div>
          )}

          {/* Tasks List */}
          <div style={{
            background: theme.card,
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, marginBottom: 16 }}>
              📋 All Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.map((task) => (
                <div key={task.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 12,
                  background: task.status === 'completed' ? '#F0FDF4' : theme.bg,
                  borderRadius: 8,
                  border: `1px solid ${task.status === 'in-progress' ? theme.warning : theme.border}`,
                  opacity: task.status === 'completed' ? 0.7 : 1,
                }}>
                  <div style={{ fontSize: 20, marginTop: 2 }}>{getStatusIcon(task.status)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: theme.text,
                      marginBottom: 4,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}>
                      {task.id}. {task.title}
                    </div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>
                      {task.description}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: getStatusColor(task.status),
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {task.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Help */}
          <div style={{
            marginTop: 20,
            padding: 16,
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: '#1E40AF', marginBottom: 8 }}>
              💡 <strong>Need Help?</strong>
            </div>
            <div style={{ fontSize: 13, color: '#1E40AF' }}>
              Contact Lemi support for personalized guidance with your residence permit renewal.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LemiGuide;
