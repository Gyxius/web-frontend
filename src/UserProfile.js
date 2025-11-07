import React from "react";
import users from "./users";

function UserProfile({ user, currentUser, getUserPoints, onBack, onAddFollow, isFollowing, hasPendingRequest, incomingRequest, onAcceptFollowRequest, onDeclineFollowRequest, onRequestJoinEvent, joinedEvents, onRemoveFollow, followingCount = 0, followerCount = 0 }) {
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
  
  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <div style={styles.card}>
        <div style={styles.emoji}>
          {fullUser.avatar && fullUser.avatar.provider === 'dicebear' ? (
            <img
              src={`https://api.dicebear.com/6.x/${fullUser.avatar.style}/svg?seed=${encodeURIComponent(fullUser.avatar.seed)}`}
              alt="avatar"
              style={{ width: 72, height: 72, borderRadius: 12 }}
            />
          ) : fullUser.avatar && fullUser.avatar.provider === 'custom' ? (
            <img
              src={fullUser.avatar.url}
              alt="custom avatar"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            fullUser.emoji
          )}
        </div>
        <div style={styles.name}>{fullUser.name} {fullUser.homeCountries ? fullUser.homeCountries.map((c, i) => <span key={i} style={{marginLeft:6}}>{c}</span>) : `(${fullUser.country || ''})`}</div>
        <div style={styles.type}>Type: {fullUser.type}</div>
        <div style={styles.desc}>{fullUser.desc || fullUser.bio}</div>
        
        {/* Follower/Following counts */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <div style={styles.statNumber}>{followerCount}</div>
            <div style={styles.statLabel}>Followers</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNumber}>{followingCount}</div>
            <div style={styles.statLabel}>Following</div>
          </div>
        </div>
        
        <div style={styles.info}><b>Age:</b> {fullUser.age}</div>
  <div style={styles.info}><b>House:</b> {fullUser.house || fullUser.building || fullUser.residence || ''}</div>
  <div style={styles.info}><b>Degree:</b> {fullUser.degree}</div>
  <div style={styles.info}><b>Major:</b> {fullUser.major}</div>
        <div style={styles.info}><b>Points:</b> {realPoints}</div>
        <div style={styles.info}><b>Languages:</b> {fullUser.languages?.join ? fullUser.languages.join(", ") : fullUser.languages}</div>
        {fullUser.languageLevels && (
          <div style={styles.info}><b>Language levels:</b> {Object.entries(fullUser.languageLevels).map(([l, lvl]) => `${l}: ${lvl}`).join(', ')}</div>
        )}
        <div style={styles.info}><b>Interests:</b> {fullUser.interests?.join ? fullUser.interests.join(", ") : fullUser.interests}</div>
        {!isOwnProfile && !isFollowing && !hasPendingRequest && !incomingRequest && (
          <button style={styles.friendBtn} onClick={() => onAddFollow && onAddFollow(user)}>
            Follow
          </button>
        )}
        {!isOwnProfile && hasPendingRequest && !isFollowing && (
          <div style={{ marginTop: 16, color: '#f59e0b', fontWeight: 600, textAlign: 'center' }}>
            Follow request sent. Waiting for acceptance.
          </div>
        )}
        {!isOwnProfile && incomingRequest && !isFollowing && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ color: '#3b82f6', fontWeight: 600 }}>You have a follow request!</div>
            <button style={styles.friendBtn} onClick={() => onAcceptFollowRequest && onAcceptFollowRequest(user)}>
              Accept
            </button>
            <button style={styles.removeBtn} onClick={() => onDeclineFollowRequest && onDeclineFollowRequest(user)}>
              Decline
            </button>
          </div>
        )}
        {!isOwnProfile && isFollowing && (
          <>
            <div style={styles.friendStatus}>✅ You are following</div>
            <button style={styles.removeBtn} onClick={() => onRemoveFollow && onRemoveFollow(user)}>
              Unfollow
            </button>
          </>
        )}
        {isFollowing && joinedEvents.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Following's Events:</div>
            {joinedEvents.map((event, idx) => (
              <div key={idx} style={styles.eventCard}>
                <div style={styles.eventName}>{event.name}</div>
                <div style={styles.details}>⏰ {event.time || event.date || ""}</div>
                <div style={styles.details}>💶 Budget: €{event.budget || event.price || ""}</div>
                <button style={styles.joinBtn} onClick={() => onRequestJoinEvent && onRequestJoinEvent(user, event)}>
                  Request to Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "40px auto", padding: 20, background: "#f0f4f8", borderRadius: 16, boxShadow: "0 2px 8px #eee" },
  backBtn: { marginBottom: 16, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  card: { background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px #eee" },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 6 },
  type: { fontSize: 16, color: "#555", textAlign: "center", marginBottom: 8 },
  desc: { fontSize: 15, color: "#444", textAlign: "center", marginBottom: 12 },
  statsRow: { display: "flex", justifyContent: "center", gap: 40, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #eee" },
  stat: { textAlign: "center" },
  statNumber: { fontSize: 24, fontWeight: 700, color: "#10b981" },
  statLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  info: { fontSize: 14, color: "#333", marginBottom: 6 },
  friendBtn: { marginTop: 16, background: "#10b981", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  friendStatus: { marginTop: 16, color: "#10b981", fontWeight: 600, textAlign: "center" },
  removeBtn: { marginTop: 8, background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" },
  eventCard: { background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 12, boxShadow: "0 1px 4px #eee" },
  eventName: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  details: { fontSize: 14, color: "#444" },
  joinBtn: { marginTop: 8, background: "#3b82f6", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 600, cursor: "pointer" },
};

export default UserProfile;
