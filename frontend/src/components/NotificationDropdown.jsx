import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Bell, CheckCircle, Clock, AlertCircle, MapPin, AlertTriangle, Flag, X, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification, useAdminNotification, useAuthorityNotification } from '../context/NotificationContext';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationDropdown({ visible, onClose, darkMode, navigation: navigationProp, userRole }) {
  // Use the navigation hook as fallback if prop is not provided
  const navigationHook = useNavigation();
  const navigation = navigationProp || navigationHook;

  // Citizen state
  const { history, markAsRead, markAsUnread, markAllAsRead } = useNotification();
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Admin state
  const { adminHistory, markAdminAsRead, markAdminAsUnread, markAllAdminAsRead } = useAdminNotification();
  const [markingAllAdminRead, setMarkingAllAdminRead] = useState(false);

  // Authority state
  const { authorityHistory, markAuthorityAsRead, markAuthorityAsUnread, markAllAuthorityAsRead, getAuthorityUnreadCount } = useAuthorityNotification();
  const [markingAllAuthorityRead, setMarkingAllAuthorityRead] = useState(false);

  // Common state
  const [loading, setLoading] = useState(true);

  // Debug log when component mounts or navigation changes
  useEffect(() => {
    console.log('NotificationDropdown - navigation prop:', !!navigationProp, 'hook:', !!navigationHook, 'using:', !!navigation);
    console.log('NotificationDropdown - userRole:', userRole);
  }, [navigationProp, navigationHook, navigation, userRole]);

  useEffect(() => {
    if (visible) {
      // Authority notifications now come from context, no need to fetch here
      setLoading(false);
    }
  }, [visible, userRole]);

  // ========== CITIZEN FUNCTIONS ==========
  const unreadNotifications = history ? history.filter(n => !n.read) : [];
  const readNotifications = history ? history.filter(n => n.read) : [];

  const handleNotificationClick = async (notif) => {
    await markAsRead(notif.uniqId);
    onClose();
    if (notif.id) {
      navigation?.navigate('ComplaintDetails', { id: notif.id });
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    await markAllAsRead();
    setMarkingAllRead(false);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'status_update':
        return <Bell size={16} color="#1E88E5" />;
      case 'resolved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      default:
        return <Bell size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (message) => {
    if (message.includes('Resolved') || message.includes('Completed')) return '#10B981';
    if (message.includes('Rejected')) return '#EF4444';
    if (message.includes('In Progress') || message.includes('Accepted')) return '#F59E0B';
    return '#1E88E5';
  };

  // ========== AUTHORITY FUNCTIONS ==========
  const handleAuthorityNotificationClick = async (notif) => {
    await markAuthorityAsRead(notif.uniqId);
    onClose();

    if (notif.complaintId) {
      navigation?.navigate('ComplaintDetails', { id: notif.complaintId });
    }
  };

  const handleMarkAuthorityAsUnread = async (notifId) => {
    await markAuthorityAsUnread(notifId);
  };

  const handleMarkAllAuthorityRead = async () => {
    setMarkingAllAuthorityRead(true);
    await markAllAuthorityAsRead();
    setMarkingAllAuthorityRead(false);
  };

  const getComplaintStatusColor = (status) => {
    switch (status) {
      case 'resolved':
      case 'completed':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'in_progress':
      case 'accepted':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getComplaintStatusLabel = (status) => {
    return status ? status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Pending';
  };

  // ========== ADMIN FUNCTIONS ==========
  const unreadAdminNotifications = adminHistory ? adminHistory.filter(n => !n.read) : [];
  const readAdminNotifications = adminHistory ? adminHistory.filter(n => n.read) : [];

  const handleAdminNotificationClick = async (notif) => {
    console.log('==========================================');
    console.log('Admin notification clicked:', JSON.stringify(notif, null, 2));
    console.log('Complaint ID from notification:', notif.complaintId);
    console.log('Navigation object available?:', !!navigation);
    console.log('Navigation object:', navigation);

    await markAdminAsRead(notif.uniqId);
    onClose();

    // If notification has a complaint ID, navigate directly to complaint details
    if (notif.complaintId) {
      console.log('✓ Complaint ID exists, attempting navigation...');
      console.log('Navigating to ComplaintDetails with params:', { id: notif.complaintId });

      try {
        if (navigation && typeof navigation.navigate === 'function') {
          navigation.navigate('ComplaintDetails', { id: notif.complaintId });
          console.log('✓ Navigation call completed');
        } else {
          console.error('✗ Navigation object is invalid:', navigation);
        }
      } catch (error) {
        console.error('✗ Navigation error:', error);
      }
    } else {
      console.log('✗ No complaint ID, navigating to flags tab');
      // Fallback to flags tab if no complaint ID
      navigation?.navigate('AdminDashboard', {
        initialTab: 'flags',
        flagTab: notif.type === 'report' ? 'reported' : 'appealed'
      });
    }
    console.log('==========================================');
  };

  const handleMarkAllAdminRead = async () => {
    setMarkingAllAdminRead(true);
    await markAllAdminAsRead();
    setMarkingAllAdminRead(false);
  };

  const getAdminNotifIcon = (type) => {
    if (type === 'report') {
      return <Flag size={16} color="#EF4444" />;
    } else if (type === 'appeal') {
      return <AlertTriangle size={16} color="#F59E0B" />;
    }
    return <Bell size={16} color="#1E88E5" />;
  };

  // ========== RENDER FUNCTIONS ==========
  const renderCitizenContent = () => (
    <>
      {/* Unread Section */}
      {unreadNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textGray]}>
            New ({unreadNotifications.length})
          </Text>
          {unreadNotifications.map((notif) => (
            <TouchableOpacity
              key={notif.uniqId}
              style={[styles.notifItem, styles.unreadItem, darkMode && styles.notifItemDark]}
              onPress={() => handleNotificationClick(notif)}
            >
              <View style={[styles.indicator, { backgroundColor: getStatusColor(notif.message) }]} />
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  {getStatusIcon(notif.type)}
                  <Text style={[styles.notifTitle, darkMode && styles.textWhite]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                </View>
                <Text style={[styles.notifMessage, darkMode && styles.textGray]} numberOfLines={2}>
                  {notif.message}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(notif.timestamp).toLocaleString()}
                </Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Read Section */}
      {readNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textGray]}>Earlier</Text>
          {readNotifications.slice(0, 10).map((notif) => (
            <View key={notif.uniqId} style={[styles.notifItem, darkMode && styles.notifItemDark]}>
              <TouchableOpacity
                style={styles.notifContent}
                onPress={() => {
                  onClose();
                  if (notif.id) {
                    navigation?.navigate('ComplaintDetails', { id: notif.id });
                  }
                }}
              >
                <View style={styles.notifHeader}>
                  {getStatusIcon(notif.type)}
                  <Text style={[styles.notifTitle, styles.readTitle, darkMode && styles.textGray]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                </View>
                <Text style={[styles.notifMessage, styles.readMessage]} numberOfLines={2}>
                  {notif.message}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(notif.timestamp).toLocaleString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unreadBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  markAsUnread(notif.uniqId);
                }}
              >
                <Bell size={16} color="#1E88E5" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {unreadNotifications.length === 0 && readNotifications.length === 0 && (
        <View style={styles.emptyState}>
          <Bell size={48} color="#D1D5DB" />
          <Text style={[styles.emptyText, darkMode && styles.textGray]}>
            No notifications yet
          </Text>
        </View>
      )}
    </>
  );

  const renderAuthorityContent = () => {
    const unreadAuthority = authorityHistory.filter(n => !n.read);
    const readAuthority = authorityHistory.filter(n => n.read);

    return (
      <>
        {/* Unread Authority Notifications */}
        {unreadAuthority.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, darkMode && styles.textGray]}>
              New ({unreadAuthority.length})
            </Text>
            {unreadAuthority.map((notif) => (
              <TouchableOpacity
                key={notif.uniqId}
                style={[styles.notifItem, styles.unreadItem, darkMode && styles.notifItemDark]}
                onPress={() => handleAuthorityNotificationClick(notif)}
              >
                <View style={[styles.indicator, { backgroundColor: '#1E88E5' }]} />
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Bell size={16} color="#1E88E5" />
                    <Text style={[styles.notifTitle, darkMode && styles.textWhite]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                  </View>
                  <Text style={[styles.notifMessage, darkMode && styles.textGray]} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <Text style={styles.notifTime}>
                    {new Date(notif.timestamp).toLocaleString()}
                  </Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Read Authority Notifications */}
        {readAuthority.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, darkMode && styles.textGray]}>Earlier</Text>
            {readAuthority.map((notif) => (
              <TouchableOpacity
                key={notif.uniqId}
                style={[styles.notifItem, darkMode && styles.notifItemDark]}
                onPress={() => handleAuthorityNotificationClick(notif)}
              >
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={[styles.notifTitle, darkMode && styles.textWhite]} numberOfLines={1}>
                      {notif.title}
                    </Text>
                  </View>
                  <Text style={[styles.notifMessage, darkMode && styles.textGray]} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <Text style={styles.notifTime}>
                    {new Date(notif.timestamp).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.markUnreadBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMarkAuthorityAsUnread(notif.uniqId);
                  }}
                >
                  <Text style={styles.markUnreadText}>Mark as unread</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty state */}
        {authorityHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Bell size={48} color="#D1D5DB" />
            <Text style={[styles.emptyText, darkMode && styles.textGray]}>
              No notifications yet
            </Text>
          </View>
        )}
      </>
    );
  };

  const renderAdminContent = () => (
    <>
      {/* Unread Admin Notifications */}
      {unreadAdminNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textGray]}>
            New ({unreadAdminNotifications.length})
          </Text>
          {unreadAdminNotifications.map((notif) => (
            <TouchableOpacity
              key={notif.uniqId}
              style={[styles.notifItem, styles.unreadItem, darkMode && styles.notifItemDark]}
              onPress={() => handleAdminNotificationClick(notif)}
            >
              <View style={[styles.indicator, { backgroundColor: notif.color }]} />
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  {getAdminNotifIcon(notif.type)}
                  <Text style={[styles.notifTitle, darkMode && styles.textWhite]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                </View>
                <Text style={[styles.notifMessage, darkMode && styles.textGray]} numberOfLines={2}>
                  {notif.message}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(notif.timestamp).toLocaleString()}
                </Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Read Admin Notifications */}
      {readAdminNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textGray]}>
            Earlier
          </Text>
          {readAdminNotifications.map((notif) => (
            <View key={notif.uniqId} style={[styles.notifItem, darkMode && styles.notifItemDark]}>
              <TouchableOpacity
                style={styles.notifContent}
                onPress={() => handleAdminNotificationClick(notif)}
              >
                <View style={styles.notifHeader}>
                  {getAdminNotifIcon(notif.type)}
                  <Text style={[styles.notifTitle, darkMode && styles.textGray]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                </View>
                <Text style={[styles.notifMessage, darkMode && styles.textGray]} numberOfLines={2}>
                  {notif.message}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(notif.timestamp).toLocaleString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unreadBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  markAdminAsUnread(notif.uniqId);
                }}
              >
                <Bell size={16} color="#1E88E5" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {unreadAdminNotifications.length === 0 && readAdminNotifications.length === 0 && (
        <View style={styles.emptyState}>
          <Bell size={48} color={darkMode ? '#4B5563' : '#D1D5DB'} />
          <Text style={[styles.emptyText, darkMode && styles.textGray]}>
            No admin notifications yet
          </Text>
        </View>
      )}
    </>
  );

  const getHeaderTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin Notifications';
      case 'authority':
        return 'Notification';
      default:
        return 'Notifications';
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Dropdown */}
      <View style={[styles.dropdown, darkMode && styles.dropdownDark, userRole === 'citizen' && styles.dropdownWide]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerText, darkMode && styles.textWhite]}>{getHeaderTitle()}</Text>
          <View style={styles.headerActions}>
            {userRole === 'citizen' && unreadNotifications.length > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAllRead}>
                <Text style={styles.markAllText}>
                  {markingAllRead ? 'Marking...' : 'Mark all read'}
                </Text>
              </TouchableOpacity>
            )}
            {userRole === 'authority' && authorityHistory.filter(n => !n.read).length > 0 && (
              <TouchableOpacity onPress={handleMarkAllAuthorityRead} disabled={markingAllAuthorityRead}>
                <Text style={styles.markAllText}>
                  {markingAllAuthorityRead ? 'Marking...' : 'Mark all read'}
                </Text>
              </TouchableOpacity>
            )}
            {userRole === 'admin' && unreadAdminNotifications.length > 0 && (
              <TouchableOpacity onPress={handleMarkAllAdminRead} disabled={markingAllAdminRead}>
                <Text style={styles.markAllText}>
                  {markingAllAdminRead ? 'Marking...' : 'Mark all read'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={darkMode ? '#D1D5DB' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {userRole === 'citizen' && renderCitizenContent()}
            {userRole === 'authority' && renderAuthorityContent()}
            {userRole === 'admin' && renderAdminContent()}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 360,
    maxHeight: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownWide: {
    width: 380,
  },
  dropdownDark: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 440,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  section: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadItem: {
    backgroundColor: '#EFF6FF',
  },
  notifItemDark: {
    borderBottomColor: '#374151',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  readTitle: {
    fontWeight: '500',
    color: '#6B7280',
  },
  notifMessage: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  readMessage: {
    color: '#9CA3AF',
  },
  notifMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  notifTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  viewAllBtn: {
    padding: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  textWhite: {
    color: '#F9FAFB',
  },
  textGray: {
    color: '#9CA3AF',
  },
  unreadBtn: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
