import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Activity, ShieldAlert, Clock, AlertTriangle, Scale, ArrowLeft } from 'lucide-react-native';
import api from '../services/api';

export default function AdminStatusScreen({ darkMode, onJump }) {
  const [departments] = useState([
    { name: 'DWASA', active: 14, resolved: 88, color: '#1E88E5', perf: '92%' },
    { name: 'City Corp', active: 42, resolved: 156, color: '#8B5CF6', perf: '85%' },
    { name: 'DESCO', active: 6, resolved: 44, color: '#F59E0B', perf: '98%' }
  ]);

  const [kpis, setKpis] = useState({ serviceHealth: null, avgSolveHours: null, pending: null });
  const [kpiDetails, setKpiDetails] = useState(null);
  const [moderation, setModeration] = useState({ reportedPending: null, appealsPending: null, reportedTotal: null, appealsTotal: null });
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [view, setView] = useState('main'); // 'main' | 'detail'
  const [detailType, setDetailType] = useState(null); // 'serviceHealth' | 'avgSolve' | 'pending'

  const formatCount = (n) => (Number.isFinite(n) && n >= 0 ? String(n).padStart(2, '0') : '--');

  const fetchKpis = async () => {
    try {
      setLoadingKpis(true);
      const [kpiRes, modRes] = await Promise.all([
        api.get('/admin/kpis/details'),
        api.get('/admin/moderation')
      ]);
      setKpis({
        serviceHealth: kpiRes.data?.serviceHealth ?? null,
        avgSolveHours: kpiRes.data?.avgSolveHours ?? null,
        pending: kpiRes.data?.pending ?? null,
      });
      setKpiDetails(kpiRes.data || null);
      setModeration({
        reportedPending: modRes.data?.reportedPending ?? null,
        appealsPending: modRes.data?.appealsPending ?? null,
        reportedTotal: modRes.data?.reportedTotal ?? null,
        appealsTotal: modRes.data?.appealsTotal ?? null,
      });
    } catch (error) {
      console.error('KPI Fetch Error:', error.response?.data || error.message);
    } finally {
      setLoadingKpis(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const { useFocusEffect } = require('@react-navigation/native');
  useFocusEffect(
    React.useCallback(() => {
      fetchKpis();
    }, [])
  );

  const openDetails = (type) => {
    setDetailType(type);
    setView('detail');
  };

  if (view === 'detail' && kpiDetails) {
    return (
      <DetailScreen
        darkMode={darkMode}
        detailType={detailType}
        kpiDetails={kpiDetails}
        onBack={() => setView('main')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.padding}>
      <Text style={[styles.title, darkMode && { color: 'white' }]}>Command Center</Text>

      <View style={styles.kpiGrid}>
        <KPIBox
          icon={Activity}
          val={kpis.serviceHealth != null ? `${kpis.serviceHealth.toFixed(1)}%` : '--'}
          lab="Service Health"
          color="#10B981"
          darkMode={darkMode}
          loading={loadingKpis}
          onPress={() => openDetails('serviceHealth')}
        />
        <KPIBox
          icon={Clock}
          val={kpis.avgSolveHours != null ? `${kpis.avgSolveHours.toFixed(1)}h` : '--'}
          lab="Avg. Solve"
          color="#1E88E5"
          darkMode={darkMode}
          loading={loadingKpis}
          onPress={() => openDetails('avgSolve')}
        />
        <KPIBox
          icon={ShieldAlert}
          val={kpis.pending != null ? String(kpis.pending) : '--'}
          lab="Pending"
          color="#EF4444"
          darkMode={darkMode}
          loading={loadingKpis}
          onPress={() => openDetails('pending')}
        />
      </View>

      <Text style={styles.sectionLabel}>Moderation Overview</Text>
      <View style={[styles.summaryCard, darkMode && styles.cardDark]}>
        <TouchableOpacity style={styles.summaryRow} onPress={() => onJump('reported')}>
          <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}><AlertTriangle size={18} color="#EF4444" /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.sumTitle, darkMode && { color: 'white' }]}>Reported Posts</Text>
            <Text style={styles.sumSub}>
              {moderation.reportedPending != null ? `${moderation.reportedPending} urgent reviews` : 'Loading...'}
            </Text>
          </View>
          <Text style={[styles.sumCount, { color: '#EF4444' }]}>{formatCount(moderation.reportedPending)}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.summaryRow} onPress={() => onJump('appeals')}>
          <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}><Scale size={18} color="#4F46E5" /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.sumTitle, darkMode && { color: 'white' }]}>Citizen Appeals</Text>
            <Text style={styles.sumSub}>
              {moderation.appealsPending != null ? `${moderation.appealsPending} cases pending` : 'Loading...'}
            </Text>
          </View>
          <Text style={[styles.sumCount, { color: '#4F46E5' }]}>{formatCount(moderation.appealsPending)}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Dept Performance</Text>
      <View style={[styles.analyticsCard, darkMode && styles.cardDark]}>
        {departments.map(dept => (
          <View key={dept.name} style={styles.deptRow}>
            <View style={{ flex: 1 }}><Text style={[styles.deptName, darkMode && { color: 'white' }]}>{dept.name}</Text><Text style={styles.deptSub}>{dept.active} Active</Text></View>
            <View style={styles.progressContainer}>
              <Text style={styles.perfText}>{dept.perf}</Text>
              <View style={styles.progressBase}><View style={[styles.progressFill, { backgroundColor: dept.color, width: dept.perf }]} /></View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const KPIBox = ({ icon: Icon, val, lab, color, darkMode, loading, onPress }) => (
  <TouchableOpacity
    style={[styles.kpiCard, darkMode && styles.cardDark]}
    onPress={onPress}
    disabled={!onPress}
  >
    <Icon size={20} color={color} />
    {loading ? <ActivityIndicator size="small" color={color} style={{ marginTop: 8 }} /> : (
      <Text style={[styles.kpiVal, darkMode && { color: 'white' }]}>{val}</Text>
    )}
    <Text style={styles.kpiLab}>{lab}</Text>
  </TouchableOpacity>
);

const DetailRow = ({ label, value, darkMode }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, darkMode && { color: '#9CA3AF' }]}>{label}</Text>
    <Text style={[styles.detailValue, darkMode && { color: 'white' }]}>{value}</Text>
  </View>
);

const DetailScreen = ({ darkMode, detailType, kpiDetails, onBack }) => {
  const titleMap = {
    serviceHealth: 'Service Health',
    avgSolve: 'Average Resolve Time',
    pending: 'Pending Complaints'
  };

  const formatDate = (d) => {
    if (!d) return '--';
    try {
      return new Date(d).toLocaleString();
    } catch (e) {
      return String(d);
    }
  };

  return (
    <View style={[styles.detailPage, darkMode && { backgroundColor: '#0B1220' }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft color={darkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.detailTitle, darkMode && { color: 'white' }]}>{titleMap[detailType] || 'Details'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.summaryRowBetween}>
          <SummaryCard label="Total" value={kpiDetails.total ?? '--'} darkMode={darkMode} />
          <SummaryCard label="Resolved" value={kpiDetails.resolved ?? '--'} darkMode={darkMode} />
          <SummaryCard label="Pending" value={kpiDetails.pending ?? '--'} darkMode={darkMode} />
        </View>

        {detailType === 'serviceHealth' && (
          <View style={styles.listCard}>
            <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Service Health</Text>
            <DetailRow label="Resolved %" value={kpiDetails.serviceHealth != null ? `${kpiDetails.serviceHealth.toFixed(1)}%` : '--'} darkMode={darkMode} />
            <DetailRow label="Total complaints" value={kpiDetails.total ?? '--'} darkMode={darkMode} />
            <DetailRow label="Resolved count" value={kpiDetails.resolved ?? '--'} darkMode={darkMode} />
            <DetailRow label="Pending count" value={kpiDetails.pending ?? '--'} darkMode={darkMode} />
          </View>
        )}

        {detailType === 'avgSolve' && (
          <View style={styles.listCard}>
            <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Average Resolve Time</Text>
            <DetailRow label="Avg Resolve" value={kpiDetails.avgSolveHours != null ? `${kpiDetails.avgSolveHours.toFixed(1)} h` : '--'} darkMode={darkMode} />
            <DetailRow label="Resolved %" value={kpiDetails.serviceHealth != null ? `${kpiDetails.serviceHealth.toFixed(1)}%` : '--'} darkMode={darkMode} />
            <Text style={[styles.sectionLabel, { marginTop: 10, marginBottom: 6 }]}>Latest Resolved</Text>
            {(kpiDetails.resolvedList || []).map(item => (
              <View key={item.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, darkMode && { color: 'white' }]}>{item.title}</Text>
                  <Text style={styles.listSub}>{item.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listMeta}>{formatDate(item.createdAt)}</Text>
                  <Text style={[styles.listMeta, { color: '#10B981' }]}>Resolved: {formatDate(item.updatedAt)}</Text>
                </View>
              </View>
            ))}
            {(!kpiDetails.resolvedList || kpiDetails.resolvedList.length === 0) && (
              <Text style={[styles.emptyText, darkMode && { color: 'white' }]}>No resolved complaints yet.</Text>
            )}
          </View>
        )}

        {detailType === 'pending' && (
          <View style={styles.listCard}>
            <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Pending Complaints</Text>
            {(kpiDetails.pendingList || []).map(item => (
              <View key={item.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listTitle, darkMode && { color: 'white' }]}>{item.title}</Text>
                  <Text style={styles.listSub}>{item.category}</Text>
                </View>
                <Text style={styles.listMeta}>{formatDate(item.createdAt)}</Text>
              </View>
            ))}
            {(!kpiDetails.pendingList || kpiDetails.pendingList.length === 0) && (
              <Text style={[styles.emptyText, darkMode && { color: 'white' }]}>No pending complaints.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const SummaryCard = ({ label, value, darkMode }) => (
  <View style={[styles.summaryCardSmall, darkMode && styles.cardDark]}>
    <Text style={[styles.summaryLabel, darkMode && { color: '#9CA3AF' }]}>{label}</Text>
    <Text style={[styles.summaryValue, darkMode && { color: 'white' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  padding: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  kpiCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, width: '31%', alignItems: 'center', elevation: 2 },
  cardDark: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1 },
  kpiVal: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  kpiLab: { fontSize: 10, color: '#9CA3AF' },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 12 },
  summaryCard: { backgroundColor: 'white', borderRadius: 15, padding: 15 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sumTitle: { fontSize: 14, fontWeight: 'bold' },
  sumSub: { fontSize: 11, color: '#9CA3AF' },
  sumCount: { fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  analyticsCard: { backgroundColor: 'white', borderRadius: 15, padding: 16 },
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  deptName: { fontWeight: 'bold', fontSize: 14 },
  deptSub: { fontSize: 11, color: '#9CA3AF' },
  progressContainer: { alignItems: 'flex-end', width: 80 },
  perfText: { fontSize: 11, fontWeight: 'bold', color: '#10B981', marginBottom: 4 },
  progressBase: { height: 4, width: '100%', backgroundColor: '#F3F4F6', borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScroll: { padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: 'bold' },
  detailPage: { flex: 1, padding: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 6 },
  detailTitle: { fontSize: 18, fontWeight: 'bold' },
  summaryRowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryCardSmall: { backgroundColor: 'white', padding: 14, borderRadius: 12, width: '32%', elevation: 2 },
  summaryLabel: { fontSize: 12, color: '#6B7280' },
  summaryValue: { fontSize: 18, fontWeight: 'bold' },
  listCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginTop: 16 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  listTitle: { fontWeight: 'bold', fontSize: 14 },
  listSub: { fontSize: 12, color: '#6B7280' },
  listMeta: { fontSize: 11, color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#6B7280', paddingVertical: 6 }
});