import React, { useState } from "react";
import users from "./users";

function UserProfile({ user, currentUser, getUserPoints, onBack, onAddFollow, isFollowing, hasPendingRequest, incomingRequest, onAcceptFollowRequest, onDeclineFollowRequest, onRequestJoinEvent, joinedEvents, onRemoveFollow, followingCount = 0, followerCount = 0, followers = [], following = [], onUserClick }) {
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  
  if (!user) return null;
  
  // If user object is incomplete (like from host), look up full user data
  let fullUser = user;
  if (!user.desc && !user.bio && user.name) {
    const foundUser = users.find(u => u.name === user.name || u.username === user.name);
    if (foundUser) {
      fullUser = { ...foundUser, ...user };
    }
  }

  // Merge any locally cached profile (saved by EditMyProfile) so clicking attendees shows full details
  try {
    const lookupKey = fullUser.username || fullUser.name;
    const raw = lookupKey ? localStorage.getItem(`userProfile_${lookupKey}`) : null;
    if (raw) {
      const localProfile = JSON.parse(raw);
      fullUser = { ...fullUser, ...localProfile };
    }
  } catch (e) {
    // ignore parse errors
  }

  // Get real-time points from localStorage
  const realPoints = getUserPoints ? getUserPoints(fullUser.name || fullUser.username) : fullUser.points || 0;
  
  // Check if viewing own profile
  const currentUserKey = currentUser?.username || currentUser?.name;
  const viewedUserKey = fullUser.username || fullUser.name;
  const isOwnProfile = currentUserKey === viewedUserKey;

  // Theme matching Login.js preview
  const theme = {
    bg: "#F7F7F5",
    card: "#FFFFFF",
    text: "#1F2937",
    textMuted: "#6B7280",
    primary: "#58CC02",
    primaryDark: "#37B300",
    accent: "#1CB0F6",
    border: "#EEF2F7",
    shadow: "0 10px 24px rgba(0,0,0,0.06)",
    radius: 18,
  };
  
  const avatarUrl = fullUser.avatar && fullUser.avatar.provider === 'dicebear'
    ? `https://api.dicebear.com/6.x/${fullUser.avatar.style}/svg?seed=${encodeURIComponent(fullUser.avatar.seed)}`
    : null;

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 24, background: theme.bg, borderRadius: theme.radius, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
      <button style={{ marginBottom: 20, padding: '10px 18px', background: theme.primary, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 15 }} onClick={onBack}>
        ← Back
      </button>
      
      <div style={{ background: theme.card, padding: 32, borderRadius: theme.radius, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          {fullUser.avatar && fullUser.avatar.provider === 'emoji' ? (
            <div style={{ fontSize: 70, marginBottom: 16 }}>{fullUser.avatar.emoji || fullUser.emoji}</div>
          ) : fullUser.avatar && fullUser.avatar.provider === 'dicebear' ? (
            <img src={avatarUrl} alt="avatar" style={{ width: 110, height: 110, borderRadius: '50%', marginBottom: 16, border: `5px solid ${theme.primary}` }} />
          ) : fullUser.avatar && fullUser.avatar.provider === 'custom' ? (
            <img src={fullUser.avatar.url} alt="custom avatar" style={{ width: 110, height: 110, borderRadius: '50%', marginBottom: 16, objectFit: 'cover', border: `5px solid ${theme.primary}` }} />
          ) : (
            <div style={{ fontSize: 70, marginBottom: 16 }}>{fullUser.emoji || '👤'}</div>
          )}
          <h3 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: theme.text }}>{fullUser.firstName || fullUser.name}</h3>
          <p style={{ fontSize: 14, color: theme.textMuted, margin: 0 }}>@{fullUser.username || fullUser.name}</p>
        </div>

        {(fullUser.desc || fullUser.bio) && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: theme.text, margin: 0 }}>{fullUser.desc || fullUser.bio}</p>
          </div>
        )}

        {fullUser.interests && fullUser.interests.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 8 }}>INTERESTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(Array.isArray(fullUser.interests) ? fullUser.interests : [fullUser.interests]).map((interest, idx) => (
                <span key={idx} style={{ padding: '6px 14px', background: theme.primary, color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {fullUser.languages && fullUser.languages.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 8 }}>LANGUAGES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(Array.isArray(fullUser.languages) ? fullUser.languages : [fullUser.languages]).map((lang, idx) => (
                <span key={idx} style={{ padding: '6px 14px', background: theme.accent, color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {lang}{fullUser.languageLevels && fullUser.languageLevels[lang] ? ` (${fullUser.languageLevels[lang]})` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {(fullUser.university || fullUser.degree || fullUser.major) && (
          <div style={{ marginTop: 24, padding: 16, background: theme.bg, borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 6 }}>ACADEMIC</div>
            <p style={{ fontSize: 14, color: theme.text, margin: 0 }}>
              {[fullUser.university, fullUser.degree, fullUser.major].filter(Boolean).join(' • ')}
            </p>
          </div>
        )}

        {(fullUser.age || fullUser.house || fullUser.building || fullUser.residence || fullUser.homeCountries || fullUser.citeStatus || (fullUser.cityReasons && fullUser.cityReasons.length)) && (
          <div style={{ marginTop: 16, padding: 16, background: theme.bg, borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 8 }}>DETAILS</div>
            {fullUser.age && <div style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>🎂 Age: {fullUser.age}</div>}
            {(fullUser.house || fullUser.building || fullUser.residence) && (
              <div style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>🏠 House: {fullUser.house || fullUser.building || fullUser.residence}</div>
            )}
            {fullUser.citeStatus && (
              <div style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>🏫 Cité Status: {({
                yes: 'Lives on campus',
                alumni: 'Alumni (lived before)',
                visit: 'Visits often',
                no: 'Not connected'
              })[fullUser.citeStatus] || fullUser.citeStatus}</div>
            )}
            {fullUser.homeCountries && fullUser.homeCountries.length > 0 && (
              <div style={{ fontSize: 14, color: theme.text, marginBottom: 4 }}>
                🌍 Home: {Array.isArray(fullUser.homeCountries) ? fullUser.homeCountries.join(', ') : fullUser.homeCountries}
              </div>
            )}
            {fullUser.cityReasons && fullUser.cityReasons.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 4 }}>WHY HERE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {fullUser.cityReasons.map((r, idx) => (
                    <span key={idx} style={{ padding: '4px 10px', background: theme.primaryDark, color: 'white', borderRadius: 14, fontSize: 12, fontWeight: 600 }}>{r.replace(/^([🎓📚💼✈️🏘️🌍]\s*)/, '')}</span>
                  ))}
                </div>
              </div>
            )}
            {realPoints > 0 && <div style={{ fontSize: 14, color: theme.text, marginTop: 6 }}>⭐ Points: {realPoints}</div>}
          </div>
        )}

        {/* Follower/Following stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 24, paddingTop: 16, borderTop: `2px solid ${theme.border}` }}>
          <div 
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setShowFollowersList(true)}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>{followerCount}</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Followers</div>
          </div>
          <div 
            style={{ textAlign: 'center', cursor: 'pointer' }}
            onClick={() => setShowFollowingList(true)}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>{followingCount}</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>Following</div>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && !isFollowing && !hasPendingRequest && !incomingRequest && (
          <button 
            style={{ 
              width: '100%', 
              marginTop: 24, 
              padding: '14px', 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`, 
              color: 'white', 
              border: 'none', 
              borderRadius: 14, 
              fontWeight: 900, 
              fontSize: 16, 
              cursor: 'pointer', 
              boxShadow: '0 10px 22px rgba(88,204,2,0.28)' 
            }} 
            onClick={() => onAddFollow && onAddFollow(user)}
          >
            Follow
          </button>
        )}
        
        {!isOwnProfile && hasPendingRequest && !isFollowing && (
          <div style={{ marginTop: 24, padding: 16, background: '#FEF3C7', borderRadius: 12, textAlign: 'center', color: '#92400E', fontWeight: 600 }}>
            Follow request sent. Waiting for acceptance.
          </div>
        )}
        
        {!isOwnProfile && incomingRequest && !isFollowing && (
          <div style={{ marginTop: 24 }}>
            <div style={{ padding: 12, background: '#DBEAFE', borderRadius: 12, textAlign: 'center', color: '#1E40AF', fontWeight: 600, marginBottom: 12 }}>
              You have a follow request!
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: theme.primary, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 12, 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }} 
                onClick={() => onAcceptFollowRequest && onAcceptFollowRequest(user)}
              >
                Accept
              </button>
              <button 
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: '#EF4444', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 12, 
                  fontWeight: 700, 
                  cursor: 'pointer' 
                }} 
                onClick={() => onDeclineFollowRequest && onDeclineFollowRequest(user)}
              >
                Decline
              </button>
            </div>
          </div>
        )}
        
        {!isOwnProfile && isFollowing && (
          <div style={{ marginTop: 24 }}>
            <div style={{ padding: 12, background: '#D1FAE5', borderRadius: 12, textAlign: 'center', color: '#065F46', fontWeight: 600, marginBottom: 12 }}>
              ✅ You are following
            </div>
            <button 
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: '#EF4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
                fontWeight: 700, 
                cursor: 'pointer' 
              }} 
              onClick={() => onRemoveFollow && onRemoveFollow(user)}
            >
              Unfollow
            </button>
          </div>
        )}

        {/* Following's Events */}
        {isFollowing && joinedEvents && joinedEvents.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `2px solid ${theme.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, marginBottom: 16 }}>Following's Events</div>
            {joinedEvents.map((event, idx) => (
              <div key={idx} style={{ background: theme.bg, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{event.name}</div>
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 4 }}>
                  ⏰ {event.time || event.date || ""}
                  {event.endTime && ` – ${event.endTime}`}
                </div>
                <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12 }}>💶 Budget: €{event.budget || event.price || ""}</div>
                <button 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    background: theme.accent, 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 10, 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }} 
                  onClick={() => onRequestJoinEvent && onRequestJoinEvent(user, event)}
                >
                  Request to Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers List Modal */}
      {showFollowersList && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={() => setShowFollowersList(false)}
        >
          <div 
            style={{
              background: theme.card,
              borderRadius: 18,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: theme.text }}>Followers ({followerCount})</h3>
              <button 
                onClick={() => setShowFollowersList(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: theme.textMuted,
                }}
              >×</button>
            </div>
            {followers.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.textMuted, padding: 40 }}>
                No followers yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {followers.map((follower, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: theme.bg,
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setShowFollowersList(false);
                      onUserClick && onUserClick(follower);
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{follower.emoji || '👤'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>
                        {follower.name}
                      </div>
                      {follower.desc && (
                        <div style={{ fontSize: 13, color: theme.textMuted }}>
                          {follower.desc}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following List Modal */}
      {showFollowingList && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={() => setShowFollowingList(false)}
        >
          <div 
            style={{
              background: theme.card,
              borderRadius: 18,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: theme.text }}>Following ({followingCount})</h3>
              <button 
                onClick={() => setShowFollowingList(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: theme.textMuted,
                }}
              >×</button>
            </div>
            {following.length === 0 ? (
              <div style={{ textAlign: 'center', color: theme.textMuted, padding: 40 }}>
                Not following anyone yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {following.map((followedUser, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: theme.bg,
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setShowFollowingList(false);
                      onUserClick && onUserClick(followedUser);
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{followedUser.emoji || '👤'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>
                        {followedUser.name}
                      </div>
                      {followedUser.desc && (
                        <div style={{ fontSize: 13, color: theme.textMuted }}>
                          {followedUser.desc}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
