import React, { useState } from 'react';

function LemiGuide({ onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState("residence-permit");
  const [activeBottomTab, setActiveBottomTab] = useState("guide");

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

  // Top tabs for different guide types
  const guideTabs = [
    { id: "residence-permit", label: "Residence Permit", emoji: "🏛️" },
    { id: "housing", label: "Housing", emoji: "🏠" },
    { id: "banking", label: "Banking", emoji: "💳" },
    { id: "healthcare", label: "Healthcare", emoji: "🏥" },
    { id: "transport", label: "Transport", emoji: "🚇" },
  ];

  // Bottom navigation tabs
  const bottomTabs = [
    { id: "guide", label: "Guide", emoji: "📋" },
    { id: "documents", label: "Documents", emoji: "📄" },
    { id: "deadlines", label: "Deadlines", emoji: "⏰" },
    { id: "resources", label: "Resources", emoji: "🔗" },
  ];

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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.bg,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
    }}>
      
      {/* Header with Back Button */}
      <div style={{
        background: 'white',
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          color: theme.text,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
        }}>
          ← 
        </button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>🧭 Lemi Guide</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>Your roadmap to navigating France</div>
        </div>
      </div>

      {/* Top Tabs (Horizontal Scroll) */}
      <div style={{
        background: 'white',
        borderBottom: `2px solid ${theme.border}`,
        overflowX: 'auto',
        display: 'flex',
        padding: '0 12px',
        gap: 8,
      }}>
        {guideTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 700 : 600,
              color: activeTab === tab.id ? theme.primary : theme.textMuted,
              borderBottom: activeTab === tab.id ? `3px solid ${theme.primary}` : '3px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area (Scrollable) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        paddingBottom: 100, // Space for bottom nav
      }}>
        {activeBottomTab === "guide" && renderGuideContent()}
        {activeBottomTab === "documents" && renderDocumentsContent()}
        {activeBottomTab === "deadlines" && renderDeadlinesContent()}
        {activeBottomTab === "resources" && renderResourcesContent()}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0 20px 0',
        zIndex: 10,
      }}>
        {bottomTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveBottomTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '8px 16px',
              flex: 1,
            }}
          >
            <span style={{ fontSize: 24 }}>{tab.emoji}</span>
            <span style={{
              fontSize: 11,
              fontWeight: activeBottomTab === tab.id ? 700 : 500,
              color: activeBottomTab === tab.id ? theme.primary : theme.textMuted,
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Render functions for different bottom tabs
  function renderGuideContent() {
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
      <>
        {/* Progress Header */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
          padding: 20,
          borderRadius: 12,
          color: 'white',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Your Progress</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>
            {userContext.stepsCompleted} of {userContext.totalSteps} Steps
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 999,
            height: 8,
            overflow: 'hidden',
            marginBottom: 8,
          }}>
            <div style={{
              background: 'white',
              width: `${progressPercentage}%`,
              height: '100%',
              borderRadius: 999,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{progressPercentage}% complete</div>
        </div>

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
      </>
    );
  }

  function renderDocumentsContent() {
    const documents = [
      { id: 1, name: "Valid Passport", status: "uploaded", size: "2.4 MB", date: "2024-11-01" },
      { id: 2, name: "Current Residence Permit", status: "uploaded", size: "1.8 MB", date: "2024-11-01" },
      { id: 3, name: "Student Certificate", status: "pending", size: "-", date: "-" },
      { id: 4, name: "Proof of Residence", status: "missing", size: "-", date: "-" },
      { id: 5, name: "Bank Statements (3 months)", status: "missing", size: "-", date: "-" },
      { id: 6, name: "Passport Photos", status: "uploaded", size: "0.5 MB", date: "2024-11-10" },
    ];

    return (
      <>
        <div style={{
          background: theme.card,
          padding: 20,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, marginBottom: 16 }}>
            📄 Your Documents
          </div>
          <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 16 }}>
            Keep all your important documents organized in one place.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                background: theme.bg,
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                    {doc.status === 'uploaded' && '✅ '}
                    {doc.status === 'pending' && '⏳ '}
                    {doc.status === 'missing' && '❌ '}
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>
                    {doc.status === 'uploaded' && `${doc.size} • Uploaded ${doc.date}`}
                    {doc.status === 'pending' && 'Waiting for upload'}
                    {doc.status === 'missing' && 'Required document'}
                  </div>
                </div>
                {doc.status !== 'uploaded' && (
                  <button style={{
                    background: theme.primary,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                    Upload
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button style={{
          background: theme.primary,
          color: 'white',
          border: 'none',
          padding: '14px 24px',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 900,
          cursor: 'pointer',
          width: '100%',
        }}>
          + Add New Document
        </button>
      </>
    );
  }

  function renderDeadlinesContent() {
    const deadlines = [
      { id: 1, title: "Residence Permit Expiration", date: "2026-03-15", daysLeft: 75, priority: "critical" },
      { id: 2, title: "Prefecture Appointment", date: "2025-12-20", daysLeft: 26, priority: "high" },
      { id: 3, title: "Student Certificate Request", date: "2025-12-10", daysLeft: 16, priority: "medium" },
      { id: 4, title: "Financial Documents Preparation", date: "2025-12-15", daysLeft: 21, priority: "medium" },
    ];

    return (
      <>
        <div style={{
          background: theme.card,
          padding: 20,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, marginBottom: 16 }}>
            ⏰ Upcoming Deadlines
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {deadlines.map((deadline) => {
              const priorityColor = 
                deadline.priority === 'critical' ? theme.danger :
                deadline.priority === 'high' ? theme.warning :
                theme.textMuted;

              return (
                <div key={deadline.id} style={{
                  padding: 16,
                  background: deadline.priority === 'critical' ? '#FEF3C7' : theme.bg,
                  borderRadius: 10,
                  border: `2px solid ${deadline.priority === 'critical' ? theme.warning : theme.border}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                        {deadline.title}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textMuted }}>
                        {deadline.date}
                      </div>
                    </div>
                    <div style={{
                      background: priorityColor,
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {deadline.daysLeft} days
                    </div>
                  </div>
                  {deadline.priority === 'critical' && (
                    <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                      ⚠️ Action required soon!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button style={{
          background: theme.primary,
          color: 'white',
          border: 'none',
          padding: '14px 24px',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 900,
          cursor: 'pointer',
          width: '100%',
        }}>
          + Add New Deadline
        </button>
      </>
    );
  }

  function renderResourcesContent() {
    const resources = [
      {
        category: "Official Websites",
        items: [
          { title: "Prefecture de Police Paris", url: "https://www.prefecturedepolice.interieur.gouv.fr", description: "Book appointments and track applications" },
          { title: "ANEF (French Immigration Portal)", url: "https://administration-etrangers-en-france.interieur.gouv.fr", description: "Manage your residence permit online" },
          { title: "Campus France", url: "https://www.campusfrance.org", description: "Official student resources" },
        ]
      },
      {
        category: "Helpful Guides",
        items: [
          { title: "VLS-TS Renewal Step-by-Step", url: "#", description: "Complete walkthrough for students" },
          { title: "Required Documents Checklist", url: "#", description: "Downloadable PDF checklist" },
          { title: "Prefecture Tips & Tricks", url: "#", description: "Advice from other students" },
        ]
      },
      {
        category: "Community Support",
        items: [
          { title: "Lemi Paris Discord", url: "#", description: "Chat with other international students" },
          { title: "Weekly Q&A Sessions", url: "#", description: "Join our live support calls" },
          { title: "Success Stories", url: "#", description: "Learn from students who succeeded" },
        ]
      },
    ];

    return (
      <>
        {resources.map((section, idx) => (
          <div key={idx} style={{
            background: theme.card,
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: theme.text, marginBottom: 16 }}>
              {section.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section.items.map((item, itemIdx) => (
                <a
                  key={itemIdx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: 14,
                    background: theme.bg,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                    🔗 {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>
                    {item.description}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          padding: 16,
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
      </>
    );
  }
}

export default LemiGuide;
