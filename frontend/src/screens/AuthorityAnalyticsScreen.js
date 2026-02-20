import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Modal, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Download, TrendingUp, CheckCircle, BarChart3, Map as MapIcon, X, Calendar, Filter, Clock, AlertCircle } from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function AuthorityAnalyticsScreen({ navigation: navigationProp }) {
	const navigation = navigationProp || useNavigation();
	const [metrics, setMetrics] = useState({
		total: 0, resolved: 0, pending: 0, appealed: 0, accepted: 0, inProgress: 0, avgResolution: 0, avgRating: 0,
	});
	const [deptComplaints, setDeptComplaints] = useState([]);
	const [filteredComplaints, setFilteredComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedPeriod, setSelectedPeriod] = useState('all');
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const [showFilterModal, setShowFilterModal] = useState(false);
	const [showChart, setShowChart] = useState(true);
	const [showMap, setShowMap] = useState(true);
	const [showExportModal, setShowExportModal] = useState(false);

	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const currentYearNum = new Date().getFullYear();
	const years = [];
	for (let y = 2025; y <= currentYearNum; y++) { years.push(y); }

	useEffect(() => { fetchAnalytics(); }, []);
	useEffect(() => { filterByPeriod(selectedPeriod, selectedMonth, selectedYear); }, [selectedPeriod, selectedMonth, selectedYear, deptComplaints]);

	const extractAuthorityCompanyId = (userData) => {
		if (!userData || typeof userData !== 'object') return null;
		return (
			userData.authorityCompanyId ??
			userData.companyId ??
			userData?.Authority?.authorityCompanyId ??
			userData?.authority?.authorityCompanyId ??
			null
		);
	};

	const fetchAnalytics = async () => {
		setLoading(true);
		try {
			let companyId = await AsyncStorage.getItem('authorityCompanyId');
			if (!companyId || companyId === 'undefined' || companyId === 'null') {
				const userDataStr = await AsyncStorage.getItem('userData');
				if (userDataStr) {
					const userData = JSON.parse(userDataStr);
					companyId = extractAuthorityCompanyId(userData);
				}
			}
			if (!companyId) {
				setDeptComplaints([]);
				setFilteredComplaints([]);
				setMetrics({
					total: 0, resolved: 0, pending: 0, appealed: 0, accepted: 0, inProgress: 0, avgResolution: 0, avgRating: 0,
				});
				return;
			}
			await AsyncStorage.setItem('authorityCompanyId', String(companyId));
			const response = await api.get(`/complaints/authority/${companyId}?limit=100`);
			const complaints = response.data.complaints || response.data;
			setDeptComplaints(complaints);
		} catch (e) {
			console.error("Analytics Error:", e);
		} finally {
			setLoading(false);
		}
	};

	const filterByPeriod = (period, month, year) => {
		const now = new Date();
		let filtered = [...deptComplaints];
		if (period === 'week') {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			filtered = deptComplaints.filter(c => new Date(c.createdAt) >= weekAgo);
		} else if (period === 'month') {
			filtered = deptComplaints.filter(c => {
				const d = new Date(c.createdAt);
				return d.getMonth() === month && d.getFullYear() === year;
			});
		} else if (period === 'year') {
			filtered = deptComplaints.filter(c => new Date(c.createdAt).getFullYear() === year);
		}
		setFilteredComplaints(filtered);
		calculateMetrics(filtered);
	};

	const calculateMetrics = (complaints) => {
		let total = complaints.length;
		let resolved = 0, pending = 0, appealed = 0, accepted = 0, inProgress = 0, resolutionTimes = [];
		for (const c of complaints) {
			const status = c.currentStatus ? c.currentStatus.toLowerCase() : '';
			if (['resolved', 'closed', 'completed'].includes(status)) {
				resolved++;
				if (c.createdAt && c.updatedAt) {
					const created = new Date(c.createdAt).getTime();
					const updated = new Date(c.updatedAt).getTime();
					if (updated > created) resolutionTimes.push(updated - created);
				}
			}
			else if (status === 'pending') pending++;
			else if (status === 'appealed') appealed++;
			else if (status === 'accepted') accepted++;
			else if (status === 'in_progress' || status === 'assigned') inProgress++;
		}
		const avgResolution = resolutionTimes.length > 0 ? parseFloat((resolutionTimes.reduce((sum, ms) => sum + ms, 0) / resolutionTimes.length / 1000 / 60 / 60).toFixed(1)) : 0;
		const ratings = complaints.filter(c => c.rating != null).map(c => c.rating);
		const avgRating = ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0;
		setMetrics({ total, resolved, pending, appealed, accepted, inProgress, avgResolution, avgRating });
	};

	const openMetricsModal = (type) => {
		const titleMap = {
			'total': 'Total Cases',
			'resolved': 'Resolved Cases',
			'pending': 'Pending Cases',
			'appealed': 'Appeals',
			'accepted': 'Accepted Cases',
			'inProgress': 'In Progress'
		};
		navigation.navigate('AuthorityComplaintList', {
			statusFilter: type,
			title: titleMap[type] || 'Complaints',
			complaints: getFilteredComplaints(type)
		});
	};

	const getFilteredComplaints = (metricType) => {
		if (!metricType || metricType === 'total') return filteredComplaints;
		return filteredComplaints.filter(c => {
			const status = c.currentStatus ? c.currentStatus.toLowerCase() : '';
			if (metricType === 'resolved') return ['resolved', 'closed', 'completed'].includes(status);
			if (metricType === 'pending') return status === 'pending';
			if (metricType === 'appealed') return status === 'appealed';
			if (metricType === 'accepted') return status === 'accepted';
			if (metricType === 'inProgress') return ['in_progress', 'assigned'].includes(status);
			return false;
		});
	};

	const generatePDF = async () => {
		try {
			const periodLabels = {
				'all': 'All Time',
				'week': 'This Week',
				'month': `${months[selectedMonth]} ${selectedYear}`,
				'year': `Year ${selectedYear}`
			};

			const htmlContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>Analytics Report</title>
					<style>
						body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
						.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1E88E5; padding-bottom: 20px; }
						.header h1 { color: #1E88E5; margin: 0 0 10px 0; font-size: 32px; }
						.header p { margin: 5px 0; color: #6B7280; font-size: 14px; }
						.section-title { font-size: 20px; font-weight: bold; color: #1F2937; margin: 30px 0 15px 0; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
						.metrics { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px; }
						.metric-box { flex: 1; min-width: 180px; background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB; }
						.metric-label { font-size: 11px; color: #6B7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
						.metric-value { font-size: 28px; font-weight: bold; color: #1F2937; }
						table { width: 100%; border-collapse: collapse; margin-top: 15px; }
						th { background-color: #1E88E5; color: white; padding: 12px; text-align: left; font-weight: bold; font-size: 13px; }
						td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
						tr:nth-child(even) { background-color: #F9FAFB; }
						.status-resolved { color: #065F46; font-weight: bold; }
						.status-pending { color: #92400E; font-weight: bold; }
						.status-progress { color: #1E40AF; font-weight: bold; }
						.status-appealed { color: #7E22CE; font-weight: bold; }
						.footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; padding-top: 20px; }
					</style>
				</head>
				<body>
					<div class="header">
						<h1>CityZen Analytics Report</h1>
						<p><strong>Time Period:</strong> ${periodLabels[selectedPeriod]}</p>
						<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
					</div>
					
					<div class="section-title">Key Performance Indicators</div>
					<div class="metrics">
						<div class="metric-box"><div class="metric-label">Total Cases</div><div class="metric-value">${metrics.total}</div></div>
						<div class="metric-box"><div class="metric-label">Resolved</div><div class="metric-value">${metrics.resolved}</div></div>
						<div class="metric-box"><div class="metric-label">Pending</div><div class="metric-value">${metrics.pending}</div></div>
						<div class="metric-box"><div class="metric-label">In Progress</div><div class="metric-value">${metrics.inProgress}</div></div>
						<div class="metric-box"><div class="metric-label">Accepted</div><div class="metric-value">${metrics.accepted}</div></div>
						<div class="metric-box"><div class="metric-label">Appeals</div><div class="metric-value">${metrics.appealed}</div></div>
						<div class="metric-box"><div class="metric-label">Avg. Resolution Time</div><div class="metric-value">${metrics.avgResolution} hrs</div></div>
						<div class="metric-box"><div class="metric-label">Avg. User Rating</div><div class="metric-value">${metrics.avgRating} / 5 ★</div></div>
					</div>

					<div class="section-title">Complaint Status Breakdown</div>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Title</th>
								<th>Status</th>
								<th>Date Submitted</th>
							</tr>
						</thead>
						<tbody>
							${filteredComplaints.slice(0, 50).map(complaint => {
				const status = complaint.currentStatus || 'N/A';
				const statusClass = ['resolved', 'closed', 'completed'].includes(status.toLowerCase()) ? 'status-resolved' :
					status.toLowerCase() === 'pending' ? 'status-pending' :
						status.toLowerCase() === 'appealed' ? 'status-appealed' : 'status-progress';
				return `
									<tr>
										<td>#${complaint.id}</td>
										<td>${complaint.title || 'N/A'}</td>
										<td class="${statusClass}">${status.replace('_', ' ').toUpperCase()}</td>
										<td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
									</tr>
								`;
			}).join('')}
						</tbody>
					</table>
					${filteredComplaints.length > 50 ? `<p style="text-align: center; color: #6B7280; margin-top: 15px; font-style: italic;">Showing first 50 of ${filteredComplaints.length} complaints</p>` : ''}

					<div class="footer">
						<p><strong>CityZen Authority Analytics System</strong></p>
						<p>This is an automatically generated report</p>
					</div>
				</body>
				</html>
			`;

			const { uri } = await Print.printToFileAsync({ html: htmlContent });

			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(uri, {
					UTI: '.pdf',
					mimeType: 'application/pdf',
					dialogTitle: 'Analytics Report'
				});
			}
			setShowExportModal(false);
		} catch (error) {
			console.error('PDF Generation Error:', error);
			Alert.alert('Error', 'Failed to generate PDF.');
		}
	};

	const chartData = {
		labels: ['Pending', 'Accepted', 'Active', 'Resolved', 'Appealed'],
		datasets: [{ data: [metrics.pending, metrics.accepted, metrics.inProgress, metrics.resolved, metrics.appealed] }]
	};

	const heatmapPoints = filteredComplaints
		.filter(c => c.latitude && c.longitude)
		.map(c => ({
			latitude: parseFloat(c.latitude),
			longitude: parseFloat(c.longitude),
			weight: 1
		}));

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
			{/* Improved Header */}
			<View style={styles.header}>
				<View>
					<Text style={styles.headerSubtitle}>Performance Overview</Text>
					<Text style={styles.headerTitle}>Analytics</Text>
				</View>
				<TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.iconButton}>
					<Download size={22} color="#1E88E5" />
				</TouchableOpacity>
			</View>

			{/* Aligned Filter Chips - Non-scrollable Row */}
			<View style={styles.filterSection}>
				<View style={styles.filterRow}>
					{['all', 'week'].map(period => (
						<TouchableOpacity
							key={period}
							style={[styles.chip, selectedPeriod === period && styles.chipActive]}
							onPress={() => setSelectedPeriod(period)}
						>
							<Text style={[styles.chipText, selectedPeriod === period && styles.chipTextActive]}>
								{period === 'all' ? 'All Time' : '7 Days'}
							</Text>
						</TouchableOpacity>
					))}
					<TouchableOpacity
						style={[styles.chip, { flex: 1.5 }, (selectedPeriod === 'month' || selectedPeriod === 'year') && styles.chipActive]}
						onPress={() => setShowFilterModal(true)}
					>
						<Calendar size={14} color={selectedPeriod === 'month' || selectedPeriod === 'year' ? "#FFF" : "#6B7280"} style={{ marginRight: 6 }} />
						<Text style={[styles.chipText, (selectedPeriod === 'month' || selectedPeriod === 'year') && styles.chipTextActive]} numberOfLines={1}>
							{selectedPeriod === 'month' ? `${months[selectedMonth].substring(0, 3)} ${selectedYear}` :
								selectedPeriod === 'year' ? `${selectedYear}` : 'Custom'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* KPI Cards with Border Accents */}
			<View style={styles.metricsGrid}>
				<MetricCard
					label="Total Cases" value={metrics.total} color="#3B82F6" loading={loading}
					onPress={() => openMetricsModal('total')}
				/>
				<MetricCard
					label="Resolved" value={metrics.resolved} color="#10B981" loading={loading}
					onPress={() => openMetricsModal('resolved')}
				/>
				<MetricCard
					label="Pending" value={metrics.pending} color="#F59E0B" loading={loading}
					onPress={() => openMetricsModal('pending')}
				/>
				<MetricCard
					label="Appeals" value={metrics.appealed} color="#EF4444" loading={loading}
					onPress={() => openMetricsModal('appealed')}
				/>

				<MetricCard
					label="Accepted" value={metrics.accepted} color="#6366F1" loading={loading}
					onPress={() => openMetricsModal('accepted')}
				/>
				<MetricCard
					label="In Progress" value={metrics.inProgress} color="#8B5CF6" loading={loading}
					onPress={() => openMetricsModal('inProgress')}
				/>

				{/* Secondary Metrics */}
				<View style={styles.secondaryMetricContainer}>
					<View style={styles.secondaryCard}>
						<TrendingUp size={18} color="#1E88E5" />
						<View style={{ marginLeft: 10 }}>
							<Text style={styles.secondaryLabel}>Avg. Resolution</Text>
							<Text style={styles.secondaryValue}>{metrics.avgResolution}h</Text>
						</View>
					</View>
					<View style={styles.secondaryCard}>
						<CheckCircle size={18} color="#10B981" />
						<View style={{ marginLeft: 10 }}>
							<Text style={styles.secondaryLabel}>Citizen Rating</Text>
							<Text style={styles.secondaryValue}>{metrics.avgRating}/5.0</Text>
						</View>
					</View>
				</View>
			</View>

			{/* Charts Section */}
			<View style={styles.sectionCard}>
				<View style={styles.sectionHeader}>
					<View style={styles.sectionTitleRow}>
						<BarChart3 size={20} color="#1E88E5" />
						<Text style={styles.sectionTitle}>Department Workload</Text>
					</View>
					<TouchableOpacity onPress={() => setShowChart(!showChart)}>
						<Text style={styles.toggleText}>{showChart ? 'Hide' : 'Show'}</Text>
					</TouchableOpacity>
				</View>
				{showChart && (
					<BarChart
						data={chartData}
						width={screenWidth - 64}
						height={200}
						chartConfig={chartConfig}
						style={styles.chartStyle}
						fromZero
						showValuesOnTopOfBars
					/>
				)}
			</View>

			{/* Map Section */}
			<View style={styles.sectionCard}>
				<View style={styles.sectionHeader}>
					<View style={styles.sectionTitleRow}>
						<MapIcon size={18} color="#1E88E5" />
						<Text style={styles.sectionTitle}>Geospatial Clusters</Text>
					</View>
					<TouchableOpacity onPress={() => setShowMap(!showMap)}>
						<Text style={styles.toggleText}>{showMap ? 'Hide' : 'Show'}</Text>
					</TouchableOpacity>
				</View>
				{showMap && (
					<View style={styles.mapWrapper}>
						<MapView
							provider={PROVIDER_GOOGLE}
							style={styles.map}
							initialRegion={{ latitude: 23.8103, longitude: 90.4125, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
						>
							{filteredComplaints.filter(c => c.latitude).map((c, i) => (
								<Marker key={i} coordinate={{ latitude: parseFloat(c.latitude), longitude: parseFloat(c.longitude) }} pinColor="#1E88E5" />
							))}
						</MapView>
					</View>
				)}
			</View>

			{/* Filter Modal */}
			<Modal visible={showFilterModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Time Period</Text>
							<TouchableOpacity onPress={() => setShowFilterModal(false)}>
								<X size={24} color="#374151" />
							</TouchableOpacity>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							<Text style={styles.modalLabel}>SELECT TYPE</Text>
							<View style={styles.filterGrid}>
								{['month', 'year'].map(p => (
									<TouchableOpacity
										key={p}
										style={[styles.periodChip, selectedPeriod === p && styles.periodChipActive]}
										onPress={() => setSelectedPeriod(p)}
									>
										<Text style={[styles.periodChipText, selectedPeriod === p && styles.periodChipTextActive]}>
											{p.charAt(0).toUpperCase() + p.slice(1)}
										</Text>
									</TouchableOpacity>
								))}
							</View>

							{selectedPeriod === 'month' && (
								<View style={styles.selectionSection}>
									<Text style={styles.modalLabel}>SELECT MONTH</Text>
									<View style={styles.monthGrid}>
										{months.map((m, idx) => (
											<TouchableOpacity
												key={m}
												style={[styles.monthChip, selectedMonth === idx && styles.monthChipActive]}
												onPress={() => setSelectedMonth(idx)}
											>
												<Text style={[styles.monthChipText, selectedMonth === idx && styles.monthChipTextActive]}>
													{m.substring(0, 3)}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								</View>
							)}

							{(selectedPeriod === 'month' || selectedPeriod === 'year') && (
								<View style={styles.selectionSection}>
									<Text style={styles.modalLabel}>SELECT YEAR</Text>
									<View style={styles.filterGrid}>
										{years.map(y => (
											<TouchableOpacity
												key={y}
												style={[styles.periodChip, selectedYear === y && styles.periodChipActive]}
												onPress={() => setSelectedYear(y)}
											>
												<Text style={[styles.periodChipText, selectedYear === y && styles.periodChipTextActive]}>
													{y}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								</View>
							)}

							<TouchableOpacity
								style={styles.applyButton}
								onPress={() => setShowFilterModal(false)}
							>
								<Text style={styles.applyButtonText}>Apply Filter</Text>
							</TouchableOpacity>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Export Modal */}
			<Modal visible={showExportModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Export Report</Text>
							<TouchableOpacity onPress={() => setShowExportModal(false)}>
								<X size={24} color="#374151" />
							</TouchableOpacity>
						</View>
						<Text style={styles.modalText}>
							Generate a professional PDF report for <Text style={{ fontWeight: 'bold' }}>{selectedPeriod === 'all' ? 'All Time' : selectedPeriod === 'month' ? `${months[selectedMonth]} ${selectedYear}` : selectedPeriod === 'year' ? `Year ${selectedYear}` : selectedPeriod}</Text>?
						</Text>
						<TouchableOpacity style={styles.applyButton} onPress={generatePDF}>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
								<Download size={20} color="white" />
								<Text style={styles.applyButtonText}>Generate PDF</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

// Sub-component for KPI Cards
const MetricCard = ({ label, value, color, loading, onPress }) => (
	<TouchableOpacity style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]} onPress={onPress}>
		<Text style={styles.metricLabel}>{label}</Text>
		{loading ? <ActivityIndicator size="small" color="#1E88E5" /> : <Text style={styles.metricValue}>{value}</Text>}
	</TouchableOpacity>
);

const chartConfig = {
	backgroundColor: "#ffffff",
	backgroundGradientFrom: "#ffffff",
	backgroundGradientTo: "#ffffff",
	decimalPlaces: 0,
	color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
	labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
	style: {
		borderRadius: 16
	},
	propsForDots: {
		r: "6",
		strokeWidth: "2",
		stroke: "#ffa726"
	},
	barPercentage: 0.6,
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F3F4F6' },
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		paddingHorizontal: 20,
		paddingTop: 30,
		paddingBottom: 20,
		backgroundColor: '#FFF'
	},
	headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
	headerSubtitle: { fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
	iconButton: { padding: 10, backgroundColor: '#EFF6FF', borderRadius: 12 },
	filterSection: { backgroundColor: '#FFF', paddingBottom: 15 },
	filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
	chip: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 8,
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: '#F3F4F6',
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	chipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
	chipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
	chipTextActive: { color: '#FFF', fontWeight: '600' },
	metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between' },
	metricCard: {
		backgroundColor: '#FFF',
		borderRadius: 12,
		padding: 16,
		width: '48%',
		marginBottom: 12,
		...Platform.select({
			ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
			android: { elevation: 2 }
		})
	},
	metricLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
	metricValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
	secondaryMetricContainer: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 4 },
	secondaryCard: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF',
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		...Platform.select({
			ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
			android: { elevation: 2 }
		})
	},
	secondaryLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
	secondaryValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
	sectionCard: {
		backgroundColor: '#FFF',
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 16,
		padding: 16,
		elevation: 1,
		...Platform.select({
			ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
		})
	},
	sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
	sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
	toggleText: { fontSize: 12, color: '#1E88E5', fontWeight: '600' },
	chartStyle: { marginLeft: -16, borderRadius: 16 },
	mapWrapper: { height: 220, borderRadius: 12, overflow: 'hidden' },
	map: { width: '100%', height: '100%' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400 },
	modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
	modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
	modalText: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
	modalLabel: { fontSize: 11, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 12, marginTop: 16, letterSpacing: 1 },
	selectionSection: { marginTop: 8 },
	filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	periodChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', minWidth: 90, alignItems: 'center' },
	periodChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
	periodChipText: { fontSize: 14, color: '#6B7280' },
	periodChipTextActive: { color: 'white', fontWeight: 'bold' },
	monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
	monthChip: { width: '23%', paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white' },
	monthChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
	monthChipText: { fontSize: 12, color: '#6B7280' },
	monthChipTextActive: { color: 'white', fontWeight: 'bold' },
	applyButton: { backgroundColor: '#1E88E5', paddingVertical: 14, borderRadius: 12, marginTop: 24, alignItems: 'center' },
	applyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
