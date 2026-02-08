import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Download, TrendingUp, CheckCircle, BarChart3, Map as MapIcon, X } from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function AuthorityAnalyticsScreen() {
	const navigation = useNavigation();
	const [metrics, setMetrics] = useState({
		total: 0,
		resolved: 0,
		pending: 0,
		appealed: 0,
		accepted: 0,
		inProgress: 0,
		avgResolution: 0,
		avgRating: 0,
	});
	const [deptComplaints, setDeptComplaints] = useState([]);
	const [filteredComplaints, setFilteredComplaints] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedPeriod, setSelectedPeriod] = useState('all');
	const [showChart, setShowChart] = useState(true);
	const [showMap, setShowMap] = useState(true);
	const [showExportModal, setShowExportModal] = useState(false);

	useEffect(() => {
		fetchAnalytics();
	}, []);

	useEffect(() => {
		filterByPeriod(selectedPeriod);
	}, [selectedPeriod, deptComplaints]);

	const fetchAnalytics = async () => {
		setLoading(true);
		try {
			let companyId = await AsyncStorage.getItem('authorityCompanyId');
			if (!companyId) {
				const userDataStr = await AsyncStorage.getItem('userData');
				if (userDataStr) {
					const userData = JSON.parse(userDataStr);
					companyId = userData.companyId || userData.authorityCompanyId;
				}
			}

			let response;
			if (companyId) {
				response = await api.get(`/complaints/authority/${companyId}?limit=100`);
			} else {
				response = await api.get('/complaints?limit=100');
			}

			const complaints = response.data.complaints || response.data;
			setDeptComplaints(complaints);
		} catch (e) {
			console.error("Analytics Error:", e);
		} finally {
			setLoading(false);
		}
	};

	const filterByPeriod = (period) => {
		const now = new Date();
		let filtered = [...deptComplaints];

		if (period === 'week') {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			filtered = deptComplaints.filter(c => new Date(c.createdAt) >= weekAgo);
		} else if (period === 'month') {
			const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
			filtered = deptComplaints.filter(c => new Date(c.createdAt) >= monthAgo);
		} else if (period === 'year') {
			const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
			filtered = deptComplaints.filter(c => new Date(c.createdAt) >= yearAgo);
		}

		setFilteredComplaints(filtered);
		calculateMetrics(filtered);
	};

	const calculateMetrics = (complaints) => {
		let total = complaints.length;
		let resolved = 0;
		let pending = 0;
		let appealed = 0;
		let accepted = 0;
		let inProgress = 0;
		let resolutionTimes = [];

		for (const c of complaints) {
			const status = c.currentStatus ? c.currentStatus.toLowerCase() : '';

			if (status === 'resolved' || status === 'closed' || status === 'completed') {
				resolved++;
				if (c.createdAt && c.updatedAt) {
					const created = new Date(c.createdAt).getTime();
					const updated = new Date(c.updatedAt).getTime();
					if (updated > created) {
						resolutionTimes.push(updated - created);
					}
				}
			}
			else if (status === 'pending') pending++;
			else if (status === 'appealed') appealed++;
			else if (status === 'accepted') accepted++;
			else if (status === 'in_progress' || status === 'assigned') inProgress++;
		}

		const avgResolution = resolutionTimes.length > 0
			? parseFloat((resolutionTimes.reduce((sum, ms) => sum + ms, 0) / resolutionTimes.length / 1000 / 60 / 60).toFixed(1))
			: 0;

		const ratings = complaints.filter(c => c.rating != null).map(c => c.rating);
		const avgRating = ratings.length > 0
			? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
			: 0;

		setMetrics({ total, resolved, pending, appealed, accepted, inProgress, avgResolution, avgRating });
	};

	const openMetricsModal = (type) => {
		const titleMap = {
			'total': 'Total Complaints',
			'resolved': 'Resolved Complaints',
			'pending': 'Pending Complaints',
			'appealed': 'Appealed Complaints',
		};

		const filtered = getFilteredComplaints(type);
		navigation.navigate('AuthorityComplaintList', {
			statusFilter: type,
			title: titleMap[type] || 'Complaints',
			complaints: filtered
		});
	};

	const getFilteredComplaints = (metricType) => {
		if (!metricType) return [];
		if (metricType === 'total') return filteredComplaints;

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
				'month': 'This Month',
				'year': 'This Year'
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
								<th>Ward</th>
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
										<td>${complaint.ward || 'Unknown'}</td>
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
		labels: ['Pending', 'Accepted', 'Progress', 'Resolved', 'Appeals'],
		datasets: [{
			data: [
				metrics.pending || 0,
				metrics.accepted || 0,
				metrics.inProgress || 0,
				metrics.resolved || 0,
				metrics.appealed || 0
			]
		}]
	};

	const heatmapPoints = filteredComplaints
		.filter(c => c.latitude && c.longitude)
		.map(c => ({
			latitude: parseFloat(c.latitude),
			longitude: parseFloat(c.longitude),
			weight: 1
		}));

	const mapRegion = heatmapPoints.length > 0 ? {
		latitude: heatmapPoints.reduce((sum, p) => sum + p.latitude, 0) / heatmapPoints.length,
		longitude: heatmapPoints.reduce((sum, p) => sum + p.longitude, 0) / heatmapPoints.length,
		latitudeDelta: 0.1,
		longitudeDelta: 0.1,
	} : {
		latitude: 23.8103,
		longitude: 90.4125,
		latitudeDelta: 0.1,
		longitudeDelta: 0.1,
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>Analytics Dashboard</Text>
				<TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.downloadBtn}>
					<Download size={20} color="#1E88E5" />
				</TouchableOpacity>
			</View>

			{/* Time Period Filters */}
			<View style={styles.filterRow}>
				{['all', 'week', 'month', 'year'].map(period => (
					<TouchableOpacity
						key={period}
						style={[styles.filterChip, selectedPeriod === period && styles.filterChipActive]}
						onPress={() => setSelectedPeriod(period)}
					>
						<Text style={[styles.filterText, selectedPeriod === period && styles.filterTextActive]}>
							{period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* KPI Cards */}
			<View style={styles.metricsGrid}>
				<TouchableOpacity style={styles.metricCard} onPress={() => openMetricsModal('total')}>
					<Text style={styles.metricLabel}>TOTAL CASES</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator /> : metrics.total}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.metricCard} onPress={() => openMetricsModal('resolved')}>
					<Text style={styles.metricLabel}>RESOLVED</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator /> : metrics.resolved}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.metricCard} onPress={() => openMetricsModal('pending')}>
					<Text style={styles.metricLabel}>PENDING</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator /> : metrics.pending}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.metricCard} onPress={() => openMetricsModal('appealed')}>
					<Text style={styles.metricLabel}>APPEALS</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator /> : metrics.appealed}</Text>
				</TouchableOpacity>

				<View style={styles.metricCard}>
					<View style={styles.iconRow}>
						<TrendingUp size={20} color="#1E88E5" />
						<Text style={styles.metricLabel}>Avg. Resolution Time</Text>
					</View>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator /> : `${metrics.avgResolution} Hours`}</Text>
				</View>

				<View style={styles.metricCard}>
					<View style={styles.iconRow}>
						<CheckCircle size={20} color="#10B981" />
						<Text style={styles.metricLabel}>Citizen Rating</Text>
					</View>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator /> : `${metrics.avgRating} / 5 ★`}</Text>
				</View>
			</View>

			{/* Department Workload Chart */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Department Workload</Text>
					<TouchableOpacity onPress={() => setShowChart(!showChart)}>
						<Text style={styles.toggleText}>{showChart ? 'Hide Chart' : 'Show Chart'}</Text>
					</TouchableOpacity>
				</View>

				{showChart && (
					<BarChart
						data={chartData}
						width={screenWidth - 48}
						height={220}
						yAxisLabel=""
						chartConfig={{
							backgroundColor: '#ffffff',
							backgroundGradientFrom: '#ffffff',
							backgroundGradientTo: '#ffffff',
							decimalPlaces: 0,
							color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
							labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
							barPercentage: 0.7,
						}}
						style={styles.chart}
						fromZero
						showValuesOnTopOfBars
					/>
				)}
			</View>

			{/* Recurring Issue Hotspots Heatmap */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Recurring Issue Hotspots</Text>
					<TouchableOpacity onPress={() => setShowMap(!showMap)}>
						<Text style={styles.toggleText}>{showMap ? 'Hide Map' : 'Show Map'}</Text>
					</TouchableOpacity>
				</View>

				{showMap && (
					<View style={styles.mapContainer}>
						<MapView
							provider={PROVIDER_GOOGLE}
							style={styles.map}
							initialRegion={mapRegion}
							region={mapRegion}
						>
							{heatmapPoints.map((point, index) => (
								<Marker
									key={index}
									coordinate={{ latitude: point.latitude, longitude: point.longitude }}
									pinColor="#F59E0B"
								/>
							))}
						</MapView>
						<View style={styles.legend}>
							<Text style={styles.legendTitle}>Problem Concentration</Text>
							<View style={styles.legendRow}>
								<View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
								<Text style={styles.legendText}>Pending</Text>
								<View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
								<Text style={styles.legendText}>Active</Text>
								<View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
								<Text style={styles.legendText}>Resolved</Text>
							</View>
						</View>
					</View>
				)}
			</View>

			{/* Export Modal */}
			<Modal visible={showExportModal} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Export Analytics Report</Text>
							<TouchableOpacity onPress={() => setShowExportModal(false)}>
								<X size={24} color="#374151" />
							</TouchableOpacity>
						</View>
						<Text style={styles.modalText}>
							Export analytics report for <Text style={{ fontWeight: 'bold' }}>{selectedPeriod === 'all' ? 'All Time' : selectedPeriod}</Text>?
						</Text>
						<TouchableOpacity style={styles.exportButton} onPress={generatePDF}>
							<Download size={20} color="white" />
							<Text style={styles.exportButtonText}>Generate PDF Report</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F9FAFB' },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
	title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
	downloadBtn: { padding: 8 },
	filterRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 24 },
	filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
	filterChipActive: { backgroundColor: '#1E88E5' },
	filterText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
	filterTextActive: { color: 'white', fontWeight: 'bold' },
	metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 24 },
	metricCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, width: '48%', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
	metricLabel: { fontSize: 11, color: '#6B7280', marginBottom: 8, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
	metricValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
	iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
	section: { backgroundColor: 'white', marginHorizontal: 24, marginBottom: 24, borderRadius: 12, padding: 16, elevation: 1 },
	sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
	sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
	toggleText: { fontSize: 14, color: '#1E88E5', fontWeight: '600' },
	chart: { marginVertical: 8, borderRadius: 16 },
	mapContainer: { position: 'relative' },
	map: { width: '100%', height: 300, borderRadius: 12 },
	legend: { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'white', padding: 12, borderRadius: 8, elevation: 2 },
	legendTitle: { fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
	legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	legendDot: { width: 12, height: 12, borderRadius: 6 },
	legendText: { fontSize: 11, color: '#6B7280' },
	modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
	modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '85%', maxWidth: 400 },
	modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
	modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
	modalText: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
	exportButton: { backgroundColor: '#1E88E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, gap: 8 },
	exportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
