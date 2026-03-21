import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { palette } from '../theme/colors';

const USER_PAGE_SIZE = 10;

export default function CommunityScreen() {
  const [badges, setBadges] = useState([]);
  const [featuredChallenge, setFeaturedChallenge] = useState(null);
  const [challengeNote, setChallengeNote] = useState('');
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialBusy, setSocialBusy] = useState(false);
  const [socialMessage, setSocialMessage] = useState('');
  const [socialError, setSocialError] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [usersCursor, setUsersCursor] = useState(null);
  const [usersHasNext, setUsersHasNext] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loadingSelectedProfile, setLoadingSelectedProfile] = useState(false);

  const visibleUsers = useMemo(() => userResults, [userResults]);

  const loadSocial = async () => {
    setSocialLoading(true);
    try {
      const [profileRes, badgesRes, challengeRes] = await Promise.all([
        api.get('/social/profile/me'),
        api.get('/social/badges'),
        api.get('/social/challenge/featured'),
      ]);

      setMyProfile(profileRes?.data || null);
      setBadges(Array.isArray(badgesRes?.data) ? badgesRes.data : []);
      setFeaturedChallenge(challengeRes?.data || null);
    } catch {
      setMyProfile(null);
      setBadges([]);
      setFeaturedChallenge(null);
    } finally {
      setSocialLoading(false);
    }
  };

  useEffect(() => {
    loadSocial();
  }, []);

  const participateInChallenge = async () => {
    setSocialBusy(true);
    setSocialMessage('');
    setSocialError(false);
    try {
      const { data } = await api.post('/social/challenge/participate', {
        notes: challengeNote.trim() || null,
      });
      setSocialMessage(data?.message || 'Challenge participation recorded.');
      setChallengeNote('');
      await loadSocial();
    } catch (err) {
      setSocialError(true);
      setSocialMessage(err?.response?.data?.message || 'Unable to join challenge.');
    } finally {
      setSocialBusy(false);
    }
  };

  const searchUsers = async (reset = true) => {
    if (!searchQuery.trim()) {
      setUserResults([]);
      setUsersCursor(null);
      setUsersHasNext(false);
      return;
    }

    if (reset) {
      setSearchingUsers(true);
    } else {
      setLoadingMoreUsers(true);
    }
    try {
      const { data } = await api.get('/social/users/search', {
        params: {
          query: searchQuery.trim(),
          size: USER_PAGE_SIZE,
          ...(reset ? {} : { cursor: usersCursor }),
        },
      });

      if (Array.isArray(data)) {
        const results = data;
        setUserResults(results);
        setUsersHasNext(false);
        setUsersCursor(null);
      } else {
        const payload = data || {};
        const nextItems = Array.isArray(payload.items) ? payload.items : [];
        setUserResults((prev) => (reset ? nextItems : [...prev, ...nextItems]));
        setUsersHasNext(Boolean(payload.hasNext));
        setUsersCursor(payload.nextCursor ?? null);
      }
    } catch {
      if (reset) {
        setUserResults([]);
        setUsersHasNext(false);
        setUsersCursor(null);
      }
    } finally {
      if (reset) {
        setSearchingUsers(false);
      } else {
        setLoadingMoreUsers(false);
      }
    }
  };

  const openUserProfile = async (userId) => {
    setLoadingSelectedProfile(true);
    setSocialMessage('');
    setSocialError(false);
    try {
      const { data } = await api.get(`/social/profile/${userId}`);
      setSelectedProfile(data || null);
    } catch (err) {
      setSelectedProfile(null);
      setSocialError(true);
      setSocialMessage(err?.response?.data?.message || 'Unable to load profile.');
    } finally {
      setLoadingSelectedProfile(false);
    }
  };

  const toggleFollow = async () => {
    if (!selectedProfile?.userId) {
      return;
    }

    setSocialBusy(true);
    setSocialMessage('');
    setSocialError(false);
    try {
      if (selectedProfile.followingByCurrentUser) {
        const { data } = await api.delete(`/social/follow/${selectedProfile.userId}`);
        setSocialMessage(data?.message || 'Unfollowed user');
      } else {
        const { data } = await api.post(`/social/follow/${selectedProfile.userId}`);
        setSocialMessage(data?.message || 'Now following user');
      }
      await Promise.all([loadSocial(), openUserProfile(selectedProfile.userId)]);
    } catch (err) {
      setSocialError(true);
      setSocialMessage(err?.response?.data?.message || 'Unable to update follow status.');
    } finally {
      setSocialBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>Challenges, badges, profiles, and social discovery in one place.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Community Profile</Text>
        {socialLoading ? <ActivityIndicator color={palette.primary} /> : null}
        {!socialLoading && myProfile ? (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{myProfile.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{myProfile.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{myProfile.totalCookSessions}</Text>
                <Text style={styles.statLabel}>Cooks</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{myProfile.totalComments}</Text>
                <Text style={styles.statLabel}>Tips</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Cooking Showcase</Text>
            {!myProfile.recentCooks?.length ? <Text style={styles.mutedText}>No cooking sessions yet.</Text> : null}
            {myProfile.recentCooks?.slice(0, 3).map((cook) => (
              <View key={`cook-${cook.id}`} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{cook.recipeTitle || 'Cook session'}</Text>
                <Text style={styles.rowMeta}>{cook.cookedAt ? new Date(cook.cookedAt).toLocaleString() : 'Recently'} • {cook.minutesSpent || 0} mins • ⭐ {cook.rating || '-'}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Recent Tips</Text>
            {!myProfile.recentComments?.length ? <Text style={styles.mutedText}>No comments yet.</Text> : null}
            {myProfile.recentComments?.slice(0, 3).map((comment) => (
              <View key={`comment-${comment.id}`} style={styles.rowCard}>
                <Text style={styles.rowTitle}>⭐ {comment.rating || '-'}/5</Text>
                <Text style={styles.rowMeta}>{comment.comment}</Text>
              </View>
            ))}
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Recipe Challenge</Text>
        {!featuredChallenge ? <Text style={styles.mutedText}>No active challenge this week.</Text> : null}
        {featuredChallenge ? (
          <>
            <Text style={styles.rowTitle}>{featuredChallenge.title}</Text>
            <Text style={styles.rowMeta}>{featuredChallenge.description}</Text>
            <Text style={styles.rowMeta}>Featured: {featuredChallenge.featuredRecipeTitle || 'Recipe'}</Text>
            <Text style={styles.rowMeta}>Week: {featuredChallenge.weekStartDate} to {featuredChallenge.weekEndDate}</Text>
            <TextInput
              value={challengeNote}
              onChangeText={setChallengeNote}
              style={styles.input}
              placeholder="Optional participation note"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, (featuredChallenge.participated || socialBusy) && styles.disabledBtn]}
              onPress={participateInChallenge}
              disabled={featuredChallenge.participated || socialBusy}
            >
              <Text style={styles.primaryBtnText}>{featuredChallenge.participated ? 'Already Participating' : 'Join Challenge'}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chef Badges</Text>
        {!badges.length ? <Text style={styles.mutedText}>No badges yet. Start cooking and sharing tips!</Text> : null}
        {badges.map((badge) => (
          <View key={badge.code} style={styles.badgeRow}>
            <Ionicons name="ribbon" size={16} color="#0F766E" />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeTitle}>{badge.title}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Find Cooks To Follow</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Search by name or email"
          />
          <TouchableOpacity
            style={[styles.searchBtn, searchingUsers && styles.disabledBtn]}
            onPress={searchUsers}
            disabled={searchingUsers}
          >
            <Text style={styles.searchBtnText}>{searchingUsers ? '...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>

        {!searchingUsers && visibleUsers.map((item) => (
          <TouchableOpacity key={item.userId} style={styles.userResultRow} onPress={() => openUserProfile(item.userId)}>
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </TouchableOpacity>
        ))}

        {!searchingUsers && usersHasNext ? (
          <TouchableOpacity
            style={[styles.loadMoreBtn, loadingMoreUsers && styles.disabledBtn]}
            onPress={() => searchUsers(false)}
            disabled={loadingMoreUsers}
          >
            <Text style={styles.loadMoreText}>{loadingMoreUsers ? 'Loading...' : 'Load More Users'}</Text>
          </TouchableOpacity>
        ) : null}

        {loadingSelectedProfile ? <ActivityIndicator color={palette.primary} style={{ marginTop: 10 }} /> : null}

        {selectedProfile ? (
          <View style={styles.selectedProfileCard}>
            <Text style={styles.rowTitle}>{selectedProfile.name}</Text>
            <Text style={styles.userEmail}>{selectedProfile.email}</Text>
            <Text style={styles.rowMeta}>{selectedProfile.followers} followers • {selectedProfile.following} following</Text>
            <Text style={styles.rowMeta}>{selectedProfile.totalCookSessions} cook sessions • {selectedProfile.totalComments} comments</Text>
            <TouchableOpacity
              style={[selectedProfile.followingByCurrentUser ? styles.secondaryBtn : styles.primaryBtn, socialBusy && styles.disabledBtn]}
              onPress={toggleFollow}
              disabled={socialBusy}
            >
              <Text style={selectedProfile.followingByCurrentUser ? styles.secondaryBtnText : styles.primaryBtnText}>
                {selectedProfile.followingByCurrentUser ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {socialMessage ? (
        <Text style={[styles.socialMessage, socialError ? styles.socialError : styles.socialSuccess]}>{socialMessage}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundAlt },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: palette.text, marginBottom: 4 },
  subtitle: { color: '#64748B', marginBottom: 14 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: palette.border },
  cardTitle: { fontWeight: '800', color: palette.primaryDark, fontSize: 16, marginBottom: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  statCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginRight: '4%',
    marginBottom: 8,
  },
  statValue: { fontWeight: '800', color: palette.primaryDark, fontSize: 16 },
  statLabel: { color: '#64748B', fontSize: 12, marginTop: 3 },
  sectionTitle: { fontWeight: '800', color: palette.primaryDark, marginTop: 8, marginBottom: 6 },
  rowCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: '#fff' },
  rowTitle: { fontWeight: '700', color: palette.text, marginBottom: 4 },
  rowMeta: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  mutedText: { color: '#64748B' },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginTop: 6,
    marginBottom: 8,
  },
  primaryBtn: { backgroundColor: palette.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#FFE7D9', padding: 12, borderRadius: 10, alignItems: 'center' },
  secondaryBtnText: { color: palette.secondary, fontWeight: '700' },
  disabledBtn: { opacity: 0.7 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    padding: 10,
    marginBottom: 8,
  },
  badgeTextWrap: { marginLeft: 8, flex: 1 },
  badgeTitle: { fontWeight: '800', color: '#0F766E' },
  badgeDescription: { color: '#115E59', marginTop: 2, fontSize: 12 },
  searchRow: { flexDirection: 'row', marginBottom: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  searchBtn: { backgroundColor: '#0F766E', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8 },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  userResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  userName: { fontWeight: '700', color: palette.text },
  userEmail: { color: '#64748B', marginTop: 2 },
  selectedProfileCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    padding: 12,
    marginTop: 8,
  },
  loadMoreBtn: { backgroundColor: '#1E293B', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  loadMoreText: { color: '#fff', fontWeight: '700' },
  socialMessage: { marginBottom: 10, fontWeight: '700', textAlign: 'center' },
  socialSuccess: { color: '#0F766E' },
  socialError: { color: '#B91C1C' },
});